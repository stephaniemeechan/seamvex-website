import { NextResponse } from "next/server"
import { exchangeGoogleCode } from "@/lib/auth/google"
import { createSession, setSessionCookie } from "@/lib/auth/session"
import { upsertGoogleUser } from "@/lib/crm/users"
import { publicUrl } from "@/lib/request-url"

export const runtime = "nodejs"

const SEAMVEX_DOMAIN = "@seamvex.com"

function loginError(request: Request, code: string) {
  return NextResponse.redirect(publicUrl(request, `/admin/login?error=${code}`))
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const cookieState = request.headers.get("cookie")?.match(/google_oauth_state=([^;]+)/)?.[1]

  if (!code || !state || state !== cookieState) {
    return loginError(request, "oauth_state")
  }

  try {
    const profile = await exchangeGoogleCode(code)
    if (!profile.email.endsWith(SEAMVEX_DOMAIN)) {
      return loginError(request, "domain")
    }

    const user = await upsertGoogleUser({
      googleSub: profile.sub,
      email: profile.email,
      name: profile.name,
    })

    if (!user.active) {
      return loginError(request, "inactive")
    }

    const token = await createSession({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name ?? profile.name,
    })
    await setSessionCookie(token)

    const res = NextResponse.redirect(publicUrl(request, "/admin"))
    res.cookies.delete("google_oauth_state")
    return res
  } catch (err) {
    console.error("Google OAuth callback failed:", err)
    const msg = err instanceof Error ? err.message.toLowerCase() : ""
    const code =
      msg.includes("connect") ||
      msg.includes("econnrefused") ||
      msg.includes("password") ||
      msg.includes("database") ||
      msg.includes("cloud sql")
        ? "oauth_db"
        : "oauth_failed"
    return loginError(request, code)
  }
}
