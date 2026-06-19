import { NextResponse } from "next/server"
import { requireSessionMutation } from "@/lib/auth/api-guards"
import { clearSessionCookie } from "@/lib/auth/session"

export async function POST(request: Request) {
  const session = await requireSessionMutation(request)
  if (session instanceof NextResponse) return session
  await clearSessionCookie()
  return NextResponse.json({ ok: true })
}
