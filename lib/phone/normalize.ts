/** Strip to digits only */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "")
}

/** Best-effort E.164 for UK numbers (Twilio expects + prefix). */
export function normalizePhoneE164(phone: string, defaultCountryCode = "44"): string | null {
  const trimmed = phone.trim()
  if (!trimmed) return null
  const digits = phoneDigits(trimmed)
  if (!digits) return null

  if (trimmed.startsWith("+")) return `+${digits}`

  if (digits.startsWith("00")) return `+${digits.slice(2)}`

  if (digits.startsWith("0")) return `+${defaultCountryCode}${digits.slice(1)}`

  if (digits.startsWith(defaultCountryCode)) return `+${digits}`

  return `+${defaultCountryCode}${digits}`
}

/** Compare two phone strings (handles Xero spaced format vs E.164). */
export function phonesMatch(a: string, b: string): boolean {
  const da = phoneDigits(a)
  const db = phoneDigits(b)
  if (!da || !db) return false
  if (da === db) return true
  const tail = 10
  if (da.length >= tail && db.length >= tail) {
    return da.slice(-tail) === db.slice(-tail)
  }
  return da.endsWith(db) || db.endsWith(da)
}

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone.trim())
}
