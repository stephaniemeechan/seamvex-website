"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { csrfFetch } from "@/lib/api-client"
import { formatMoney, getCatalogueLabel } from "@/lib/proposals/catalogue"
import type { OrderInput, OrderLineCalculated } from "@/lib/proposals/types"

type Order = {
  id: string
  documentNumber: string
  status: string
  signToken: string | null
  documensoSigningUrl: string | null
  signedPdfPath: string | null
  customer: {
    companyName: string
    contactName?: string
    contactEmail?: string
  }
  orderTotal: number | null
  subtotal: number | null
  currency: string
  fullyManaged: boolean
  orderType: string
  termMonths: number
  deployment: string
  contractStart: string | null
  contractEnd: string | null
  xeroInvoiceId: string | null
  lines: { input: OrderInput; calculated: { lines: OrderLineCalculated[]; orderTotal: number } }
}

type InvoiceSummary = {
  status: string
  amountDue?: number
  amountPaid?: number
  invoiceNumber?: string
  webUrl?: string
}

export function OrderDetailClient({ id, canManageContracts = false }: { id: string; canManageContracts?: boolean }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loadError, setLoadError] = useState("")
  const [loading, setLoading] = useState(true)
  const [signUrl, setSignUrl] = useState("")
  const [coverNote, setCoverNote] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [sendPreviewBody, setSendPreviewBody] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [copied, setCopied] = useState("")
  const [actionError, setActionError] = useState("")
  const [invoice, setInvoice] = useState<InvoiceSummary | null>(null)
  const [manualSignFile, setManualSignFile] = useState<File | null>(null)
  const [manualSignerName, setManualSignerName] = useState("")
  const [manualCreateInvoice, setManualCreateInvoice] = useState(true)
  const [manualSigning, setManualSigning] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    setLoading(true)
    setLoadError("")
    fetch(`/api/orders/${id}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok || !d.order) throw new Error(d.error ?? "Order not found")
        setOrder(d.order)
        if (d.order.documensoSigningUrl) {
          setSignUrl(d.order.documensoSigningUrl)
        } else if (d.order.signToken && d.order.status === "sent") {
          setSignUrl(`${window.location.origin}/sign/${d.order.signToken}`)
        }
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Failed to load order"))
      .finally(() => setLoading(false))
    fetch(`/api/comms?orderId=${id}`)
      .then((r) => r.json())
      .then((d) => {
        setCoverNote(d.coverNoteAgreement ?? "")
        setEmailBody(d.emailBody ?? "")
        setSendPreviewBody(d.sendPreviewBody ?? d.coverNoteAgreement ?? "")
        setEmailSubject(d.emailSubject ?? "Seamcor — updated agreement")
      })
      .catch(() => setCoverNote("Please sign the attached Seamcor software agreement."))
  }, [id])

  useEffect(() => {
    if (!order?.xeroInvoiceId) {
      setInvoice(null)
      return
    }
    fetch(`/api/xero/invoices/${order.xeroInvoiceId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.invoice) setInvoice({ ...d.invoice, webUrl: d.webUrl })
      })
      .catch(() => setInvoice(null))
  }, [order?.xeroInvoiceId])

  useEffect(() => {
    if (!signUrl) return
    fetch(`/api/comms?orderId=${id}&signingLink=${encodeURIComponent(signUrl)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.sendPreviewBody) setSendPreviewBody(d.sendPreviewBody)
      })
      .catch(() => {})
  }, [id, signUrl])

  async function generateContract() {
    setActionError("")
    const res = await csrfFetch(`/api/orders/${id}/generate-contract`, { method: "POST" })
    const data = await res.json()
    if (res.ok) setOrder(data.order)
    else setActionError(data.error ?? "Failed to generate contract")
  }

  async function sendToCustomer() {
    setActionError("")
    const res = await csrfFetch(`/api/orders/${id}/send`, { method: "POST" })
    const data = await res.json()
    if (res.ok) {
      setSignUrl(data.signUrl)
      setOrder(data.order)
      if (data.gmailSent) setCopied("Agreement sent and emailed to customer.")
      else if (data.gmailError)
        setActionError(`Sent for signature but Gmail failed: ${data.gmailError}`)
    } else setActionError(data.error ?? "Failed to send")
  }

  async function resendToCustomer() {
    setResending(true)
    setActionError("")
    try {
      const res = await csrfFetch(`/api/orders/${id}/resend`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setActionError(data.error ?? "Failed to resend")
        return
      }
      setSignUrl(data.signUrl)
      if (data.order) setOrder(data.order)
      if (data.gmailSent) setCopied("Signing link resent by email.")
      else if (data.gmailError)
        setActionError(`Sign link ready but Gmail failed: ${data.gmailError}`)
    } finally {
      setResending(false)
    }
  }

  async function manualMarkSigned(e: React.FormEvent) {
    e.preventDefault()
    if (!manualSignFile || !manualSignerName.trim()) return
    setManualSigning(true)
    setActionError("")
    try {
      const fd = new FormData()
      fd.set("file", manualSignFile)
      fd.set("signerName", manualSignerName.trim())
      fd.set("createXeroInvoice", manualCreateInvoice ? "true" : "false")
      const res = await csrfFetch(`/api/orders/${id}/mark-signed`, { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Manual sign failed")
      setOrder(data.order)
      setCopied("Agreement marked signed.")
      setManualSignFile(null)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Manual sign failed")
    } finally {
      setManualSigning(false)
    }
  }

  async function voidOrder() {
    if (!confirm("Void this proposal?")) return
    const res = await csrfFetch(`/api/orders/${id}/void`, { method: "POST" })
    const data = await res.json()
    if (res.ok) setOrder(data.order)
  }

  function copyText(label: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(""), 2000)
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>
  if (loadError) return <p className="text-destructive">{loadError}</p>
  if (!order) return <p className="text-muted-foreground">Order not found.</p>

  const calcLines = order.lines?.calculated?.lines?.filter((l) => l.includeInPdf) ?? []
  const currency = order.currency as "GBP" | "ZAR" | "EUR"
  const mailto = order.customer.contactEmail
    ? `mailto:${order.customer.contactEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(sendPreviewBody)}`
    : ""
  const isProposal = order.status === "proposal"
  const isContract = order.status === "contract"
  const isSent = order.status === "sent"
  const canEdit = isProposal

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-accent hover:underline">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-primary">{order.documentNumber}</h1>
          <p className="text-muted-foreground">{order.customer.companyName}</p>
          <p className="text-sm text-muted-foreground capitalize">
            {order.orderType.replace("_", " ")} · {order.termMonths} months · Premium support
          </p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm capitalize">{order.status}</span>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <div className="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-primary">Workflow</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li className={isProposal ? "font-semibold text-primary" : ""}>Download proposal (pricing only)</li>
          <li className={isContract ? "font-semibold text-primary" : ""}>Generate contract (locks pricing)</li>
          <li className={isSent ? "font-semibold text-primary" : ""}>Send for signature</li>
          <li className={order.status === "signed" ? "font-semibold text-primary" : ""}>
            Customer signs · DRAFT invoice in Xero (when configured)
          </li>
        </ol>
      </div>

      {order.xeroInvoiceId && (
        <div className="rounded-xl border border-border p-4 text-sm">
          <p className="font-medium text-primary">Xero invoice</p>
          {invoice ? (
            <p className="mt-2 text-muted-foreground">
              {invoice.invoiceNumber ?? order.xeroInvoiceId.slice(0, 8)} —{" "}
              <span className="capitalize">{invoice.status.toLowerCase()}</span>
              {invoice.amountDue != null && invoice.amountDue > 0 && ` · Due £${invoice.amountDue.toFixed(2)}`}
              {invoice.status === "PAID" && " · Paid"}
              {invoice.webUrl && (
                <>
                  {" "}
                  ·{" "}
                  <a href={invoice.webUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                    Open in Xero
                  </a>
                </>
              )}
            </p>
          ) : (
            <p className="mt-2 text-muted-foreground">Linked invoice ID: {order.xeroInvoiceId}</p>
          )}
        </div>
      )}

      {(isContract || isSent) && canManageContracts && (
        <form onSubmit={manualMarkSigned} className="rounded-xl border border-border p-4 space-y-3">
          <p className="text-sm font-medium text-primary">Manual sign (upload signed PDF)</p>
          <p className="text-xs text-muted-foreground">
            Use when the customer signed offline instead of Documenso.
          </p>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setManualSignFile(e.target.files?.[0] ?? null)}
            className="block text-sm"
          />
          <input
            type="text"
            placeholder="Signer name *"
            value={manualSignerName}
            onChange={(e) => setManualSignerName(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={manualCreateInvoice}
              onChange={(e) => setManualCreateInvoice(e.target.checked)}
            />
            Create Xero DRAFT invoice (if not already linked)
          </label>
          <button
            type="submit"
            disabled={manualSigning || !manualSignFile || !manualSignerName.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {manualSigning ? "Saving…" : "Upload & mark signed"}
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        {(isProposal || order.status === "void") && (
          <a
            href={`/api/orders/${order.id}/proposal-pdf`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Download proposal
          </a>
        )}
        {isProposal && canManageContracts && (
          <button
            type="button"
            onClick={generateContract}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Generate contract
          </button>
        )}
        {(isContract || isSent || order.status === "signed") && (
          <a
            href={`/api/orders/${order.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Preview contract
          </a>
        )}
        {order.fullyManaged && canManageContracts && (
          <>
            <a
              href={`/api/orders/${order.id}/dpa`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Download DPA
            </a>
            <a
              href={`/api/orders/${order.id}/privacy`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Download Privacy
            </a>
          </>
        )}

        {order.status === "signed" && order.signedPdfPath && (
          <a
            href={`/api/orders/${order.id}/signed-pdf`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Download signed PDF
          </a>
        )}
        {canEdit && canManageContracts && (
          <>
            <Link
              href={`/admin/orders/${order.id}/edit`}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Edit proposal
            </Link>
            <button
              type="button"
              onClick={voidOrder}
              className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-800 hover:bg-red-50"
            >
              Void
            </button>
          </>
        )}
        {isContract && canManageContracts && (
          <button
            type="button"
            onClick={sendToCustomer}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            Send for signature
          </button>
        )}
        {isSent && canManageContracts && (
          <button
            type="button"
            onClick={resendToCustomer}
            disabled={resending}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
          >
            {resending ? "Resending…" : "Resend for signature"}
          </button>
        )}
      </div>

      {signUrl && (
        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <p className="text-sm font-medium text-primary">Customer sign link (contract)</p>
          <a href={signUrl} className="mt-1 break-all text-sm text-accent hover:underline">
            {signUrl}
          </a>
          <button
            type="button"
            onClick={() => copyText("link", signUrl)}
            className="mt-2 text-xs text-accent hover:underline"
          >
            {copied === "link" ? "Copied!" : "Copy link"}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border p-4">
        <p className="text-sm font-medium text-primary">Order summary</p>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-1">Item</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {calcLines.map((line) => (
              <tr key={line.sku} className="border-b border-border/50">
                <td className="py-1">{line.description ?? getCatalogueLabel(line.sku)}</td>
                <td>{line.qty}</td>
                <td>{formatMoney(line.netLineTotal, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 font-semibold text-primary">
          Total: {order.orderTotal != null ? formatMoney(order.orderTotal, currency) : "—"}{" "}
          <span className="text-sm font-normal text-muted-foreground">(excluding VAT)</span>
        </p>
        {(order.contractStart || order.contractEnd) && (
          <p className="mt-1 text-sm text-muted-foreground">
            Contract: {order.contractStart ?? "—"} → {order.contractEnd ?? "—"}
          </p>
        )}
      </div>

      {(isContract || isSent) && (
        <div className="rounded-xl border border-border p-4 space-y-3">
          <p className="text-sm font-medium text-primary">Gmail on Send</p>
          <p className="text-xs text-muted-foreground">
            This is the exact plain-text email sent when you click Send for signature (requires Gmail connected in Settings).
          </p>
          <p className="text-xs text-muted-foreground">Subject: {emailSubject}</p>
          <p className="whitespace-pre-wrap text-sm">{sendPreviewBody}</p>
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer text-xs font-medium">Reference letter (not auto-sent)</summary>
            <p className="mt-2 whitespace-pre-wrap">{emailBody}</p>
          </details>
          <div className="flex flex-wrap gap-2">
            {mailto && (
              <a
                href={mailto}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
              >
                Open in email client
              </a>
            )}
            <button
              type="button"
              onClick={() => copyText("email", `${emailSubject}\n\n${sendPreviewBody}`)}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
            >
              {copied === "email" ? "Copied!" : "Copy send text"}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
