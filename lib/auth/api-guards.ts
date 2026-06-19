import { NextResponse } from "next/server"
import type { Session } from "@/lib/auth/session"
import { requireSession, requireAdmin } from "@/lib/auth/rbac"
import { verifyCsrf } from "@/lib/auth/security"
import { isProduction } from "@/lib/env"
import type { OrderRecord } from "@/lib/proposals/orders"

export async function requireSessionApi(): Promise<Session | NextResponse> {
  return requireSession()
}

export async function requireAdminApi(): Promise<Session | NextResponse> {
  return requireAdmin()
}

export async function requireAdminMutation(request: Request): Promise<Session | NextResponse> {
  const session = await requireAdmin()
  if (session instanceof NextResponse) return session
  if (!(await verifyCsrf(request))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }
  return session
}

export async function requireSessionMutation(request: Request): Promise<Session | NextResponse> {
  const session = await requireSession()
  if (session instanceof NextResponse) return session
  if (!(await verifyCsrf(request))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  }
  return session
}

/** Strip sensitive signing fields from order JSON for API responses */
export function sanitizeOrderForApi(order: OrderRecord, session: Session): OrderRecord {
  const copy = { ...order }
  const prod = isProduction()
  if (session.role !== "admin") {
    copy.signToken = null
    copy.documensoSigningUrl = null
  } else if (prod) {
    copy.signToken = null
  }
  return copy
}

export function sanitizeOrdersForApi(orders: OrderRecord[], session: Session): OrderRecord[] {
  return orders.map((o) => sanitizeOrderForApi(o, session))
}
