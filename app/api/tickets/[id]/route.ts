import { NextResponse } from "next/server"
import { requireSessionApi, requireSessionMutation } from "@/lib/auth/api-guards"
import { getTicket, updateTicket, type TicketStatus } from "@/lib/crm/tickets"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi()
  if (session instanceof NextResponse) return session

  const { id } = await params
  const ticket = await getTicket(id)
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ticket })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionMutation(request)
  if (session instanceof NextResponse) return session

  const { id } = await params
  const existing = await getTicket(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = (await request.json()) as {
    status?: TicketStatus
    assigneeUserId?: string | null
    subject?: string
    gmailThreadId?: string | null
  }

  const validStatuses: TicketStatus[] = ["open", "pending", "resolved", "closed"]
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  await updateTicket(id, {
    status: body.status,
    assigneeUserId: body.assigneeUserId,
    subject: body.subject,
    gmailThreadId: body.gmailThreadId,
  })

  const ticket = await getTicket(id)
  return NextResponse.json({ ticket })
}
