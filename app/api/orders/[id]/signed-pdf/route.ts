import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/get-session"
import { getOrder } from "@/lib/proposals/orders"
import { readOrderPdf } from "@/lib/storage/pdfs"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const order = await getOrder(id)
  if (!order?.signedPdfPath) {
    return NextResponse.json({ error: "Signed PDF not found" }, { status: 404 })
  }
  let buffer: Buffer
  try {
    buffer = await readOrderPdf(order.signedPdfPath)
  } catch {
    return NextResponse.json({ error: "Signed PDF not found" }, { status: 404 })
  }
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.documentNumber}-signed.pdf"`,
    },
  })
}
