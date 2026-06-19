import twilio from "twilio"
import { addTicketActivity } from "@/lib/crm/tickets"

function twilioClient(): twilio.Twilio | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) return null
  return twilio(accountSid, authToken)
}

export function twilioFromNumber(): string {
  const from = process.env.TWILIO_PHONE_NUMBER
  if (!from) throw new Error("TWILIO_PHONE_NUMBER not configured")
  return from
}

function webhookUrlWithTicket(ticketId?: string): string {
  const base =
    process.env.TWILIO_VOICE_WEBHOOK_URL ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/twilio/webhook`
  if (!ticketId) return base
  const url = new URL(base)
  url.searchParams.set("ticketId", ticketId)
  return url.toString()
}

export async function sendSms(
  to: string,
  body: string,
  opts?: { ticketId?: string; createdBy?: string },
): Promise<{ sid: string }> {
  const client = twilioClient()
  if (!client) throw new Error("Twilio not configured")

  const message = await client.messages.create({
    from: twilioFromNumber(),
    to,
    body,
    ...(opts?.ticketId ? { statusCallback: webhookUrlWithTicket(opts.ticketId) } : {}),
  })

  if (opts?.ticketId) {
    await addTicketActivity({
      ticketId: opts.ticketId,
      kind: "sms_out",
      body,
      metadata: { sid: message.sid, to },
      createdBy: opts.createdBy,
    })
  }

  return { sid: message.sid }
}

export async function initiateCall(
  to: string,
  opts?: { ticketId?: string; createdBy?: string },
): Promise<{ sid: string }> {
  const client = twilioClient()
  if (!client) throw new Error("Twilio not configured")

  const call = await client.calls.create({
    from: twilioFromNumber(),
    to,
    url: webhookUrlWithTicket(opts?.ticketId),
  })

  if (opts?.ticketId) {
    await addTicketActivity({
      ticketId: opts.ticketId,
      kind: "call_out",
      body: `Outbound call initiated to ${to}`,
      metadata: { sid: call.sid, to },
      createdBy: opts.createdBy,
    })
  }

  return { sid: call.sid }
}

export function verifyTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>,
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!signature || !authToken) return false
  return twilio.validateRequest(authToken, signature, url, params)
}
