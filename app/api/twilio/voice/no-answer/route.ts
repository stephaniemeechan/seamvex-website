import { NextResponse } from "next/server"
import { getVoiceConfig } from "@/lib/twilio/voice-config"
import { twilioFromNumber } from "@/lib/twilio/client"
import { parseTwilioWebhook, voiceUrl } from "@/lib/twilio/webhook-utils"
import {
  buildDialTwiml,
  emptyTwiml,
  errorTwiml,
  sayAndHangup,
  twimlResponse,
} from "@/lib/twilio/twiml"

export const runtime = "nodejs"

const NO_ANSWER_STATUSES = new Set(["no-answer", "busy", "failed", "canceled"])

export async function POST(request: Request) {
  try {
    const parsed = await parseTwilioWebhook(request)
    if (!parsed.ok) {
      return NextResponse.json({ error: "Invalid signature" }, { status: parsed.status })
    }

    const dialStatus = parsed.params.DialCallStatus ?? parsed.params.CallStatus ?? ""
    if (!NO_ANSWER_STATUSES.has(dialStatus)) {
      return emptyTwiml()
    }

    const config = await getVoiceConfig()

    if (config.noAnswerAction === "hangup") {
      return sayAndHangup("No one is available to take your call. Goodbye.")
    }

    if (!config.afterHoursPhone) {
      return sayAndHangup("No one is available to take your call. Goodbye.")
    }

    const xml = buildDialTwiml({
      numbers: [config.afterHoursPhone],
      callerId: twilioFromNumber(),
      timeout: config.noAnswerTimeoutSec,
      statusCallbackUrl: voiceUrl("/api/twilio/voice/status", { direction: "inbound-fallback" }),
    })
    return twimlResponse(xml)
  } catch {
    return errorTwiml()
  }
}
