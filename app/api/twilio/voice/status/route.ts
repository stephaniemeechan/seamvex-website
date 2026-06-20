import { NextResponse } from "next/server"
import { parseTwilioWebhook, twilioRequestUrl } from "@/lib/twilio/webhook-utils"
import { logCallStatusActivity } from "@/lib/twilio/call-log"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const parsed = await parseTwilioWebhook(request)
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid signature" }, { status: parsed.status })
  }

  const url = new URL(twilioRequestUrl(request))
  const ticketId = url.searchParams.get("ticketId")?.trim()
  const direction = url.searchParams.get("direction") ?? "unknown"
  const callStatus = parsed.params.CallStatus ?? parsed.params.DialCallStatus ?? ""

  if (ticketId && callStatus === "completed") {
    await logCallStatusActivity({
      ticketId,
      callSid: parsed.params.CallSid ?? parsed.params.DialCallSid,
      status: callStatus,
      duration: parsed.params.CallDuration ?? parsed.params.DialCallDuration,
      direction,
    })
  }

  return new NextResponse("", { status: 200 })
}
