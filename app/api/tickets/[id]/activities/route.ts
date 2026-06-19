import { NextResponse } from "next/server"
import { requireSessionApi, requireSessionMutation } from "@/lib/auth/api-guards"
import { addTicketActivity, getTicket, listTicketActivities } from "@/lib/crm/tickets"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi()
  if (session instanceof NextResponse) return session

  const { id } = await params
  const ticket = await getTicket(id)
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const activities = await listTicketActivities(id)
  return NextResponse.json({ activities })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionMutation(request)
  if (session instanceof NextResponse) return session

  const { id } = await params
  const ticket = await getTicket(id)
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = (await request.json()) as {
    kind?: string
    body?: string
    metadata?: Record<string, unknown>
  }

  if (!body.kind?.trim()) {
    return NextResponse.json({ error: "kind is required" }, { status: 400 })
  }

  const activity = await addTicketActivity({
    ticketId: id,
    kind: body.kind.trim(),
    body: body.body,
    metadata: body.metadata,
    createdBy: session.userId,
  })
  return NextResponse.json({ activity })
}
