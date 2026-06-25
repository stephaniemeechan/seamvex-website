import { NextResponse } from "next/server"
import { integrationConfigHint } from "@/lib/integration-status"
import { googleAuthorizeUrl, googleConfig } from "@/lib/auth/google"

export const runtime = "nodejs"

export async function GET() {
  const cfg = googleConfig()
  if (!cfg) {
    return NextResponse.json(
      {
        error: "Google OAuth not configured",
        hint: integrationConfigHint("google"),
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
