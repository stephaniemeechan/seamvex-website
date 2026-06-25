import { NextResponse } from "next/server"
import { requireSessionApi } from "@/lib/auth/api-guards"
import { getContact } from "@/lib/crm/contacts"
import { fetchXeroContactAr, fetchXeroInvoicesForContact } from "@/lib/xero/client"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await requireSessionApi()
  if (session instanceof NextResponse) return session

  const { searchParams } = new URL(request.url)
  const contactId = searchParams.get("contactId")
  if (!contactId) {
    return NextResponse.json({ error: "contactId is required" }, { status: 400 })
  }

  const contact = await getContact(contactId)
  if (!contact?.xeroContactId) {
    return NextResponse.json({ invoices: [], ar: null })
  }

  try {
    const [invoices, ar] = await Promise.all([
      fetchXeroInvoicesForContact(contact.xeroContactId),
      fetchXeroContactAr(contact.xeroContactId),
    ])
    return NextResponse.json({ invoices, ar })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Xero fetch failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
