import fs from "fs"
import path from "path"
import {
  fetchXeroConnections,
  getXeroAccessToken,
  refreshXeroToken,
  saveXeroTokens,
  xeroContactToCustomerSnapshot,
  type XeroContact,
} from "./client"
import { queryOne } from "@/lib/db"

export type XeroOrganisationExport = {
  tenantId: string
  tenantName: string
  customerCount: number
  contacts: XeroContact[]
  agreementSnapshots: ReturnType<typeof xeroContactToCustomerSnapshot>[]
}

export type XeroCustomersExport = {
  exportedAt: string
  organisationCount: number
  totalCustomers: number
  organisations: XeroOrganisationExport[]
}

async function fetchAllCustomerContacts(
  accessToken: string,
  tenantId: string,
): Promise<XeroContact[]> {
  const contacts: XeroContact[] = []
  let page = 1

  while (true) {
    const url = new URL("https://api.xero.com/api.xro/2.0/Contacts")
    url.searchParams.set("where", "IsCustomer==true")
    url.searchParams.set("page", String(page))

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Xero-Tenant-Id": tenantId,
        Accept: "application/json",
      },
    })
    if (!res.ok) {
      throw new Error(`Xero contacts page ${page} failed (${tenantId}): ${await res.text()}`)
    }

    const data = (await res.json()) as { Contacts?: XeroContact[] }
    const batch = data.Contacts ?? []
    if (batch.length === 0) break
    contacts.push(...batch)
    if (batch.length < 100) break
    page += 1
  }

  return contacts.sort((a, b) => a.Name.localeCompare(b.Name, "en-GB"))
}

/** Pull all active customers from every Xero org linked to the current OAuth connection. */
export async function exportAllXeroCustomers(): Promise<XeroCustomersExport> {
  const auth = await getXeroAccessToken()
  if (!auth) throw new Error("Xero not connected — connect from /admin first")

  const connections = await fetchXeroConnections(auth.token)
  if (connections.length === 0) throw new Error("No Xero organisations on this connection")

  const organisations: XeroOrganisationExport[] = []

  for (const conn of connections) {
    const contacts = await fetchAllCustomerContacts(auth.token, conn.tenantId)
    organisations.push({
      tenantId: conn.tenantId,
      tenantName: conn.tenantName,
      customerCount: contacts.length,
      contacts,
      agreementSnapshots: contacts.map((c) => xeroContactToCustomerSnapshot(c)),
    })
  }

  const totalCustomers = organisations.reduce((n, o) => n + o.customerCount, 0)

  return {
    exportedAt: new Date().toISOString(),
    organisationCount: organisations.length,
    totalCustomers,
    organisations,
  }
}

function csvEscape(value: string | number | undefined | null): string {
  const s = value == null ? "" : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function contactsToCsv(exportData: XeroCustomersExport): string {
  const headers = [
    "organisation",
    "tenantId",
    "xeroContactId",
    "companyName",
    "customerNumber",
    "contactName",
    "contactEmail",
    "contactPhone",
    "accountsContact",
    "accountsEmail",
    "billingAddress1",
    "billingAddress2",
    "billingAddress3",
    "postcode",
    "country",
    "xeroEmail",
    "xeroFirstName",
    "xeroLastName",
    "allAddressesJson",
    "allPhonesJson",
    "contactPersonsJson",
  ]

  const rows = [headers.join(",")]

  for (const org of exportData.organisations) {
    for (let i = 0; i < org.contacts.length; i++) {
      const raw = org.contacts[i]
      const snap = org.agreementSnapshots[i]
      rows.push(
        [
          org.tenantName,
          org.tenantId,
          snap.xeroContactId,
          snap.companyName,
          snap.customerNumber,
          snap.contactName,
          snap.contactEmail,
          snap.contactPhone,
          snap.accountsContact,
          snap.accountsEmail,
          snap.billingAddress1,
          snap.billingAddress2,
          snap.billingAddress3,
          snap.postcode,
          snap.country,
          raw.EmailAddress,
          raw.FirstName,
          raw.LastName,
          JSON.stringify(raw.Addresses ?? []),
          JSON.stringify(raw.Phones ?? []),
          JSON.stringify(raw.ContactPersons ?? []),
        ]
          .map(csvEscape)
          .join(","),
      )
    }
  }

  return rows.join("\r\n") + "\r\n"
}

function contactsToMarkdown(exportData: XeroCustomersExport): string {
  const lines: string[] = [
    "# Xero customer export",
    "",
    `Exported: ${exportData.exportedAt}`,
    `Organisations: ${exportData.organisationCount}`,
    `Total customers: ${exportData.totalCustomers}`,
    "",
    "Use `xero-customers-export.json` for full API payloads (addresses, phones, contact persons).",
    "Use `xero-customers-export.csv` for Excel / filtering.",
    "",
  ]

  for (const org of exportData.organisations) {
    lines.push(`## ${org.tenantName}`, "")
    lines.push(`Tenant ID: \`${org.tenantId}\` · ${org.customerCount} customers`, "")

    for (let i = 0; i < org.contacts.length; i++) {
      const raw = org.contacts[i]
      const snap = org.agreementSnapshots[i]
      lines.push(`### ${snap.companyName}`)
      lines.push("")
      lines.push("| Field | Value |")
      lines.push("| --- | --- |")
      lines.push(`| Xero contact ID | \`${snap.xeroContactId}\` |`)
      lines.push(`| Customer number | ${snap.customerNumber ?? "—"} |`)
      lines.push(`| Contact | ${snap.contactName ?? "—"} |`)
      lines.push(`| Email | ${snap.contactEmail ?? "—"} |`)
      lines.push(`| Phone | ${snap.contactPhone ?? "—"} |`)
      lines.push(`| Accounts contact | ${snap.accountsContact ?? "—"} |`)
      lines.push(`| Accounts email | ${snap.accountsEmail ?? "—"} |`)
      lines.push(`| Address 1 | ${snap.billingAddress1 ?? "—"} |`)
      lines.push(`| Address 2 | ${snap.billingAddress2 ?? "—"} |`)
      lines.push(`| Address 3 | ${snap.billingAddress3 ?? "—"} |`)
      lines.push(`| Postcode | ${snap.postcode ?? "—"} |`)
      lines.push(`| Country | ${snap.country ?? "—"} |`)
      if (raw.ContactPersons?.length) {
        lines.push(`| Contact persons | ${raw.ContactPersons.length} (see JSON) |`)
      }
      lines.push("")
    }
  }

  return lines.join("\n")
}

export async function writeXeroCustomerExports(rootDir = process.cwd()): Promise<XeroCustomersExport> {
  const data = await exportAllXeroCustomers()

  const jsonPath = path.join(rootDir, "xero-customers-export.json")
  const csvPath = path.join(rootDir, "xero-customers-export.csv")
  const mdPath = path.join(rootDir, "xero-customers-export.md")

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8")
  fs.writeFileSync(csvPath, contactsToCsv(data), "utf8")
  fs.writeFileSync(mdPath, contactsToMarkdown(data), "utf8")

  return data
}

/** Ensure token is fresh before a long export (refresh once up front). */
export async function ensureXeroTokenFresh(): Promise<void> {
  const row = await queryOne<{
    refresh_token: string
    tenant_id: string
    tenant_name: string | null
    expires_at: number
  }>("SELECT * FROM xero_tokens WHERE id = 1")
  if (!row) throw new Error("Xero not connected")

  if (Date.now() >= row.expires_at - 60_000) {
    const refreshed = await refreshXeroToken(row.refresh_token)
    await saveXeroTokens(
      refreshed.access_token,
      refreshed.refresh_token,
      refreshed.expires_in,
      row.tenant_id,
      row.tenant_name ?? undefined,
    )
  }
}
