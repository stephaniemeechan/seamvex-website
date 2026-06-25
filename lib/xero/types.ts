/** Additional person on a Xero customer contact (ContactPersons[]). */
export type XeroContactPerson = {
  firstName?: string
  lastName?: string
  emailAddress?: string
  includeInEmails?: boolean
}

/** Reference to a person on a company contact: primary or index 0–4 into additional people. */
export type ContactPersonRef = "primary" | 0 | 1 | 2 | 3 | 4

export function contactPersonRefToStorage(ref: ContactPersonRef | null | undefined): string | null {
  if (ref == null) return null
  return ref === "primary" ? "primary" : String(ref)
}

export function contactPersonRefFromStorage(raw: string | null | undefined): ContactPersonRef | null {
  if (raw == null || raw === "") return null
  if (raw === "primary") return "primary"
  const n = Number(raw)
  if (Number.isInteger(n) && n >= 0 && n <= 4) return n as ContactPersonRef
  return null
}
