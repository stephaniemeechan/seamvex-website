import { NextResponse } from "next/server"
import { requireSessionApi } from "@/lib/auth/api-guards"
import { fetchXeroInvoice, xeroInvoiceWebUrl } from "@/lib/xero/client"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi()
  if (session instanceof NextResponse) return session

  const { id } = await params
  const invoice = await fetchXeroInvoice(id)
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  return NextResponse.json({ invoice, webUrl: xeroInvoiceWebUrl(id) })
}
