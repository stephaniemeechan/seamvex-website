import { billingStart, contractEndFromStart, toIsoDate } from "@/lib/proposals/billing"
import { calculateOrder, validateLicensingMode, deriveFullyManaged } from "@/lib/proposals/calculate"
import type { OrderInput, OrderStatus, OrderLineInput, OrderType, RolloutStatus, Deployment } from "@/lib/proposals/types"
import { execute, query, queryOne, newId, nextDocumentNumber, ensureDb } from "@/lib/db"
import { parseIsoDate } from "@/lib/proposals/billing"
import { upsertContactFromSnapshot, recomputeContactStatus } from "@/lib/crm/contacts"
import type { ContactPersonRef, XeroContactPerson } from "@/lib/xero/types"

export type CustomerSnapshot = {
  xeroContactId?: string
  companyName: string
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
  /** Additional people (Xero ContactPersons[]). Primary is contactName/contactEmail. */
  contactPersons?: XeroContactPerson[]
  /** Person chosen for signing/comms on this order. */
  selectedPersonRef?: ContactPersonRef
}

export type OrderRecord = {
  id: string
  contractId: string | null
  contactId: string | null
  documentNumber: string
  orderType: string
  status: OrderStatus
  currency: string
  paymentMode: string
  termMonths: number
  licensingMode: string
  deployment: string
  fullyManaged: boolean
  supportType: string
  contractType: string
  collectionMethod: string
  actionDate: string
  contractStart: string | null
  contractEnd: string | null
  amendmentDate: string | null
  legacyAgreementDate: string | null
  legacyDocumentNumber: string | null
  customerPo: string | null
  notes: string | null
  orderDiscountPct: number
  orderDiscountFixed: number
  subtotal: number | null
  orderTotal: number | null
  customer: CustomerSnapshot
  lines: unknown
  signToken: string | null
  documensoDocumentId: string | null
  documensoSigningUrl: string | null
  xeroInvoiceId: string | null
  signedAt: string | null
  signedPdfPath: string | null
  createdAt: string
  updatedAt: string
}

function rowToOrder(row: Record<string, unknown>): OrderRecord {
  return {
    id: row.id as string,
    contractId: row.contract_id as string | null,
    contactId: (row.contact_id as string | null) ?? null,
    documentNumber: row.document_number as string,
    orderType: row.order_type as string,
    status: row.status as OrderStatus,
    currency: row.currency as string,
    paymentMode: row.payment_mode as string,
    termMonths: row.term_months as number,
    licensingMode: row.licensing_mode as string,
    deployment: row.deployment as string,
    fullyManaged: Boolean(row.fully_managed),
    supportType: row.support_type as string,
    contractType: row.contract_type as string,
    collectionMethod: row.collection_method as string,
    actionDate: row.action_date as string,
    contractStart: row.contract_start as string | null,
    contractEnd: row.contract_end as string | null,
    amendmentDate: row.amendment_date as string | null,
    legacyAgreementDate: row.legacy_agreement_date as string | null,
    legacyDocumentNumber: row.legacy_document_number as string | null,
    customerPo: (row.customer_po as string | null) ?? null,
    notes: row.notes as string | null,
    orderDiscountPct: row.order_discount_pct as number,
    orderDiscountFixed: row.order_discount_fixed as number,
    subtotal: row.subtotal as number | null,
    orderTotal: row.order_total as number | null,
    customer: JSON.parse(row.customer_json as string),
    lines: JSON.parse(row.lines_json as string),
    signToken: row.sign_token as string | null,
    documensoDocumentId: (row.documenso_document_id as string | null) ?? null,
    documensoSigningUrl: (row.documenso_signing_url as string | null) ?? null,
    xeroInvoiceId: (row.xero_invoice_id as string | null) ?? null,
    signedAt: row.signed_at as string | null,
    signedPdfPath: row.signed_pdf_path as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function normalizeOrderType(raw: string): OrderType {
  if (raw === "new" || raw === "amendment" || raw === "renewal") return raw
  if (raw === "transition") return "renewal"
  return "new"
}

function normalizeLines(lines: OrderLineInput[], orderType: OrderType): OrderLineInput[] {
  return lines.map((line) => {
    let qty = line.qty
    if (line.sku === "fully_managed") qty = Math.min(1, Math.max(0, qty))
    const isProRata = orderType === "amendment" ? Boolean(line.isProRata) : false
    return { ...line, qty, isProRata }
  })
}

function validateLines(lines: OrderLineInput[]): string | null {
  const fm = lines.find((l) => l.sku === "fully_managed" && l.qty > 1)
  if (fm) return "Fully Managed quantity cannot exceed 1"
  return null
}

export function buildOrderInput(
  partial: Omit<OrderInput, "actionDate" | "lines" | "fullyManaged" | "deployment" | "supportType" | "contractType"> & {
    actionDate?: string
    lines: OrderLineInput[]
    orderType?: string
    fullyManaged?: boolean
    deployment?: string
    supportType?: string
    contractType?: string
    legacyAgreementDate?: string | null
    legacyDocumentNumber?: string | null
  },
): OrderInput {
  const orderType = normalizeOrderType(partial.orderType ?? "new")
  const lines = normalizeLines(partial.lines, orderType)

  const actionDate = partial.actionDate ?? toIsoDate(new Date())
  const action = parseIsoDate(actionDate)
  const start = billingStart(action)
  const end = contractEndFromStart(start, partial.termMonths)

  return {
    orderType,
    currency: partial.currency,
    paymentMode: partial.paymentMode,
    termMonths: partial.termMonths,
    licensingMode: partial.licensingMode,
    deployment: (partial.deployment === "private_cloud" ? "private_cloud" : "on_premises") as Deployment,
    fullyManaged: deriveFullyManaged(lines),
    supportType: partial.supportType === "standard" ? "standard" : "premium",
    contractType: partial.contractType === "capex" ? "capex" : "software_rental",
    collectionMethod: partial.collectionMethod,
    customerPo: partial.customerPo?.trim() || null,
    notes: partial.notes,
    orderDiscountPct: partial.orderDiscountPct,
    orderDiscountFixed: partial.orderDiscountFixed,
    lines,
    actionDate,
    contractStart: toIsoDate(start),
    contractEnd: toIsoDate(end),
    amendmentDate: orderType === "amendment" ? toIsoDate(billingStart(action)) : null,
    legacyAgreementDate: partial.legacyAgreementDate ?? null,
    legacyDocumentNumber: partial.legacyDocumentNumber ?? null,
  }
}

export async function createOrder(
  customer: CustomerSnapshot,
  input: OrderInput,
): Promise<{ order: OrderRecord; error?: string }> {
  await ensureDb()
  const modeError = validateLicensingMode(input.licensingMode, input.lines)
  if (modeError) return { order: null as unknown as OrderRecord, error: modeError }
  const lineError = validateLines(input.lines)
  if (lineError) return { order: null as unknown as OrderRecord, error: lineError }

  const totals = calculateOrder(input)
  const now = new Date().toISOString()
  const id = newId("ord")
  const docNum = await nextDocumentNumber()
  const signToken = crypto.randomUUID()

  const contact = await upsertContactFromSnapshot(customer)
  const contactId = contact.id

  let contractId: string | null = null
  if (customer.xeroContactId) {
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM contracts WHERE xero_contact_id = ?",
      [customer.xeroContactId],
    )
    if (existing) {
      contractId = existing.id
      await execute("UPDATE contracts SET contact_id = ?, updated_at = ? WHERE id = ?", [
        contactId,
        now,
        contractId,
      ])
    } else {
      contractId = newId("ctr")
      await execute(
        `INSERT INTO contracts (id, contact_id, xero_contact_id, company_name, currency, rollout_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'not_started', ?, ?)`,
        [contractId, contactId, customer.xeroContactId, customer.companyName, input.currency, now, now],
      )
    }
  }

  await execute(
    `INSERT INTO orders (
      id, contract_id, contact_id, document_number, order_type, status, currency, payment_mode, term_months,
      licensing_mode, deployment, fully_managed, support_type, contract_type, collection_method,
      action_date, contract_start, contract_end, amendment_date, legacy_agreement_date, legacy_document_number,
      customer_po, notes, order_discount_pct, order_discount_fixed, subtotal, order_total,
      customer_json, lines_json, sign_token, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'proposal', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      contractId,
      contactId,
      docNum,
      input.orderType,
      input.currency,
      input.paymentMode,
      input.termMonths,
      input.licensingMode,
      input.deployment,
      input.fullyManaged ? 1 : 0,
      input.supportType,
      input.contractType,
      input.collectionMethod,
      input.actionDate,
      input.contractStart ?? null,
      input.contractEnd ?? null,
      input.amendmentDate ?? null,
      input.legacyAgreementDate ?? null,
      input.legacyDocumentNumber ?? null,
      input.customerPo ?? null,
      input.notes ?? null,
      input.orderDiscountPct ?? 0,
      input.orderDiscountFixed ?? 0,
      totals.subtotal,
      totals.orderTotal,
      JSON.stringify(customer),
      JSON.stringify({ input, calculated: totals }),
      signToken,
      now,
      now,
    ],
  )

  return { order: (await getOrder(id))! }
}

export async function getOrder(id: string): Promise<OrderRecord | null> {
  await ensureDb()
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM orders WHERE id = ?", [id])
  return row ? rowToOrder(row) : null
}

export async function getOrderBySignToken(token: string): Promise<OrderRecord | null> {
  await ensureDb()
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM orders WHERE sign_token = ?", [
    token,
  ])
  return row ? rowToOrder(row) : null
}

export async function getOrderByDocumensoDocumentId(
  documentId: string,
): Promise<OrderRecord | null> {
  await ensureDb()
  const row = await queryOne<Record<string, unknown>>(
    "SELECT * FROM orders WHERE documenso_document_id = ?",
    [documentId],
  )
  return row ? rowToOrder(row) : null
}

export async function listOrdersByContactId(
  contactId: string,
  opts?: { status?: OrderStatus },
): Promise<OrderRecord[]> {
  await ensureDb()
  let sql = "SELECT * FROM orders WHERE contact_id = ?"
  const params: unknown[] = [contactId]
  if (opts?.status) {
    sql += " AND status = ?"
    params.push(opts.status)
  }
  sql += " ORDER BY signed_at DESC, created_at DESC"
  const rows = await query<Record<string, unknown>>(sql, params)
  return rows.map(rowToOrder)
}

export async function listOrders(): Promise<OrderRecord[]> {
  await ensureDb()
  const rows = await query<Record<string, unknown>>(
    "SELECT * FROM orders ORDER BY created_at DESC",
  )
  return rows.map(rowToOrder)
}

export async function listContracts(): Promise<{
  id: string
  companyName: string
  rolloutStatus: RolloutStatus
  xeroContactId: string | null
  contactId: string | null
  contractEnd: string | null
}[]> {
  await ensureDb()
  const rows = await query<Record<string, unknown>>(
    "SELECT id, company_name, rollout_status, xero_contact_id, contact_id, contract_end FROM contracts ORDER BY company_name",
  )
  return rows.map((r) => ({
    id: r.id as string,
    companyName: r.company_name as string,
    rolloutStatus: r.rollout_status as RolloutStatus,
    xeroContactId: (r.xero_contact_id as string | null) ?? null,
    contactId: (r.contact_id as string | null) ?? null,
    contractEnd: (r.contract_end as string | null) ?? null,
  }))
}

export async function updateOrder(
  id: string,
  customer: CustomerSnapshot,
  input: OrderInput,
): Promise<{ order: OrderRecord; error?: string }> {
  const existing = await getOrder(id)
  if (!existing) return { order: null as unknown as OrderRecord, error: "Not found" }
  if (existing.status === "signed") return { order: existing, error: "Signed orders cannot be edited" }
  if (existing.status !== "proposal") {
    return { order: existing, error: "Only draft proposals can be edited. Void and recreate if needed." }
  }

  const modeError = validateLicensingMode(input.licensingMode, input.lines)
  if (modeError) return { order: existing, error: modeError }
  const lineError = validateLines(input.lines)
  if (lineError) return { order: existing, error: lineError }

  const totals = calculateOrder(input)
  const now = new Date().toISOString()
  const contact = await upsertContactFromSnapshot(customer)

  await execute(
    `UPDATE orders SET
      contact_id = ?, order_type = ?, currency = ?, payment_mode = ?, term_months = ?, licensing_mode = ?, deployment = ?,
      fully_managed = ?, support_type = ?, contract_type = ?, collection_method = ?,
      action_date = ?, contract_start = ?, contract_end = ?, amendment_date = ?,
      legacy_agreement_date = ?, legacy_document_number = ?, customer_po = ?, notes = ?,
      order_discount_pct = ?, order_discount_fixed = ?, subtotal = ?, order_total = ?,
      customer_json = ?, lines_json = ?, updated_at = ?
    WHERE id = ?`,
    [
      contact.id,
      input.orderType,
      input.currency,
      input.paymentMode,
      input.termMonths,
      input.licensingMode,
      input.deployment,
      input.fullyManaged ? 1 : 0,
      input.supportType,
      input.contractType,
      input.collectionMethod,
      input.actionDate,
      input.contractStart ?? null,
      input.contractEnd ?? null,
      input.amendmentDate ?? null,
      input.legacyAgreementDate ?? null,
      input.legacyDocumentNumber ?? null,
      input.customerPo ?? null,
      input.notes ?? null,
      input.orderDiscountPct ?? 0,
      input.orderDiscountFixed ?? 0,
      totals.subtotal,
      totals.orderTotal,
      JSON.stringify(customer),
      JSON.stringify({ input, calculated: totals }),
      now,
      id,
    ],
  )

  return { order: (await getOrder(id))! }
}

export async function generateContract(id: string): Promise<OrderRecord | null> {
  const order = await getOrder(id)
  if (!order || order.status !== "proposal") return null
  const now = new Date().toISOString()
  await execute("UPDATE orders SET status = 'contract', updated_at = ? WHERE id = ?", [now, id])
  return getOrder(id)
}

export async function markOrderSent(id: string): Promise<OrderRecord | null> {
  const order = await getOrder(id)
  if (!order || order.status === "signed" || order.status !== "contract") return null
  const now = new Date().toISOString()
  await execute("UPDATE orders SET status = 'sent', updated_at = ? WHERE id = ?", [now, id])
  if (order.contractId) {
    await execute("UPDATE contracts SET rollout_status = 'proposal_sent', updated_at = ? WHERE id = ?", [
      now,
      order.contractId,
    ])
  }
  return getOrder(id)
}

export async function setDocumensoInfo(
  id: string,
  documensoDocumentId: string,
  signingUrl: string,
): Promise<void> {
  await execute(
    "UPDATE orders SET documenso_document_id = ?, documenso_signing_url = ?, updated_at = ? WHERE id = ?",
    [documensoDocumentId, signingUrl, new Date().toISOString(), id],
  )
}

export async function markOrderSigned(
  id: string,
  signature: { name: string; position: string; date: string; poNumber?: string },
  pdfPath?: string,
): Promise<OrderRecord | null> {
  const order = await getOrder(id)
  if (!order || order.status === "signed") return null
  const now = new Date().toISOString()
  const payload = await queryOne<{ lines_json: string }>(
    "SELECT lines_json FROM orders WHERE id = ?",
    [id],
  )
  const parsed = JSON.parse(payload!.lines_json) as { input: OrderInput }

  await execute(
    `UPDATE orders SET status = 'signed', signed_at = ?, customer_signature_json = ?, signed_pdf_path = ?, updated_at = ? WHERE id = ?`,
    [now, JSON.stringify(signature), pdfPath ?? null, now, id],
  )

  if (order.contractId) {
    await execute(
      `UPDATE contracts SET
        rollout_status = 'signed', currency = ?, contract_start = ?, contract_end = ?,
        licensing_mode = ?, deployment = ?, fully_managed = ?, support_type = ?,
        payment_mode = ?, term_months = ?, current_lines_json = ?, updated_at = ?
      WHERE id = ?`,
      [
        parsed.input.currency,
        parsed.input.contractStart ?? null,
        parsed.input.contractEnd ?? null,
        parsed.input.licensingMode,
        parsed.input.deployment,
        parsed.input.fullyManaged ? 1 : 0,
        parsed.input.supportType,
        parsed.input.paymentMode,
        parsed.input.termMonths,
        JSON.stringify(parsed.input.lines),
        now,
        order.contractId,
      ],
    )
  }

  if (order.contactId) {
    await recomputeContactStatus(order.contactId)
  }

  return getOrder(id)
}

export async function setXeroInvoiceId(orderId: string, invoiceId: string): Promise<void> {
  await execute("UPDATE orders SET xero_invoice_id = ?, updated_at = ? WHERE id = ?", [
    invoiceId,
    new Date().toISOString(),
    orderId,
  ])
}

export async function markOrderVoid(id: string): Promise<OrderRecord | null> {
  const order = await getOrder(id)
  if (!order || order.status === "signed") return null
  const now = new Date().toISOString()
  await execute("UPDATE orders SET status = 'void', updated_at = ? WHERE id = ?", [now, id])
  return getOrder(id)
}
