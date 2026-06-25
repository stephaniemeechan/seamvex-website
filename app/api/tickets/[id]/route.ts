import { NextResponse } from "next/server"
import { requireSessionApi, requireSessionMutation } from "@/lib/auth/api-guards"
import { getTicket, updateTicket, type TicketStatus } from "@/lib/crm/tickets"
import { getContact } from "@/lib/crm/contacts"
import { validateContactPersonRef } from "@/lib/crm/contact-persons"
import { contactPersonRefToStorage } from "@/lib/xero/types"
import type { ContactPersonRef } from "@/lib/xero/types"

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
    contactPersonRef?: ContactPersonRef | string | null
  }

  if (body.assigneeUserId !== undefined && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const validStatuses: TicketStatus[] = ["open", "pending", "resolved", "closed"]
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  let contactPersonRef: string | null | undefined
  if (body.contactPersonRef !== undefined) {
    contactPersonRef = contactPersonRefToStorage(
      body.contactPersonRef === null ? null : (body.contactPersonRef as ContactPersonRef),
    )
    const contact = await getContact(existing.contactId)
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 400 })
    const personErr = validateContactPersonRef(contactPersonRef, contact)
    if (personErr) return NextResponse.json({ error: personErr }, { status: 400 })
  }

  await updateTicket(id, {
    status: body.status,
    assigneeUserId: session.role === "admin" ? body.assigneeUserId : undefined,
    subject: body.subject,
    gmailThreadId: body.gmailThreadId,
    contactPersonRef,
  })

  const ticket = await getTicket(id)
  return NextResponse.json({ ticket })
}
