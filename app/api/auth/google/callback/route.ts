import { NextResponse } from "next/server"
import { exchangeGoogleCode } from "@/lib/auth/google"
import { createSession, setSessionCookie } from "@/lib/auth/session"
import { upsertGoogleUser } from "@/lib/crm/users"

export const runtime = "nodejs"

const SEAMVEX_DOMAIN = "@seamvex.com"

function loginError(origin: string, code: string) {
  return NextResponse.redirect(new URL(`/admin/login?error=${code}`, origin))
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const cookieState = request.headers.get("cookie")?.match(/google_oauth_state=([^;]+)/)?.[1]

  if (!code || !state || state !== cookieState) {
    return loginError(url.origin, "oauth_state")
  }

  try {
    const profile = await exchangeGoogleCode(code)
    if (!profile.email.endsWith(SEAMVEX_DOMAIN)) {
      return loginError(url.origin, "domain")
    }

    const user = await upsertGoogleUser({
      googleSub: profile.sub,
      email: profile.email,
      name: profile.name,
    })

    if (!user.active) {
      return loginError(url.origin, "inactive")
    }

    const token = await createSession({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name ?? profile.name,
    })
    await setSessionCookie(token)

    const res = NextResponse.redirect(new URL("/admin", url.origin))
    res.cookies.delete("google_oauth_state")
    return res
  } catch {
    return loginError(url.origin, "oauth_failed")
  }
}
