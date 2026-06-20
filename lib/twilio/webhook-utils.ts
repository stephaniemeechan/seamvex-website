import { verifyTwilioSignature, twilioRequestUrl } from "@/lib/twilio/client"
import { appBaseUrl } from "@/lib/env"

export { twilioRequestUrl }

export function formToRecord(form: FormData): Record<string, string> {
  const params: Record<string, string> = {}
  form.forEach((value, key) => {
    params[key] = String(value)
  })
  return params
}

export async function parseTwilioWebhook(request: Request): Promise<{
  ok: true
  params: Record<string, string>
} | {
  ok: false
  status: number
}> {
  const form = await request.formData()
  const params = formToRecord(form)
  const signature = request.headers.get("x-twilio-signature")
  const url = twilioRequestUrl(request)
  if (!verifyTwilioSignature(signature, url, params)) {
    return { ok: false, status: 401 }
  }
  return { ok: true, params }
}

export function voiceUrl(path: string, query?: Record<string, string>): string {
  const base = appBaseUrl().replace(/\/$/, "")
  const url = new URL(`${base}${path}`)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v) url.searchParams.set(k, v)
    }
  }
  return url.toString()
}
