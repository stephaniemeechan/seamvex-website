"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { csrfFetch } from "@/lib/api-client"
import { CATALOGUE, getDefaultUnitPrice, formatMoney } from "@/lib/proposals/catalogue"
import { contractPeriodFromAction } from "@/lib/proposals/billing"
import { calculateOrder, validateLicensingMode, defaultLinesForMode, deriveFullyManaged, allowedSkusForMode } from "@/lib/proposals/calculate"
import type {
  CollectionMethod,
  Currency,
  LicensingMode,
  OrderLineInput,
  OrderType,
  PaymentMode,
  SkuId,
} from "@/lib/proposals/types"
import type { CustomerSnapshot } from "@/lib/proposals/orders"
import { PersonRefSelect } from "@/components/contact-persons-editor"
import type { ContactPersonRef, XeroContactPerson } from "@/lib/xero/types"

type CrmContactRow = {
  id: string
  xeroContactId: string | null
  companyName: string
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
  contactPersons: XeroContactPerson[]
}

function crmContactToSnapshot(c: CrmContactRow): CustomerSnapshot {
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
    contactPersons: c.contactPersons.length ? c.contactPersons : undefined,
  }
}

const LINE_GROUPS: { title: string; skus: SkuId[] }[] = [
  {
    title: "Software licences",
    skus: ["base_package", "concurrent_license", "named_license", "site_license", "site_license_fm", "hosting"],
  },
  { title: "Fully Managed", skus: ["fully_managed"] },
  { title: "One-off items", skus: ["training_hour", "consultancy_hour"] },
]

function CustomerPreview({ customer }: { customer: CustomerSnapshot }) {
  const rows = [
    ["Company", customer.companyName],
    ["Customer no.", customer.customerNumber],
    ["Address 1", customer.billingAddress1],
    ["Address 2", customer.billingAddress2],
    ["Address 3", customer.billingAddress3],
    ["Postcode", customer.postcode],
    ["Country", customer.country],
    ["Contact", customer.contactName],
    ["Phone", customer.contactPhone],
    ["Email", customer.contactEmail],
    ["Accounts email", customer.accountsEmail],
  ].filter(([, v]) => v)

  return (
    <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-4 text-sm">
      <p className="font-medium text-primary">Customer details (CRM → PDF)</p>
      <dl className="mt-2 grid gap-1 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function OrderBuilder({ orderId }: { orderId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(Boolean(orderId))
  const [crmContacts, setCrmContacts] = useState<CrmContactRow[]>([])
  const [xeroConnected, setXeroConnected] = useState(false)
  const [contactsError, setContactsError] = useState("")
  const [selectedContactId, setSelectedContactId] = useState("")
  const [selectedPersonRef, setSelectedPersonRef] = useState<string>("primary")
  const [xeroPreview, setXeroPreview] = useState<CustomerSnapshot | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [orderType, setOrderType] = useState<OrderType>("new")
  const [currency, setCurrency] = useState<Currency>("GBP")
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("paid_in_advance")
  const [termMonths, setTermMonths] = useState<1 | 3 | 4 | 6 | 12>(12)
  const [licensingMode, setLicensingMode] = useState<LicensingMode>("per_user")
  const [collectionMethod, setCollectionMethod] = useState<CollectionMethod>("invoice")
  const [actionDate, setActionDate] = useState(new Date().toISOString().slice(0, 10))
  const [customerPo, setCustomerPo] = useState("")
  const [legacyAgreementDate, setLegacyAgreementDate] = useState("")
  const [legacyDocumentNumber, setLegacyDocumentNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [orderDiscountPct, setOrderDiscountPct] = useState(0)
  const [orderDiscountFixed, setOrderDiscountFixed] = useState(0)
  const [supportType, setSupportType] = useState<"standard" | "premium">("premium")
  const [lines, setLines] = useState<OrderLineInput[]>(() =>
    defaultLinesForMode("per_user", "GBP", "paid_in_advance"),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [orderStatus, setOrderStatus] = useState<string | null>(null)

  const contractPeriod = useMemo(
    () => contractPeriodFromAction(actionDate, termMonths),
    [actionDate, termMonths],
  )

  useEffect(() => {
    Promise.all([
      fetch("/api/contacts").then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? "Failed to load contacts")
        return (d.contacts ?? []) as CrmContactRow[]
      }),
      fetch("/api/xero/contacts").then(async (r) => {
        const d = await r.json()
        return Boolean(d.connected)
      }),
    ])
      .then(([rows, connected]) => {
        setXeroConnected(connected)
        setCrmContacts(rows.filter((c) => c.xeroContactId?.trim()))
      })
      .catch((e) => {
        setContactsError(e instanceof Error ? e.message : "Failed to load contacts")
      })
  }, [orderId])

  useEffect(() => {
    if (!selectedContactId) {
      if (!orderId) setXeroPreview(null)
      return
    }
    const match = crmContacts.find((c) => c.xeroContactId === selectedContactId)
    if (match) setXeroPreview(crmContactToSnapshot(match))
    setPreviewLoading(false)
  }, [selectedContactId, crmContacts, orderId])

  useEffect(() => {
    if (!orderId) return
    fetch(`/api/orders/${orderId}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error ?? "Failed to load order")
        const o = d.order
        if (!o) return
        setOrderStatus(o.status)
        if (o.status !== "proposal") {
          setError("This order is locked — only draft proposals can be edited.")
        }
        const payload = o.lines as { input: { lines: OrderLineInput[] } & Record<string, unknown> }
        const input = payload.input
        const rawType = String(input.orderType)
        setOrderType(
          rawType === "new" || rawType === "amendment" || rawType === "renewal"
            ? rawType
            : rawType === "transition"
              ? "renewal"
              : "new",
        )
        setCurrency(input.currency as Currency)
        setPaymentMode(input.paymentMode as PaymentMode)
        setTermMonths(input.termMonths as 1 | 3 | 4 | 6 | 12)
        setLicensingMode(input.licensingMode as LicensingMode)
        setCollectionMethod((input.collectionMethod as CollectionMethod) || "invoice")
        setActionDate(String(input.actionDate))
        setCustomerPo(String(o.customerPo ?? input.customerPo ?? ""))
        setLegacyAgreementDate(String(input.legacyAgreementDate ?? ""))
        setLegacyDocumentNumber(String(input.legacyDocumentNumber ?? ""))
        setNotes(String(input.notes ?? ""))
        setOrderDiscountPct(Number(input.orderDiscountPct ?? 0))
        setOrderDiscountFixed(Number(input.orderDiscountFixed ?? 0))
        setSupportType(input.supportType === "standard" ? "standard" : "premium")
        setLines(input.lines)
        if (o.customer.xeroContactId) {
          setSelectedContactId(o.customer.xeroContactId)
          setXeroPreview(o.customer)
        } else {
          setXeroPreview(o.customer)
        }
        setSelectedPersonRef(
          o.customer.selectedPersonRef === undefined || o.customer.selectedPersonRef === null
            ? "primary"
            : String(o.customer.selectedPersonRef),
        )
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load order"))
      .finally(() => setLoading(false))
  }, [orderId])

  useEffect(() => {
    if (!orderId) {
      setLines(defaultLinesForMode(licensingMode, currency, paymentMode))
    }
  }, [licensingMode, currency, paymentMode, orderId])

  useEffect(() => {
    if (orderType !== "amendment") {
      setLines((prev) => prev.map((l) => ({ ...l, isProRata: false })))
    }
  }, [orderType])

  const allowed = useMemo(() => new Set(allowedSkusForMode(licensingMode)), [licensingMode])

  const orderPayload = useMemo(
    () => ({
      orderType,
      currency,
      paymentMode,
      termMonths,
      licensingMode,
      collectionMethod,
      actionDate,
      customerPo: customerPo.trim() || null,
      legacyAgreementDate: orderType === "renewal" ? legacyAgreementDate.trim() || null : null,
      legacyDocumentNumber: orderType === "renewal" ? legacyDocumentNumber.trim() || null : null,
      notes,
      orderDiscountPct,
      orderDiscountFixed,
      supportType,
      lines,
    }),
    [
      orderType,
      currency,
      paymentMode,
      termMonths,
      licensingMode,
      collectionMethod,
      actionDate,
      customerPo,
      legacyAgreementDate,
      legacyDocumentNumber,
      notes,
      orderDiscountPct,
      orderDiscountFixed,
      supportType,
      lines,
    ],
  )

  const totals = useMemo(
    () =>
      calculateOrder({
        ...orderPayload,
        contractStart: contractPeriod.start,
        contractEnd: contractPeriod.end,
        deployment: "on_premises",
        fullyManaged: deriveFullyManaged(lines),
        supportType,
        contractType: "software_rental",
      }),
    [orderPayload, contractPeriod, lines, supportType],
  )

  function updateLine(sku: SkuId, patch: Partial<OrderLineInput>) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.sku === sku)
      const merged =
        idx >= 0
          ? { ...prev[idx], ...patch }
          : { sku, qty: 0, unitPrice: getDefaultUnitPrice(sku, currency, paymentMode), ...patch }
      if (sku === "fully_managed" && merged.qty > 1) merged.qty = 1
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = merged
        return next
      }
      return [...prev, merged]
    })
  }

  const canSave =
    selectedContactId.length > 0 || Boolean(orderId && xeroPreview?.companyName?.trim())

  async function save() {
    setSaving(true)
    setError("")

    const url = orderId ? `/api/orders/${orderId}` : "/api/orders"
    const method = orderId ? "PUT" : "POST"
    const personRef =
      selectedPersonRef === "primary"
        ? ("primary" as ContactPersonRef)
        : (Number(selectedPersonRef) as ContactPersonRef)
    const body =
      selectedContactId.length > 0
        ? {
            xeroContactId: selectedContactId,
            selectedPersonRef: personRef,
            customer: {
              ...(xeroPreview ??
                {
                  companyName:
                    crmContacts.find((c) => c.xeroContactId === selectedContactId)?.companyName ?? "",
                }),
              selectedPersonRef: personRef,
            },
            order: orderPayload,
          }
        : {
            customer: { ...xeroPreview, selectedPersonRef: personRef },
            selectedPersonRef: personRef,
            order: orderPayload,
          }

    const res = await csrfFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(data.error ?? "Save failed")
      return
    }
    router.push(`/admin/orders/${data.order.id}`)
  }

  if (loading) return <p className="text-muted-foreground">Loading order…</p>

  return (
    <div className="space-y-8">
      {!xeroConnected && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm">
          Connect Xero from the dashboard before creating a new agreement.
        </p>
      )}
      {contactsError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900">
          {contactsError}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-primary">Customer</h2>
        <div>
          <label className="text-sm font-medium">Customer</label>
          <select
            className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            disabled={!xeroConnected && !orderId}
          >
            <option value="">Select customer…</option>
            {crmContacts.map((c) => (
              <option key={c.id} value={c.xeroContactId!}>
                {c.companyName}
              </option>
            ))}
          </select>
          {xeroConnected && crmContacts.length === 0 && !contactsError && (
            <p className="mt-2 text-sm text-muted-foreground">
              No customers linked to Xero yet. Import or push contacts first.
            </p>
          )}
          {previewLoading && selectedContactId && (
            <p className="mt-2 text-sm text-muted-foreground">Loading customer details…</p>
          )}
          {xeroPreview && !previewLoading && (
            <>
              <CustomerPreview customer={xeroPreview} />
              <div className="mt-3">
                <label className="text-sm font-medium">Signing / comms person</label>
                <PersonRefSelect
                  contact={{
                    contactName: xeroPreview.contactName ?? null,
                    contactEmail: xeroPreview.contactEmail ?? null,
                    contactPersons: xeroPreview.contactPersons ?? [],
                  }}
                  value={selectedPersonRef}
                  onChange={setSelectedPersonRef}
                />
              </div>
            </>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border p-4">
        <h2 className="text-lg font-semibold text-primary">Agreement</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Order type</label>
            <select
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as OrderType)}
            >
              <option value="new">New customer</option>
              <option value="renewal">Renewal</option>
              <option value="amendment">Amendment</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Document / action date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
              value={actionDate}
              onChange={(e) => setActionDate(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 rounded-lg bg-secondary/40 px-3 py-2 text-sm">
            <p className="font-medium text-primary">
              Contract period: {contractPeriod.startLabel} – {contractPeriod.endLabel}
            </p>
            <p className="mt-1 text-muted-foreground">
              Billing starts on the 1st of the month following the action date (or the 1st if the action date is
              already the 1st).
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Currency</label>
            <select
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
            >
              <option value="GBP">GBP</option>
              <option value="ZAR">ZAR</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Term (months)</label>
            <select
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
              value={termMonths}
              onChange={(e) => setTermMonths(Number(e.target.value) as 1 | 3 | 4 | 6 | 12)}
            >
              {[1, 3, 4, 6, 12].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Payment</label>
            <select
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
            >
              <option value="paid_monthly">Paid monthly</option>
              <option value="paid_in_advance">Paid for the full term</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Collection method</label>
            <select
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
              value={collectionMethod}
              onChange={(e) => setCollectionMethod(e.target.value as CollectionMethod)}
            >
              <option value="invoice">Invoice</option>
              <option value="direct_debit">Direct Debit</option>
              <option value="stripe">Stripe</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Licensing mode</label>
            <select
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
              value={licensingMode}
              onChange={(e) => setLicensingMode(e.target.value as LicensingMode)}
            >
              <option value="per_user">Per-user (Base + licences)</option>
              <option value="site_license">Site licence — unlimited users at one site</option>
              <option value="site_license_fm">
                Site licence incl. Fully Managed — unlimited users; we set up the software
              </option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Support type</label>
            <select
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
              value={supportType}
              onChange={(e) => setSupportType(e.target.value as "standard" | "premium")}
            >
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Customer PO (optional)</label>
            <input
              className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
              value={customerPo}
              onChange={(e) => setCustomerPo(e.target.value)}
              placeholder="Purchase order number"
            />
          </div>
          {orderType === "renewal" && (
            <>
              <div>
                <label className="text-sm font-medium">Prior agreement date</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  value={legacyAgreementDate}
                  onChange={(e) => setLegacyAgreementDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Prior document number</label>
                <input
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  value={legacyDocumentNumber}
                  onChange={(e) => setLegacyDocumentNumber(e.target.value)}
                  placeholder="e.g. SA-2020-001"
                />
              </div>
            </>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-primary">Discounts</h2>
        <div className="flex flex-wrap gap-6">
          <div>
            <label className="text-sm font-medium">Order discount %</label>
            <input
              type="number"
              min={0}
              max={100}
              className="mt-1 w-32 rounded-md border border-input px-3 py-2 text-sm"
              value={orderDiscountPct}
              onChange={(e) => setOrderDiscountPct(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Order discount fixed</label>
            <input
              type="number"
              min={0}
              step={0.01}
              className="mt-1 w-32 rounded-md border border-input px-3 py-2 text-sm"
              value={orderDiscountFixed}
              onChange={(e) => setOrderDiscountFixed(Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-primary">Line items</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          {LINE_GROUPS.map((group) => {
            const groupCats = CATALOGUE.filter((c) => group.skus.includes(c.id) && allowed.has(c.id))
            if (groupCats.length === 0) return null
            return (
              <div key={group.title} className="border-b border-border last:border-b-0">
                <div className="bg-secondary/50 px-3 py-2 text-sm font-semibold text-primary">{group.title}</div>
                <table className="w-full text-sm">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>
                      <th className="px-2 py-2 text-left">Line</th>
                      <th className="px-2 py-2 text-left">Qty</th>
                      <th className="px-2 py-2 text-left">Unit</th>
                      <th className="px-2 py-2 text-left">Disc %</th>
                      <th className="px-2 py-2 text-left">Disc fixed</th>
                      {orderType === "amendment" && (
                        <th className="px-2 py-2 text-left">Pro-rata</th>
                      )}
                      <th className="px-2 py-2 text-left">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupCats.map((cat) => {
                      const line = lines.find((l) => l.sku === cat.id) ?? {
                        sku: cat.id,
                        qty: 0,
                        unitPrice: getDefaultUnitPrice(cat.id, currency, paymentMode),
                      }
                      const calc = totals.lines.find((l) => l.sku === cat.id)
                      const maxQty = cat.id === "fully_managed" ? 1 : undefined
                      return (
                        <tr key={cat.id} className="border-t border-border">
                          <td className="px-2 py-2">{cat.label}</td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              max={maxQty}
                              className="w-16 rounded border border-input px-2 py-1"
                              value={line.qty}
                              onChange={(e) => updateLine(cat.id, { qty: Number(e.target.value) })}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              className="w-24 rounded border border-input px-2 py-1"
                              value={line.unitPrice ?? ""}
                              placeholder={cat.hasDefaultPrice ? "" : "Enter"}
                              onChange={(e) =>
                                updateLine(cat.id, {
                                  unitPrice: e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              className="w-16 rounded border border-input px-2 py-1"
                              value={line.lineDiscountPct ?? 0}
                              onChange={(e) => updateLine(cat.id, { lineDiscountPct: Number(e.target.value) })}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              className="w-20 rounded border border-input px-2 py-1"
                              value={line.lineDiscountFixed ?? 0}
                              onChange={(e) => updateLine(cat.id, { lineDiscountFixed: Number(e.target.value) })}
                            />
                          </td>
                          {orderType === "amendment" && (
                            <td className="px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={Boolean(line.isProRata)}
                                onChange={(e) => updateLine(cat.id, { isProRata: e.target.checked })}
                              />
                            </td>
                          )}
                          <td className="px-2 py-2">
                            {calc?.includeInPdf ? formatMoney(calc.netLineTotal, currency) : "—"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
        <p className="text-lg font-semibold text-primary">
          Order total: {formatMoney(totals.orderTotal, currency)}{" "}
          <span className="text-sm font-normal text-muted-foreground">(excluding VAT)</span>
        </p>
      </section>

      <textarea
        className="w-full rounded-md border border-input px-3 py-2 text-sm"
        rows={2}
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="button"
        disabled={saving || !canSave || (orderStatus != null && orderStatus !== "proposal")}
        onClick={save}
        className="rounded-md bg-accent px-6 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
      >
        {saving ? "Saving…" : orderId ? "Update proposal" : "Save proposal"}
      </button>
    </div>
  )
}
