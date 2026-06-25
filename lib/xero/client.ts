import { execute, getSetting, queryOne, setSetting } from "@/lib/db"
import {
  recomputeContactStatus,
  upsertContactFromSnapshot,
} from "@/lib/crm/contacts"
import type { CustomerSnapshot, OrderRecord } from "@/lib/proposals/orders"
import type { OrderInput, OrderTotals } from "@/lib/proposals/types"
import { getCatalogueLabel } from "@/lib/proposals/catalogue"
import { MAX_ADDITIONAL_CONTACT_PERSONS } from "@/lib/crm/contact-persons"
import type { XeroContactPerson } from "@/lib/xero/types"

const XERO_AUTH = "https://login.xero.com/identity/connect/authorize"
const XERO_TOKEN = "https://identity.xero.com/connect/token"
const XERO_CONNECTIONS = "https://api.xero.com/connections"

// Granular scopes only — apps created on/after 2026-03-02 reject deprecated
// accounting.transactions / accounting.transactions.read (invalid_scope). See commit 001ccb5.
export const XERO_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "accounting.contacts",
  "accounting.contacts.read",
  "accounting.invoices",
  "accounting.invoices.read",
  "accounting.settings.read",
].join(" ")

const LOCKED_TENANT_KEY = "xero_locked_tenant_id"

export type XeroAddress = {
  AddressType: "POBOX" | "STREET" | string
  AddressLine1?: string
  AddressLine2?: string
  AddressLine3?: string
  AddressLine4?: string
  City?: string
  Region?: string
  PostalCode?: string
  Country?: string
  AttentionTo?: string
}

export type XeroPhone = {
  PhoneType: "DEFAULT" | "DDI" | "MOBILE" | "FAX" | "OFFICE" | string
  PhoneNumber?: string
  PhoneAreaCode?: string
  PhoneCountryCode?: string
}

export type XeroContact = {
  ContactID: string
  Name: string
  FirstName?: string
  LastName?: string
  AccountNumber?: string
  ContactNumber?: string
  EmailAddress?: string
  Addresses?: XeroAddress[]
  Phones?: XeroPhone[]
  ContactPersons?: {
    FirstName?: string
    LastName?: string
    EmailAddress?: string
    IncludeInEmails?: boolean
  }[]
  Balances?: {
    AccountsReceivable?: { Outstanding?: number; Overdue?: number }
    AccountsPayable?: { Outstanding?: number; Overdue?: number }
  }
}

export type XeroInvoiceSummary = {
  invoiceId: string
  invoiceNumber?: string
  status: string
  total?: number
  amountDue?: number
  amountPaid?: number
  dueDate?: string
  reference?: string
}

export type XeroContactArSummary = {
  outstanding?: number
  overdue?: number
}

function billingAddress(contact: XeroContact): XeroAddress | undefined {
  return (
    contact.Addresses?.find((a) => a.AddressType === "POBOX") ??
    contact.Addresses?.find((a) => a.AddressType === "STREET") ??
    contact.Addresses?.[0]
  )
}

function formatPhone(phones?: XeroPhone[]): string | undefined {
  if (!phones?.length) return undefined
  const order = ["MOBILE", "DEFAULT", "OFFICE", "DDI", "FAX"]
  const sorted = [...phones].sort(
    (a, b) => order.indexOf(a.PhoneType) - order.indexOf(b.PhoneType),
  )
  const p = sorted.find((x) => x.PhoneNumber?.trim()) ?? phones[0]
  if (!p?.PhoneNumber) return undefined
  const parts = [p.PhoneCountryCode, p.PhoneAreaCode, p.PhoneNumber].filter(Boolean)
  return parts.join(" ").trim()
}

function personName(first?: string, last?: string): string {
  return `${first ?? ""} ${last ?? ""}`.trim()
}

function splitPrimaryName(full?: string): { firstName?: string; lastName?: string } {
  if (!full?.trim()) return {}
  const parts = full.trim().split(/\s+/)
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") || undefined }
}

function mapXeroContactPersons(
  raw?: { FirstName?: string; LastName?: string; EmailAddress?: string; IncludeInEmails?: boolean }[],
): XeroContactPerson[] {
  if (!raw?.length) return []
  return raw.slice(0, MAX_ADDITIONAL_CONTACT_PERSONS).map((p) => ({
    firstName: p.FirstName,
    lastName: p.LastName,
    emailAddress: p.EmailAddress,
    includeInEmails: p.IncludeInEmails ?? false,
  }))
}

function mapToXeroContactPersons(persons: XeroContactPerson[] | undefined): Record<string, unknown>[] {
  return (persons ?? []).slice(0, MAX_ADDITIONAL_CONTACT_PERSONS).map((p) => ({
    FirstName: p.firstName,
    LastName: p.lastName,
    EmailAddress: p.emailAddress,
    IncludeInEmails: p.includeInEmails ?? false,
  }))
}

/** Normalize legacy Xero data: header primary + ContactPersons[] without duplicating primary in additional. */
function normalizeXeroPeople(contact: XeroContact): {
  primaryName?: string
  primaryEmail?: string
  additional: XeroContactPerson[]
} {
  const headerName = personName(contact.FirstName, contact.LastName)
  const headerEmail = contact.EmailAddress?.trim()
  const rawPersons = mapXeroContactPersons(contact.ContactPersons)

  let primaryName = headerName || undefined
  let primaryEmail = headerEmail || undefined
  let additional = rawPersons

  if (!primaryName && !primaryEmail && rawPersons.length) {
    const pick =
      rawPersons.find((p) => p.includeInEmails) ?? rawPersons[0]!
    primaryName = personName(pick.firstName, pick.lastName) || pick.emailAddress
    primaryEmail = pick.emailAddress ?? primaryEmail
    additional = rawPersons.filter((p) => p !== pick)
  }

  return { primaryName, primaryEmail, additional }
}

/** Map Xero contact → agreement customer block (shared server + client preview). */
export function xeroContactToCustomerSnapshot(contact: XeroContact): CustomerSnapshot {
  const addr = billingAddress(contact)
  const line2Parts = [addr?.AddressLine2, addr?.AddressLine3, addr?.AddressLine4].filter(Boolean)
  const line3Parts = [addr?.City, addr?.Region].filter(Boolean)
  const { primaryName, primaryEmail, additional } = normalizeXeroPeople(contact)
  const attention = addr?.AttentionTo?.trim()

  return {
    xeroContactId: contact.ContactID,
    companyName: contact.Name,
    customerNumber: contact.AccountNumber ?? contact.ContactNumber,
    billingAddress1: addr?.AddressLine1,
    billingAddress2: line2Parts.length ? line2Parts.join(", ") : undefined,
    billingAddress3: line3Parts.length ? line3Parts.join(", ") : undefined,
    postcode: addr?.PostalCode,
    country: addr?.Country ?? "United Kingdom",
    contactName: primaryName || attention || undefined,
    contactPhone: formatPhone(contact.Phones),
    contactEmail: primaryEmail,
    accountsContact: attention || primaryName || undefined,
    accountsEmail: contact.EmailAddress ?? primaryEmail,
    contactPersons: additional.length ? additional : undefined,
    selectedPersonRef: "primary",
  }
}

export function xeroConfig() {
  const clientId = process.env.XERO_CLIENT_ID
  const clientSecret = process.env.XERO_CLIENT_SECRET
  const redirectUri =
    process.env.XERO_REDIRECT_URI ?? "http://localhost:3000/api/xero/callback"
  if (!clientId || !clientSecret) {
    return null
  }
  return { clientId, clientSecret, redirectUri }
}

export function xeroAuthorizeUrl(state: string): string {
  const cfg = xeroConfig()
  if (!cfg) throw new Error("Xero not configured")
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope: XERO_SCOPES,
    state,
  })
  return `${XERO_AUTH}?${params}`
}

export async function exchangeXeroCode(code: string) {
  const cfg = xeroConfig()
  if (!cfg) throw new Error("Xero not configured")
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUri,
  })
  const auth = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64")
  const res = await fetch(XERO_TOKEN, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })
  if (!res.ok) throw new Error(`Xero token exchange failed: ${await res.text()}`)
  return res.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }>
}

export async function refreshXeroToken(refreshToken: string) {
  const cfg = xeroConfig()
  if (!cfg) throw new Error("Xero not configured")
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  })
  const auth = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64")
  const res = await fetch(XERO_TOKEN, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })
  if (!res.ok) throw new Error(`Xero refresh failed: ${await res.text()}`)
  return res.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }>
}

export async function saveXeroTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  tenantId: string,
  tenantName?: string,
) {
  const connections = await fetchXeroConnections(accessToken)
  const locked = await getLockedTenantId()

  if (connections.length === 0) {
    throw new Error("No Xero tenant connected")
  }

  let resolvedTenantId = tenantId
  let resolvedTenantName = tenantName

  if (locked) {
    const match = connections.find((c) => c.tenantId === locked)
    if (!match) throw new Error("Locked Xero tenant is not authorised for this token")
    resolvedTenantId = locked
    resolvedTenantName = match.tenantName
  } else if (connections.length !== 1) {
    throw new Error(
      "Multiple Xero tenants connected; set a locked tenant before connecting",
    )
  } else {
    resolvedTenantId = connections[0]!.tenantId
    resolvedTenantName = connections[0]!.tenantName
    await setLockedTenantId(resolvedTenantId)
  }

  const expiresAt = Date.now() + expiresIn * 1000
  await execute(
    `INSERT INTO xero_tokens (id, access_token, refresh_token, expires_at, tenant_id, tenant_name)
     VALUES (1, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       access_token = excluded.access_token,
       refresh_token = excluded.refresh_token,
       expires_at = excluded.expires_at,
       tenant_id = excluded.tenant_id,
       tenant_name = excluded.tenant_name`,
    [accessToken, refreshToken, expiresAt, resolvedTenantId, resolvedTenantName ?? null],
  )
}

export async function getLockedTenantId(): Promise<string | null> {
  return getSetting(LOCKED_TENANT_KEY)
}

export async function setLockedTenantId(tenantId: string): Promise<void> {
  await setSetting(LOCKED_TENANT_KEY, tenantId)
}

export async function getXeroAccessToken(): Promise<{ token: string; tenantId: string } | null> {
  const row = await queryOne<{
    access_token: string
    refresh_token: string
    expires_at: number
    tenant_id: string
  }>("SELECT * FROM xero_tokens WHERE id = 1")
  if (!row) return null

  const locked = await getLockedTenantId()
  const tenantId = locked ?? row.tenant_id

  if (Date.now() < row.expires_at - 60_000) {
    return { token: row.access_token, tenantId }
  }

  const refreshed = await refreshXeroToken(row.refresh_token)
  await saveXeroTokens(
    refreshed.access_token,
    refreshed.refresh_token,
    refreshed.expires_in,
    tenantId,
  )
  return { token: refreshed.access_token, tenantId }
}

export async function fetchXeroConnections(accessToken: string) {
  const res = await fetch(XERO_CONNECTIONS, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  })
  if (!res.ok) throw new Error(`Xero connections failed: ${await res.text()}`)
  return res.json() as Promise<{ tenantId: string; tenantName: string }[]>
}

export async function fetchXeroContacts(): Promise<XeroContact[]> {
  const auth = await getXeroAccessToken()
  if (!auth) throw new Error("Xero not connected")

  const contacts: XeroContact[] = []
  let page = 1

  while (true) {
    const url = new URL("https://api.xero.com/api.xro/2.0/Contacts")
    url.searchParams.set("where", "IsCustomer==true")
    url.searchParams.set("page", String(page))

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Xero-Tenant-Id": auth.tenantId,
        Accept: "application/json",
      },
    })
    if (!res.ok) throw new Error(`Xero contacts page ${page} failed: ${await res.text()}`)

    const data = (await res.json()) as { Contacts?: XeroContact[] }
    const batch = data.Contacts ?? []
    if (batch.length === 0) break
    contacts.push(...batch)
    if (batch.length < 100) break
    page += 1
  }

  return contacts
}

export async function fetchXeroContact(id: string): Promise<XeroContact | null> {
  const auth = await getXeroAccessToken()
  if (!auth) throw new Error("Xero not connected")
  const res = await fetch(
    `https://api.xero.com/api.xro/2.0/Contacts/${id}?includeBalances=true`,
    {
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Xero-Tenant-Id": auth.tenantId,
      Accept: "application/json",
    },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { Contacts?: XeroContact[] }
  return data.Contacts?.[0] ?? null
}

function snapshotToXeroPayload(snapshot: CustomerSnapshot): Record<string, unknown> {
  const addresses: XeroAddress[] = []
  if (snapshot.billingAddress1 || snapshot.postcode) {
    addresses.push({
      AddressType: "POBOX",
      AddressLine1: snapshot.billingAddress1,
      AddressLine2: snapshot.billingAddress2,
      AddressLine3: snapshot.billingAddress3,
      PostalCode: snapshot.postcode,
      Country: snapshot.country ?? "United Kingdom",
      AttentionTo: snapshot.accountsContact,
    })
  }

  const phones: XeroPhone[] = []
  if (snapshot.contactPhone) {
    phones.push({ PhoneType: "DEFAULT", PhoneNumber: snapshot.contactPhone })
  }

  const primaryParts = splitPrimaryName(snapshot.contactName)
  const payload: Record<string, unknown> = {
    Name: snapshot.companyName,
    EmailAddress: snapshot.accountsEmail ?? snapshot.contactEmail,
    AccountNumber: snapshot.customerNumber,
    IsCustomer: true,
  }
  if (addresses.length) payload.Addresses = addresses
  if (phones.length) payload.Phones = phones
  if (primaryParts.firstName) payload.FirstName = primaryParts.firstName
  if (primaryParts.lastName) payload.LastName = primaryParts.lastName
  if (snapshot.contactEmail && !payload.EmailAddress) payload.EmailAddress = snapshot.contactEmail

  const additional = mapToXeroContactPersons(snapshot.contactPersons)
  if (additional.length) payload.ContactPersons = additional

  return payload
}

async function xeroApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const auth = await getXeroAccessToken()
  if (!auth) throw new Error("Xero not connected")
  return fetch(`https://api.xero.com/api.xro/2.0/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Xero-Tenant-Id": auth.tenantId,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
}

export async function createXeroContact(snapshot: CustomerSnapshot): Promise<XeroContact> {
  const res = await xeroApi("Contacts", {
    method: "PUT",
    body: JSON.stringify({ Contacts: [snapshotToXeroPayload(snapshot)] }),
  })
  if (!res.ok) throw new Error(`Xero create contact failed: ${await res.text()}`)
  const data = (await res.json()) as { Contacts?: XeroContact[] }
  const contact = data.Contacts?.[0]
  if (!contact) throw new Error("Xero create contact returned no contact")
  return contact
}

export async function updateXeroContact(
  contactId: string,
  snapshot: CustomerSnapshot,
): Promise<XeroContact> {
  const payload = snapshotToXeroPayload(snapshot)
  payload.ContactID = contactId
  const res = await xeroApi("Contacts", {
    method: "POST",
    body: JSON.stringify({ Contacts: [payload] }),
  })
  if (!res.ok) throw new Error(`Xero update contact failed: ${await res.text()}`)
  const data = (await res.json()) as { Contacts?: XeroContact[] }
  const contact = data.Contacts?.[0]
  if (!contact) throw new Error("Xero update contact returned no contact")
  return contact
}

export async function syncContactsFromXero(): Promise<{ synced: number }> {
  const contacts = await fetchXeroContacts()
  let synced = 0
  for (const xc of contacts) {
    const snapshot = xeroContactToCustomerSnapshot(xc)
    const contact = await upsertContactFromSnapshot(snapshot)
    await recomputeContactStatus(contact.id)
    synced++
  }
  return { synced }
}

export async function createDraftInvoice(order: OrderRecord): Promise<string> {
  const auth = await getXeroAccessToken()
  if (!auth) throw new Error("Xero not connected")

  const parsed = order.lines as { input: OrderInput; calculated: OrderTotals }
  const xeroContactId = order.customer.xeroContactId
  if (!xeroContactId) throw new Error("Order has no Xero contact ID")

  const accountCode = process.env.XERO_SALES_ACCOUNT_CODE ?? "200"
  const lineItems = parsed.calculated.lines
    .filter((line) => line.qty > 0 && line.includeInPdf !== false)
    .map((line) => ({
      Description: line.description ?? getCatalogueLabel(line.sku),
      Quantity: line.qty,
      UnitAmount: line.netLineTotal / Math.max(line.qty, 1),
      AccountCode: accountCode,
    }))

  if (!lineItems.length) {
    lineItems.push({
      Description: `${order.documentNumber} — Seamcor agreement`,
      Quantity: 1,
      UnitAmount: order.orderTotal ?? parsed.calculated.orderTotal,
      AccountCode: accountCode,
    })
  }

  const res = await xeroApi("Invoices", {
    method: "PUT",
    body: JSON.stringify({
      Invoices: [
        {
          Type: "ACCREC",
          Contact: { ContactID: xeroContactId },
          Status: "DRAFT",
          Reference: order.documentNumber,
          LineItems: lineItems,
        },
      ],
    }),
  })
  if (!res.ok) throw new Error(`Xero create invoice failed: ${await res.text()}`)
  const data = (await res.json()) as { Invoices?: { InvoiceID: string }[] }
  const invoiceId = data.Invoices?.[0]?.InvoiceID
  if (!invoiceId) throw new Error("Xero create invoice returned no ID")
  return invoiceId
}

type XeroInvoiceRaw = {
  InvoiceID: string
  InvoiceNumber?: string
  Status?: string
  Total?: number
  AmountDue?: number
  AmountPaid?: number
  DueDate?: string
  Reference?: string
}

function mapInvoiceSummary(inv: XeroInvoiceRaw): XeroInvoiceSummary {
  return {
    invoiceId: inv.InvoiceID,
    invoiceNumber: inv.InvoiceNumber,
    status: inv.Status ?? "UNKNOWN",
    total: inv.Total,
    amountDue: inv.AmountDue,
    amountPaid: inv.AmountPaid,
    dueDate: inv.DueDate,
    reference: inv.Reference,
  }
}

export async function fetchXeroInvoice(invoiceId: string): Promise<XeroInvoiceSummary | null> {
  const res = await xeroApi(`Invoices/${encodeURIComponent(invoiceId)}`)
  if (!res.ok) return null
  const data = (await res.json()) as { Invoices?: XeroInvoiceRaw[] }
  const inv = data.Invoices?.[0]
  return inv ? mapInvoiceSummary(inv) : null
}

export async function fetchXeroInvoicesForContact(
  xeroContactId: string,
): Promise<XeroInvoiceSummary[]> {
  const url = new URL("https://api.xero.com/api.xro/2.0/Invoices")
  url.searchParams.set("ContactIDs", xeroContactId)
  url.searchParams.set("order", "Date DESC")

  const auth = await getXeroAccessToken()
  if (!auth) throw new Error("Xero not connected")

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Xero-Tenant-Id": auth.tenantId,
      Accept: "application/json",
    },
  })
  if (!res.ok) throw new Error(`Xero invoices list failed: ${await res.text()}`)
  const data = (await res.json()) as { Invoices?: XeroInvoiceRaw[] }
  return (data.Invoices ?? []).map(mapInvoiceSummary)
}

export async function fetchXeroContactAr(
  xeroContactId: string,
): Promise<XeroContactArSummary | null> {
  const contact = await fetchXeroContact(xeroContactId)
  if (!contact?.Balances?.AccountsReceivable) return null
  const ar = contact.Balances.AccountsReceivable
  return { outstanding: ar.Outstanding, overdue: ar.Overdue }
}

export function xeroInvoiceWebUrl(invoiceId: string): string {
  return `https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=${encodeURIComponent(invoiceId)}`
}
