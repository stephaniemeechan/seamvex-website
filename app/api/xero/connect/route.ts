import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/rbac"
import { integrationConfigHint } from "@/lib/integration-status"
import { xeroAuthorizeUrl, xeroConfig } from "@/lib/xero/client"

export const runtime = "nodejs"

export async function GET() {
  const session = await requireAdmin()
  if (session instanceof NextResponse) return session
  const cfg = xeroConfig()
  if (!cfg) {
    return NextResponse.json(
      {
        error: "Xero not configured",
        hint: integrationConfigHint("xero"),
      },
      { status: 503 },
    )
  }
  const state = crypto.randomUUID()
  const res = NextResponse.redirect(xeroAuthorizeUrl(state))
  res.cookies.set("xero_oauth_state", state, { httpOnly: true, maxAge: 600, path: "/" })
  res.cookies.set("xero_oauth_user", session.userId, { httpOnly: true, maxAge: 600, path: "/" })
  return res
}
