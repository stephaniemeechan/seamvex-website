import { NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/rbac"
import { gmailConnectUrl } from "@/lib/gmail/client"

export const runtime = "nodejs"

export async function GET() {
  const session = await requireSession()
  if (session instanceof NextResponse) return session

  try {
    const state = crypto.randomUUID()
    const url = gmailConnectUrl(state)
    const res = NextResponse.redirect(url)
    res.cookies.set("gmail_oauth_state", state, { httpOnly: true, maxAge: 600, path: "/" })
    res.cookies.set("gmail_oauth_user", session.userId, { httpOnly: true, maxAge: 600, path: "/" })
    return res
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gmail connect failed" },
      { status: 503 },
    )
  }
}
