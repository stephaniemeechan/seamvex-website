import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth/session"
import { legacySignAllowed } from "@/lib/env"
import { clientIp, rateLimit } from "@/lib/auth/security"

const PUBLIC_API_ROUTES = new Set([
  "/api/auth/google",
  "/api/auth/google/callback",
  "/api/auth/login",
  "/api/documenso/webhook",
  "/api/twilio/webhook",
  "/api/gmail/connect/callback",
  "/api/xero/callback",
])

const RATE_LIMITED_AUTH_ROUTES = new Set([
  "/api/auth/login",
  "/api/auth/google",
  "/api/auth/google/callback",
])

function isPublicApiRoute(pathname: string): boolean {
  if (PUBLIC_API_ROUTES.has(pathname)) return true
  if (legacySignAllowed() && pathname.startsWith("/api/sign/")) return true
  return false
}

function authRateLimited(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  if (!RATE_LIMITED_AUTH_ROUTES.has(pathname)) return null
  const ip = clientIp(request)
  if (!rateLimit(`auth:${pathname}:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/sign/") && !legacySignAllowed()) {
    return new NextResponse(null, { status: 404 })
  }

  if (pathname.startsWith("/api/")) {
    const limited = authRateLimited(request)
    if (limited) return limited

    if (isPublicApiRoute(pathname)) return NextResponse.next()

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const session = await verifySession(token)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  if (!pathname.startsWith("/admin")) return NextResponse.next()
  if (pathname === "/admin/login") return NextResponse.next()

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }
  const session = await verifySession(token)
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*", "/sign/:path*"],
}
