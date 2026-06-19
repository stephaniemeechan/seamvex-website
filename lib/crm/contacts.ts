import { execute, query, queryOne, ensureDb, newId } from "@/lib/db"
import type { CustomerSnapshot } from "@/lib/proposals/orders"

export type ContactStatus = "active" | "inactive"
export type UserRole = "admin" | "standard"

export type ContactRecord = {
  id: string
  xeroContactId: string | null
  companyName: string
  status: ContactStatus
  supportInfo: string | null
  customerNumber: string | null
  billingAddress1: string | null
  billingAddress2: string | null
  billingAddress3: string | null
  postcode: string | null
  country: string | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  accountsContact: string | null
  accountsEmail: string | null
  xeroSyncedAt: string | null
  createdAt: string
  updatedAt: string
}

function rowToContact(row: Record<string, unknown>): ContactRecord {
  return {
    id: row.id as string,
    xeroContactId: (row.xero_contact_id as string | null) ?? null,
    companyName: row.company_name as string,
    status: row.status as ContactStatus,
    supportInfo: (row.support_info as string | null) ?? null,
    customerNumber: (row.customer_number as string | null) ?? null,
    billingAddress1: (row.billing_address1 as string | null) ?? null,
    billingAddress2: (row.billing_address2 as string | null) ?? null,
    billingAddress3: (row.billing_address3 as string | null) ?? null,
    postcode: (row.postcode as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    contactName: (row.contact_name as string | null) ?? null,
    contactPhone: (row.contact_phone as string | null) ?? null,
    contactEmail: (row.contact_email as string | null) ?? null,
    accountsContact: (row.accounts_contact as string | null) ?? null,
    accountsEmail: (row.accounts_email as string | null) ?? null,
    xeroSyncedAt: (row.xero_synced_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function snapshotToContactFields(s: CustomerSnapshot): Partial<ContactRecord> {
  return {
    xeroContactId: s.xeroContactId ?? null,
    companyName: s.companyName,
    customerNumber: s.customerNumber ?? null,
    billingAddress1: s.billingAddress1 ?? null,
    billingAddress2: s.billingAddress2 ?? null,
    billingAddress3: s.billingAddress3 ?? null,
    postcode: s.postcode ?? null,
    country: s.country ?? null,
    contactName: s.contactName ?? null,
    contactPhone: s.contactPhone ?? null,
    contactEmail: s.contactEmail ?? null,
    accountsContact: s.accountsContact ?? null,
    accountsEmail: s.accountsEmail ?? null,
  }
}

export function contactToSnapshot(c: ContactRecord): CustomerSnapshot {
  return {
    xeroContactId: c.xeroContactId ?? undefined,
    companyName: c.companyName,
    customerNumber: c.customerNumber ?? undefined,
    billingAddress1: c.billingAddress1 ?? undefined,
    billingAddress2: c.billingAddress2 ?? undefined,
    billingAddress3: c.billingAddress3 ?? undefined,
    postcode: c.postcode ?? undefined,
    country: c.country ?? undefined,
    contactName: c.contactName ?? undefined,
    contactPhone: c.contactPhone ?? undefined,
    contactEmail: c.contactEmail ?? undefined,
    accountsContact: c.accountsContact ?? undefined,
    accountsEmail: c.accountsEmail ?? undefined,
  }
}

export async function listContacts(opts?: {
  status?: ContactStatus
  q?: string
}): Promise<ContactRecord[]> {
  await ensureDb()
  let sql = "SELECT * FROM contacts WHERE 1=1"
  const params: unknown[] = []
  if (opts?.status) {
    sql += " AND status = ?"
    params.push(opts.status)
  }
  if (opts?.q?.trim()) {
    sql += " AND (company_name LIKE ? OR contact_email LIKE ? OR contact_name LIKE ?)"
    const like = `%${opts.q.trim()}%`
    params.push(like, like, like)
  }
  sql += " ORDER BY company_name ASC"
  const rows = await query<Record<string, unknown>>(sql, params)
  return rows.map(rowToContact)
}

export async function getContact(id: string): Promise<ContactRecord | null> {
  await ensureDb()
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM contacts WHERE id = ?", [id])
  return row ? rowToContact(row) : null
}

export async function getContactByXeroId(xeroContactId: string): Promise<ContactRecord | null> {
  await ensureDb()
  const row = await queryOne<Record<string, unknown>>(
    "SELECT * FROM contacts WHERE xero_contact_id = ?",
    [xeroContactId],
  )
  return row ? rowToContact(row) : null
}

export async function upsertContactFromSnapshot(
  snapshot: CustomerSnapshot,
  supportInfo?: string | null,
): Promise<ContactRecord> {
  await ensureDb()
  const now = new Date().toISOString()
  const existing = snapshot.xeroContactId
    ? await getContactByXeroId(snapshot.xeroContactId)
    : null

  if (existing) {
    await execute(
      `UPDATE contacts SET
        company_name = ?, customer_number = ?, billing_address1 = ?, billing_address2 = ?,
        billing_address3 = ?, postcode = ?, country = ?, contact_name = ?, contact_phone = ?,
        contact_email = ?, accounts_contact = ?, accounts_email = ?, xero_synced_at = ?,
        support_info = COALESCE(?, support_info), updated_at = ?
      WHERE id = ?`,
      [
        snapshot.companyName,
        snapshot.customerNumber ?? null,
        snapshot.billingAddress1 ?? null,
        snapshot.billingAddress2 ?? null,
        snapshot.billingAddress3 ?? null,
        snapshot.postcode ?? null,
        snapshot.country ?? null,
        snapshot.contactName ?? null,
        snapshot.contactPhone ?? null,
        snapshot.contactEmail ?? null,
        snapshot.accountsContact ?? null,
        snapshot.accountsEmail ?? null,
        now,
        supportInfo ?? null,
        now,
        existing.id,
      ],
    )
    await recomputeContactStatus(existing.id)
    return (await getContact(existing.id))!
  }

  const id = newId("ct")
  await execute(
    `INSERT INTO contacts (
      id, xero_contact_id, company_name, status, support_info, customer_number,
      billing_address1, billing_address2, billing_address3, postcode, country,
      contact_name, contact_phone, contact_email, accounts_contact, accounts_email,
      xero_synced_at, created_at, updated_at
    ) VALUES (?, ?, ?, 'inactive', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      snapshot.xeroContactId ?? null,
      snapshot.companyName,
      supportInfo ?? null,
      snapshot.customerNumber ?? null,
      snapshot.billingAddress1 ?? null,
      snapshot.billingAddress2 ?? null,
      snapshot.billingAddress3 ?? null,
      snapshot.postcode ?? null,
      snapshot.country ?? null,
      snapshot.contactName ?? null,
      snapshot.contactPhone ?? null,
      snapshot.contactEmail ?? null,
      snapshot.accountsContact ?? null,
      snapshot.accountsEmail ?? null,
      now,
      now,
      now,
    ],
  )
  return (await getContact(id))!
}

export async function updateContactSupportInfo(id: string, supportInfo: string): Promise<void> {
  await ensureDb()
  await execute("UPDATE contacts SET support_info = ?, updated_at = ? WHERE id = ?", [
    supportInfo,
    new Date().toISOString(),
    id,
  ])
}

const CONTACT_PATCH_FIELDS = [
  "companyName",
  "supportInfo",
  "customerNumber",
  "billingAddress1",
  "billingAddress2",
  "billingAddress3",
  "postcode",
  "country",
  "contactName",
  "contactPhone",
  "contactEmail",
  "accountsContact",
  "accountsEmail",
] as const

type ContactPatchField = (typeof CONTACT_PATCH_FIELDS)[number]

const PATCH_TO_COLUMN: Record<ContactPatchField, string> = {
  companyName: "company_name",
  supportInfo: "support_info",
  customerNumber: "customer_number",
  billingAddress1: "billing_address1",
  billingAddress2: "billing_address2",
  billingAddress3: "billing_address3",
  postcode: "postcode",
  country: "country",
  contactName: "contact_name",
  contactPhone: "contact_phone",
  contactEmail: "contact_email",
  accountsContact: "accounts_contact",
  accountsEmail: "accounts_email",
}

export async function createContact(input: {
  companyName: string
  xeroContactId?: string
  supportInfo?: string
  customerNumber?: string
  billingAddress1?: string
  billingAddress2?: string
  billingAddress3?: string
  postcode?: string
  country?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  accountsContact?: string
  accountsEmail?: string
}): Promise<ContactRecord> {
  await ensureDb()
  const id = newId("ct")
  const now = new Date().toISOString()
  await execute(
    `INSERT INTO contacts (
      id, xero_contact_id, company_name, status, support_info, customer_number,
      billing_address1, billing_address2, billing_address3, postcode, country,
      contact_name, contact_phone, contact_email, accounts_contact, accounts_email,
      created_at, updated_at
    ) VALUES (?, ?, ?, 'inactive', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.xeroContactId ?? null,
      input.companyName,
      input.supportInfo ?? null,
      input.customerNumber ?? null,
      input.billingAddress1 ?? null,
      input.billingAddress2 ?? null,
      input.billingAddress3 ?? null,
      input.postcode ?? null,
      input.country ?? null,
      input.contactName ?? null,
      input.contactPhone ?? null,
      input.contactEmail ?? null,
      input.accountsContact ?? null,
      input.accountsEmail ?? null,
      now,
      now,
    ],
  )
  return (await getContact(id))!
}

export async function updateContact(
  id: string,
  patch: Partial<Record<ContactPatchField, string | null>>,
): Promise<ContactRecord | null> {
  await ensureDb()
  const fields: string[] = []
  const params: unknown[] = []
  for (const key of CONTACT_PATCH_FIELDS) {
    if (patch[key] !== undefined) {
      fields.push(`${PATCH_TO_COLUMN[key]} = ?`)
      params.push(patch[key])
    }
  }
  if (!fields.length) return getContact(id)
  fields.push("updated_at = ?")
  params.push(new Date().toISOString(), id)
  await execute(`UPDATE contacts SET ${fields.join(", ")} WHERE id = ?`, params)
  return getContact(id)
}

/** Active when a contract has rollout_status signed or live */
export async function recomputeContactStatus(contactId: string): Promise<ContactStatus> {
  await ensureDb()
  const row = await queryOne<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM contracts
     WHERE contact_id = ? AND rollout_status IN ('signed', 'live')`,
    [contactId],
  )
  const status: ContactStatus = (row?.cnt ?? 0) > 0 ? "active" : "inactive"
  await execute("UPDATE contacts SET status = ?, updated_at = ? WHERE id = ?", [
    status,
    new Date().toISOString(),
    contactId,
  ])
  return status
}

export type ContactAttachment = {
  id: string
  contactId: string
  title: string
  driveFileId: string | null
  driveUrl: string | null
  kind: string
  uploadedBy: string | null
  createdAt: string
}

export async function listContactAttachments(contactId: string): Promise<ContactAttachment[]> {
  await ensureDb()
  const rows = await query<Record<string, unknown>>(
    "SELECT * FROM contact_attachments WHERE contact_id = ? ORDER BY created_at DESC",
    [contactId],
  )
  return rows.map((r) => ({
    id: r.id as string,
    contactId: r.contact_id as string,
    title: r.title as string,
    driveFileId: (r.drive_file_id as string | null) ?? null,
    driveUrl: (r.drive_url as string | null) ?? null,
    kind: r.kind as string,
    uploadedBy: (r.uploaded_by as string | null) ?? null,
    createdAt: r.created_at as string,
  }))
}

export async function addContactAttachment(input: {
  contactId: string
  title: string
  driveFileId?: string
  driveUrl?: string
  kind?: string
  uploadedBy?: string
}): Promise<ContactAttachment> {
  await ensureDb()
  const id = newId("att")
  const now = new Date().toISOString()
  await execute(
    `INSERT INTO contact_attachments (id, contact_id, title, drive_file_id, drive_url, kind, uploaded_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.contactId,
      input.title,
      input.driveFileId ?? null,
      input.driveUrl ?? null,
      input.kind ?? "other",
      input.uploadedBy ?? null,
      now,
    ],
  )
  return (await listContactAttachments(input.contactId)).find((a) => a.id === id)!
}

export async function deleteContactAttachment(id: string): Promise<void> {
  await ensureDb()
  await execute("DELETE FROM contact_attachments WHERE id = ?", [id])
}
