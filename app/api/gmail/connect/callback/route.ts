import { NextResponse } from "next/server"
import { googleOAuthClient } from "@/lib/auth/google"
import { saveGmailRefreshToken } from "@/lib/gmail/client"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const cookieState = request.headers.get("cookie")?.match(/gmail_oauth_state=([^;]+)/)?.[1]
  const userId = request.headers.get("cookie")?.match(/gmail_oauth_user=([^;]+)/)?.[1]

  if (!code || !state || state !== cookieState || !userId) {
    return NextResponse.redirect(new URL("/admin/settings?gmail=error", url.origin))
  }

  const redirectUri =
    process.env.GMAIL_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/gmail/connect/callback`

  try {
    const client = googleOAuthClient()
    if (!client) throw new Error("Google OAuth not configured")
    const { tokens } = await client.getToken({ code, redirect_uri: redirectUri })
    if (!tokens.refresh_token) throw new Error("No refresh token returned")
    await saveGmailRefreshToken(userId, tokens.refresh_token)

    const res = NextResponse.redirect(new URL("/admin/settings?gmail=connected", url.origin))
    res.cookies.delete("gmail_oauth_state")
    res.cookies.delete("gmail_oauth_user")
    return res
  } catch {
    return NextResponse.redirect(new URL("/admin/settings?gmail=error", url.origin))
  }
}
