import { NextResponse } from "next/server"
import { googleAuthorizeUrl, googleConfig } from "@/lib/auth/google"

export const runtime = "nodejs"

export async function GET() {
  const cfg = googleConfig()
  if (!cfg) {
    return NextResponse.json(
      {
        error: "Google OAuth not configured",
        hint: "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env.local",
      },
      { status: 503 },
    )
  }

  const state = crypto.randomUUID()
  const res = NextResponse.redirect(googleAuthorizeUrl(state))
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  return res
}
