import { NextResponse } from "next/server"

export function twimlResponse(body: string, status = 200): NextResponse {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  })
}

export function emptyTwiml(): NextResponse {
  return twimlResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>')
}

export function sayAndHangup(message: string): NextResponse {
  const escaped = escapeXml(message)
  return twimlResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">${escaped}</Say><Hangup/></Response>`,
  )
}

export function errorTwiml(message = "We could not connect your call. Please try again later."): NextResponse {
  return sayAndHangup(message)
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function buildDialTwiml(opts: {
  numbers: string[]
  callerId?: string
  timeout?: number
  actionUrl?: string
  statusCallbackUrl?: string
}): string {
  const timeout = opts.timeout ?? 30
  const actionAttr = opts.actionUrl ? ` action="${escapeXml(opts.actionUrl)}"` : ""
  const statusAttr = opts.statusCallbackUrl
    ? ` statusCallback="${escapeXml(opts.statusCallbackUrl)}" statusCallbackEvent="initiated ringing answered completed"`
    : ""
  const callerAttr = opts.callerId ? ` callerId="${escapeXml(opts.callerId)}"` : ""
  const numbers = opts.numbers
    .map((n) => `<Number>${escapeXml(n)}</Number>`)
    .join("")
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Dial timeout="${timeout}"${actionAttr}${statusAttr}${callerAttr}>${numbers}</Dial></Response>`
}

export function buildSayThenDialTwiml(opts: {
  say?: string
  numbers: string[]
  callerId?: string
  timeout?: number
  actionUrl?: string
  statusCallbackUrl?: string
}): string {
  const sayPart = opts.say
    ? `<Say voice="alice">${escapeXml(opts.say)}</Say>`
    : ""
  const dial = buildDialTwiml({
    numbers: opts.numbers,
    callerId: opts.callerId,
    timeout: opts.timeout,
    actionUrl: opts.actionUrl,
    statusCallbackUrl: opts.statusCallbackUrl,
  })
  const dialInner = dial.replace(/^<\?xml[^>]*>\s*<Response>/, "").replace(/<\/Response>$/, "")
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${sayPart}${dialInner}</Response>`
}
