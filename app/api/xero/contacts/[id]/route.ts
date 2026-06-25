import { NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/auth/api-guards"
import { fetchXeroContact, xeroContactToCustomerSnapshot } from "@/lib/xero/client"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session
  const { id } = await params
  try {
    const contact = await fetchXeroContact(id)
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    return NextResponse.json({ customer: xeroContactToCustomerSnapshot(contact) })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load contact" },
      { status: 500 },
    )
  }
}
