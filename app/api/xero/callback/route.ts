import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import {
  exchangeXeroCode,
  fetchXeroConnections,
  saveXeroTokens,
  setLockedTenantId,
} from "@/lib/xero/client"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const cookieHeader = request.headers.get("cookie") ?? ""
  const cookieState = cookieHeader.match(/xero_oauth_state=([^;]+)/)?.[1]
  const oauthUser = cookieHeader.match(/xero_oauth_user=([^;]+)/)?.[1]

  if (!code || !state || state !== cookieState || oauthUser !== session.userId) {
    return NextResponse.redirect(new URL("/admin/settings?xero=error", url.origin))
  }

  try {
    const tokens = await exchangeXeroCode(code)
    const connections = await fetchXeroConnections(tokens.access_token)
    const tenant = connections[0]
    if (!tenant) throw new Error("No Xero tenant")
    await saveXeroTokens(
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in,
      tenant.tenantId,
      tenant.tenantName,
    )
    await setLockedTenantId(tenant.tenantId)
    const res = NextResponse.redirect(new URL("/admin/settings?xero=connected", url.origin))
    res.cookies.delete("xero_oauth_state")
    res.cookies.delete("xero_oauth_user")
    return res
  } catch {
    return NextResponse.redirect(new URL("/admin/settings?xero=error", url.origin))
  }
}
