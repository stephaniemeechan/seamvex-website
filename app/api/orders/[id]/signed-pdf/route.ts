import { NextResponse } from "next/server"
import fs from "fs"
import { getSession } from "@/lib/auth/session"
import { getOrder } from "@/lib/proposals/orders"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const order = await getOrder(id)
  if (!order?.signedPdfPath || !fs.existsSync(order.signedPdfPath)) {
    return NextResponse.json({ error: "Signed PDF not found" }, { status: 404 })
  }
  const buffer = fs.readFileSync(order.signedPdfPath)
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.documentNumber}-signed.pdf"`,
    },
  })
}
