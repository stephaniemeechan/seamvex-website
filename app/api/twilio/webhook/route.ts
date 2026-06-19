import { NextResponse } from "next/server"
import { addTicketActivity } from "@/lib/crm/tickets"
import { verifyTwilioSignature } from "@/lib/twilio/client"

export const runtime = "nodejs"

function formToRecord(form: FormData): Record<string, string> {
  const params: Record<string, string> = {}
  form.forEach((value, key) => {
    params[key] = String(value)
  })
  return params
}

export async function POST(request: Request) {
  const form = await request.formData()
  const params = formToRecord(form)
  const signature = request.headers.get("x-twilio-signature")
  const url = request.url

  if (!verifyTwilioSignature(signature, url, params)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const ticketId = params.ticketId
  const kind = params.MessageSid ? "sms_in" : "call_in"
  const body =
    params.Body ??
    `Inbound call ${params.CallStatus ?? ""} from ${params.From ?? "unknown"}`.trim()

  if (ticketId) {
    await addTicketActivity({
      ticketId,
      kind,
      body,
      metadata: {
        from: params.From,
        to: params.To,
        sid: params.MessageSid ?? params.CallSid,
        status: params.CallStatus ?? params.SmsStatus,
      },
    })
  }

  if (params.CallSid) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">Thank you for calling Seamcor. Goodbye.</Say></Response>`
    return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } })
  }

  return new NextResponse("", { status: 200 })
}
