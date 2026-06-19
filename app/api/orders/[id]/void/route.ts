import { NextResponse } from "next/server"
import { requireAdminMutation, sanitizeOrderForApi } from "@/lib/auth/api-guards"
import { getOrder, markOrderVoid } from "@/lib/proposals/orders"

export const runtime = "nodejs"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const order = await markOrderVoid(id)
  if (!order) return NextResponse.json({ error: "Cannot void" }, { status: 400 })
  return NextResponse.json({ order: sanitizeOrderForApi(order, session) })
}
