import { NextResponse } from "next/server"
import { getSession, type Session } from "@/lib/auth/session"

export type { Session } from "@/lib/auth/session"

export async function requireSession(): Promise<Session | NextResponse> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return session
}

export async function requireAdmin(): Promise<Session | NextResponse> {
  const session = await requireSession()
  if (session instanceof NextResponse) return session
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return session
}

export function canManageContracts(session: Session): boolean {
  return session.role === "admin"
}
