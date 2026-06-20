import { NextResponse } from "next/server"
import {
  getVoiceConfig,
  isWithinBusinessHours,
  resolveRingPhones,
} from "@/lib/twilio/voice-config"
import { twilioFromNumber } from "@/lib/twilio/client"
import { parseTwilioWebhook, voiceUrl } from "@/lib/twilio/webhook-utils"
import {
  buildSayThenDialTwiml,
  buildDialTwiml,
  errorTwiml,
  sayAndHangup,
  twimlResponse,
} from "@/lib/twilio/twiml"
import { logInboundCallActivity } from "@/lib/twilio/call-log"

export const runtime = "nodejs"

async function afterHoursTwiml(
  config: Awaited<ReturnType<typeof getVoiceConfig>>,
  statusQuery: Record<string, string>,
) {
  if (!config.afterHoursPhone) {
    return sayAndHangup(
      config.afterHoursGreeting ||
        "We are currently closed. Please call back during support hours.",
    )
  }
  const xml = buildSayThenDialTwiml({
    say: config.afterHoursGreeting || undefined,
    numbers: [config.afterHoursPhone],
    callerId: twilioFromNumber(),
    timeout: config.noAnswerTimeoutSec,
    statusCallbackUrl: voiceUrl("/api/twilio/voice/status", statusQuery),
  })
  return twimlResponse(xml)
}

export async function POST(request: Request) {
  try {
    const parsed = await parseTwilioWebhook(request)
    if (!parsed.ok) {
      return NextResponse.json({ error: "Invalid signature" }, { status: parsed.status })
    }

    const { params } = parsed
    const from = params.From ?? "unknown"
    const to = params.To

    const logged = await logInboundCallActivity({
      from,
      to,
      callSid: params.CallSid,
      status: params.CallStatus ?? "ringing",
    })

    const config = await getVoiceConfig()
    const inHours = isWithinBusinessHours(config)
    const statusQuery: Record<string, string> = { direction: "inbound" }
    if (logged.ticketId) statusQuery.ticketId = logged.ticketId

    if (!inHours) {
      return afterHoursTwiml(config, statusQuery)
    }

    const ringPhones = await resolveRingPhones(config)
    if (!ringPhones.length) {
      if (config.noAnswerAction === "forward_mobile" && config.afterHoursPhone) {
        return afterHoursTwiml(config, statusQuery)
      }
      return sayAndHangup("No one is available to take your call right now. Please try again later.")
    }

    const noAnswerUrl = voiceUrl("/api/twilio/voice/no-answer")
    const statusUrl = voiceUrl("/api/twilio/voice/status", statusQuery)
    const xml = buildSayThenDialTwiml({
      say: config.inHoursGreeting || undefined,
      numbers: ringPhones,
      callerId: twilioFromNumber(),
      timeout: config.noAnswerTimeoutSec,
      actionUrl: noAnswerUrl,
      statusCallbackUrl: statusUrl,
    })
    return twimlResponse(xml)
  } catch {
    return errorTwiml()
  }
}
