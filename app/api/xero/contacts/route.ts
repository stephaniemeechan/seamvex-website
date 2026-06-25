import { NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/auth/api-guards"
import { fetchXeroContacts, getXeroAccessToken, xeroConfig } from "@/lib/xero/client"

export const runtime = "nodejs"

export async function GET() {
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session

  const cfg = xeroConfig()
  if (!cfg) {
    return NextResponse.json({ configured: false, connected: false, contacts: [] })
  }

  const auth = await getXeroAccessToken()
  if (!auth) {
    return NextResponse.json({ configured: true, connected: false, contacts: [] })
  }

  try {
    const contacts = await fetchXeroContacts()
    return NextResponse.json({ configured: true, connected: true, contacts })
  } catch (e) {
    return NextResponse.json({
      configured: true,
      connected: true,
      contacts: [],
      error: e instanceof Error ? e.message : "Failed to load Xero contacts",
    })
  }
}
