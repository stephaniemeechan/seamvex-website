import { NextResponse } from "next/server"
import { requireSessionApi, requireSessionMutation } from "@/lib/auth/api-guards"
import { createTicket, listTickets } from "@/lib/crm/tickets"
import { getContact } from "@/lib/crm/contacts"
import { validateContactPersonRef } from "@/lib/crm/contact-persons"
import { contactPersonRefToStorage } from "@/lib/xero/types"
import type { ContactPersonRef } from "@/lib/xero/types"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await requireSessionApi()
  if (session instanceof NextResponse) return session

  const { searchParams } = new URL(request.url)
  const contactId = searchParams.get("contactId") ?? undefined

  const tickets = await listTickets({ contactId })
  return NextResponse.json({ tickets })
}

export async function POST(request: Request) {
  const session = await requireSessionMutation(request)
  if (session instanceof NextResponse) return session

  const body = (await request.json()) as {
    contactId?: string
    contactPersonRef?: ContactPersonRef | string | null
    orderId?: string
    subject?: string
    assigneeUserId?: string
  }

  if (!body.contactId?.trim()) {
    return NextResponse.json({ error: "contactId is required" }, { status: 400 })
  }
  if (!body.subject?.trim()) {
    return NextResponse.json({ error: "subject is required" }, { status: 400 })
  }

  const contact = await getContact(body.contactId)
  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 400 })

  const personRef = contactPersonRefToStorage(
    body.contactPersonRef === undefined || body.contactPersonRef === null
      ? null
      : (body.contactPersonRef as ContactPersonRef),
  )
  const personErr = validateContactPersonRef(personRef, contact)
  if (personErr) return NextResponse.json({ error: personErr }, { status: 400 })

  if (body.assigneeUserId && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const ticket = await createTicket({
    contactId: body.contactId,
    contactPersonRef: personRef,
    orderId: body.orderId,
    subject: body.subject.trim(),
    assigneeUserId: session.role === "admin" ? body.assigneeUserId : undefined,
    createdBy: session.userId,
  })
  return NextResponse.json({ ticket })
}
