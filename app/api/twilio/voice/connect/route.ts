import { NextResponse } from "next/server"
import { twilioFromNumber, twilioRequestUrl } from "@/lib/twilio/client"
import { parseTwilioWebhook } from "@/lib/twilio/webhook-utils"
import { buildDialTwiml, errorTwiml, twimlResponse } from "@/lib/twilio/twiml"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const parsed = await parseTwilioWebhook(request)
    if (!parsed.ok) {
      return NextResponse.json({ error: "Invalid signature" }, { status: parsed.status })
    }

    const url = new URL(twilioRequestUrl(request))
    const customer = url.searchParams.get("customer")?.trim()
    if (!customer) {
      return errorTwiml("We could not connect your call.")
    }

    const xml = buildDialTwiml({
      numbers: [customer],
      callerId: twilioFromNumber(),
    })
    return twimlResponse(xml)
  } catch {
    return errorTwiml()
  }
}
