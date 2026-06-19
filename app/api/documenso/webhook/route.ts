import { NextResponse } from "next/server"
import {
  downloadSignedPdf,
  extractSignatureFromWebhook,
  verifyWebhookSignature,
  type DocumensoWebhookPayload,
} from "@/lib/documenso/client"
import { addTicketActivity, listTickets } from "@/lib/crm/tickets"
import {
  getOrder,
  getOrderByDocumensoDocumentId,
  markOrderSigned,
  setXeroInvoiceId,
} from "@/lib/proposals/orders"
import { createDraftInvoice } from "@/lib/xero/client"
import { saveOrderPdf } from "@/lib/storage/pdfs"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const secret = process.env.DOCUMENSO_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 })
  }

  const received = request.headers.get("x-documenso-secret")
  if (!verifyWebhookSignature(received, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const body = (await request.json()) as { event?: string; payload?: DocumensoWebhookPayload }
  if (body.event !== "DOCUMENT_COMPLETED" || !body.payload?.id) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const documentId = body.payload.id
  let order = await getOrderByDocumensoDocumentId(documentId)
  if (!order && body.payload.externalId) {
    order = await getOrder(body.payload.externalId)
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }
  if (order.status === "signed") {
    return NextResponse.json({ ok: true, alreadySigned: true })
  }

  try {
    const pdfBuffer = await downloadSignedPdf(documentId)
    const signature = extractSignatureFromWebhook(body.payload)
    const pdfPath = await saveOrderPdf(order.id, `${order.documentNumber}-signed.pdf`, pdfBuffer)
    await markOrderSigned(order.id, signature, pdfPath)

    let invoiceId: string | null = null
    try {
      invoiceId = await createDraftInvoice(order)
      await setXeroInvoiceId(order.id, invoiceId)
    } catch {
      // Xero invoice is best-effort after signing
    }

    const tickets = await listTickets({ contactId: order.contactId ?? undefined })
    const ticket = tickets.find((t) => t.orderId === order.id)
    if (ticket) {
      await addTicketActivity({
        ticketId: ticket.id,
        kind: "system",
        body: "Agreement signed via Documenso.",
        metadata: {
          documentId,
          xeroInvoiceId: invoiceId,
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Webhook processing failed" },
      { status: 500 },
    )
  }
}
