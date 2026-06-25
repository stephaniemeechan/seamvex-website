import { NextResponse } from "next/server"
import { requireAdminMutation, sanitizeOrderForApi } from "@/lib/auth/api-guards"
import { addTicketActivity, listTickets } from "@/lib/crm/tickets"
import { createDraftInvoice, xeroConfig } from "@/lib/xero/client"
import { getOrder, markOrderSigned, setXeroInvoiceId } from "@/lib/proposals/orders"
import { saveOrderPdf } from "@/lib/storage/pdfs"

export const runtime = "nodejs"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session

  const { id } = await params
  const order = await getOrder(id)
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (order.status === "signed") {
    return NextResponse.json({ error: "Order is already signed" }, { status: 400 })
  }
  if (order.status !== "contract" && order.status !== "sent") {
    return NextResponse.json({ error: "Order must be contract or sent status" }, { status: 400 })
  }

  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Signed PDF file is required" }, { status: 400 })
  }

  const signerName = String(form.get("signerName") ?? "").trim()
  const signerPosition = String(form.get("signerPosition") ?? "").trim()
  const signerDate = String(form.get("signerDate") ?? "").trim() || new Date().toISOString().slice(0, 10)
  const poNumber = String(form.get("poNumber") ?? "").trim() || undefined
  const createXeroInvoice = form.get("createXeroInvoice") === "true"

  if (!signerName) {
    return NextResponse.json({ error: "signerName is required" }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const pdfPath = await saveOrderPdf(order.id, `${order.documentNumber}-signed.pdf`, buffer)

    const signed = await markOrderSigned(
      id,
      { name: signerName, position: signerPosition, date: signerDate, poNumber },
      pdfPath,
    )
    if (!signed) {
      return NextResponse.json({ error: "Could not mark order signed" }, { status: 400 })
    }

    let xeroInvoiceId: string | undefined
    if (createXeroInvoice && xeroConfig() && !signed.xeroInvoiceId && signed.customer.xeroContactId) {
      try {
        const refreshed = await getOrder(id)
        if (refreshed) {
          xeroInvoiceId = await createDraftInvoice(refreshed)
          await setXeroInvoiceId(id, xeroInvoiceId)
        }
      } catch {
        /* optional */
      }
    }

    if (order.contactId) {
      const tickets = await listTickets({ contactId: order.contactId })
      const ticket = tickets.find((t) => t.orderId === order.id)
      if (ticket) {
        await addTicketActivity({
          ticketId: ticket.id,
          kind: "system",
          body: "Agreement marked signed manually (uploaded PDF).",
          metadata: xeroInvoiceId ? { xeroInvoiceId } : undefined,
          createdBy: session.userId,
        })
      }
    }

    const finalOrder = await getOrder(id)
    return NextResponse.json({
      order: sanitizeOrderForApi(finalOrder!, session),
      xeroInvoiceId: xeroInvoiceId ?? finalOrder?.xeroInvoiceId ?? null,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Manual sign failed" },
      { status: 500 },
    )
  }
}
