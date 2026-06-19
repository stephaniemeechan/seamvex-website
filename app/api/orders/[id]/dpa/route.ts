import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getOrder } from "@/lib/proposals/orders"
import { generateDpaPdf } from "@/lib/proposals/dpa-pdf"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const order = await getOrder(id)
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!order.fullyManaged) {
    return NextResponse.json({ error: "DPA only required for Fully Managed orders" }, { status: 400 })
  }
  const buffer = await generateDpaPdf(order)
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="DPA-${order.documentNumber}.pdf"`,
    },
  })
}
