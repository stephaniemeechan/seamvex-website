import { NextResponse } from "next/server"
import { getOrderBySignToken } from "@/lib/proposals/orders"
import { generateContractPdf } from "@/lib/proposals/pdf"
import { legacySignAllowed } from "@/lib/env"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!legacySignAllowed()) return new NextResponse(null, { status: 404 })

  const { token } = await params
  const order = await getOrderBySignToken(token)
  if (!order || order.status !== "sent") {
    return new NextResponse(null, { status: 404 })
  }

  const buffer = await generateContractPdf(order)
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.documentNumber}.pdf"`,
    },
  })
}
