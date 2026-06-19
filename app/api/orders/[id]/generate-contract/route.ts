import { NextResponse } from "next/server"
import { requireAdminMutation, sanitizeOrderForApi } from "@/lib/auth/api-guards"
import { generateContract, getOrder } from "@/lib/proposals/orders"

export const runtime = "nodejs"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const existing = await getOrder(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.status !== "proposal") {
    return NextResponse.json({ error: "Only draft proposals can become contracts" }, { status: 400 })
  }

  const order = await generateContract(id)
  if (!order) return NextResponse.json({ error: "Cannot generate contract" }, { status: 400 })
  return NextResponse.json({ order: sanitizeOrderForApi(order, session) })
}
