import { NextResponse } from "next/server"
import { getOrderBySignToken, markOrderSigned } from "@/lib/proposals/orders"
import { saveOrderPdf } from "@/lib/proposals/pdf"
import { legacySignAllowed } from "@/lib/env"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!legacySignAllowed()) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { token } = await params
  const order = await getOrderBySignToken(token)
  if (!order || order.status !== "sent") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({
    order: {
      id: order.id,
      documentNumber: order.documentNumber,
      customer: order.customer,
      status: order.status,
    },
    signed: false,
  })
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!legacySignAllowed()) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { token } = await params
  const order = await getOrderBySignToken(token)
  if (!order || order.status !== "sent") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = (await request.json()) as {
    name: string
    position: string
    date: string
    poNumber?: string
    acceptedTerms: boolean
  }

  if (!body.acceptedTerms || !body.name || !body.position || !body.date) {
    return NextResponse.json({ error: "Complete all fields and accept T&Cs" }, { status: 400 })
  }

  const signature = {
    name: body.name,
    position: body.position,
    date: body.date,
    poNumber: body.poNumber,
  }

  const pdfPath = await saveOrderPdf(order, signature)
  const signed = await markOrderSigned(order.id, signature, pdfPath)
  if (!signed) {
    return NextResponse.json({ error: "Failed to mark order signed" }, { status: 500 })
  }
  return NextResponse.json({
    order: {
      id: signed.id,
      documentNumber: signed.documentNumber,
      customer: signed.customer,
      status: signed.status,
    },
    ok: true,
  })
}
