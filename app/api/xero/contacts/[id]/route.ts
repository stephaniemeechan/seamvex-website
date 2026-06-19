import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { fetchXeroContact, xeroContactToCustomerSnapshot } from "@/lib/xero/client"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
