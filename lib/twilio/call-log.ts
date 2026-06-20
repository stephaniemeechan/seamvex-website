import { findContactByPhone } from "@/lib/crm/contacts"
import { addTicketActivity, getOpenTicketForContact } from "@/lib/crm/tickets"

export async function logInboundCallActivity(opts: {
  from: string
  to?: string
  callSid?: string
  status?: string
  body?: string
}): Promise<{ contactId: string | null; ticketId: string | null }> {
  const contact = await findContactByPhone(opts.from)
  if (!contact) {
    return { contactId: null, ticketId: null }
  }

  const ticket = await getOpenTicketForContact(contact.id)
  const body =
    opts.body ??
    `Inbound call from ${opts.from}${opts.status ? ` (${opts.status})` : ""}`

  if (ticket) {
    await addTicketActivity({
      ticketId: ticket.id,
      kind: "call_in",
      body,
      metadata: {
        from: opts.from,
        to: opts.to,
        sid: opts.callSid,
        status: opts.status,
        contactId: contact.id,
      },
    })
    return { contactId: contact.id, ticketId: ticket.id }
  }

  return { contactId: contact.id, ticketId: null }
}

export async function logCallStatusActivity(opts: {
  ticketId: string
  callSid?: string
  status?: string
  duration?: string
  direction?: string
}): Promise<void> {
  if (!opts.ticketId || opts.status !== "completed") return
  const durationSec = opts.duration ? parseInt(opts.duration, 10) : null
  await addTicketActivity({
    ticketId: opts.ticketId,
    kind: "call_completed",
    body: `Call completed${durationSec != null && !Number.isNaN(durationSec) ? ` (${durationSec}s)` : ""}`,
    metadata: {
      sid: opts.callSid,
      status: opts.status,
      duration: opts.duration,
      direction: opts.direction,
    },
  })
}
