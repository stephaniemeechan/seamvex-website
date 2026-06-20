import twilio from "twilio"
import { addTicketActivity } from "@/lib/crm/tickets"
import { appBaseUrl } from "@/lib/env"
import { normalizePhoneE164, isValidE164 } from "@/lib/phone/normalize"
import { voiceUrl } from "@/lib/twilio/webhook-utils"

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

export function twilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER,
  )
}

/** Reconstruct public URL Twilio signed (Cloud Run proxy fix). */
export function twilioRequestUrl(request: Request): string {
  const url = new URL(request.url)
  const forwardedProto = request.headers.get("x-forwarded-proto")
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host")

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}${url.pathname}${url.search}`
  }

  const base = appBaseUrl().replace(/\/$/, "")
  return `${base}${url.pathname}${url.search}`
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

export function normalizeDialTarget(phone: string): string {
  const e164 = normalizePhoneE164(phone)
  if (!e164 || !isValidE164(e164)) {
    throw new Error("Invalid phone number — use E.164 format, e.g. +447...")
  }
  return e164
}

export async function initiateOutboundCall(opts: {
  agentPhone: string
  customerPhone: string
  ticketId?: string
  createdBy?: string
}): Promise<{ sid: string }> {
  const client = twilioClient()
  if (!client) throw new Error("Twilio not configured")

  const agent = normalizeDialTarget(opts.agentPhone)
  const customer = normalizeDialTarget(opts.customerPhone)
  const company = twilioFromNumber()

  const connectUrl = voiceUrl("/api/twilio/voice/connect", {
    customer: customer,
    ticketId: opts.ticketId ?? "",
  })
  const statusUrl = voiceUrl("/api/twilio/voice/status", {
    ticketId: opts.ticketId ?? "",
    direction: "outbound",
  })

  const call = await client.calls.create({
    to: agent,
    from: company,
    url: connectUrl,
    statusCallback: statusUrl,
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    statusCallbackMethod: "POST",
  })

  if (opts.ticketId) {
    await addTicketActivity({
      ticketId: opts.ticketId,
      kind: "call_out",
      body: `Outbound call initiated to ${customer}`,
      metadata: { sid: call.sid, to: customer, agent },
      createdBy: opts.createdBy,
    })
  }

  return { sid: call.sid }
}

export const TWILIO_PUBLIC_VOICE_ROUTES = [
  "/api/twilio/voice/connect",
  "/api/twilio/voice/inbound",
  "/api/twilio/voice/no-answer",
  "/api/twilio/voice/status",
] as const
