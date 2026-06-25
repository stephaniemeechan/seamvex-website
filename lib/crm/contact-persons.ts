import type { ContactRecord } from "@/lib/crm/contacts"
import type { CustomerSnapshot } from "@/lib/proposals/orders"
import type { ContactPersonRef, XeroContactPerson } from "@/lib/xero/types"
import { contactPersonRefFromStorage, contactPersonRefToStorage } from "@/lib/xero/types"

export const MAX_ADDITIONAL_CONTACT_PERSONS = 5

export function parseContactPersonsJson(raw: string | null | undefined): XeroContactPerson[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, MAX_ADDITIONAL_CONTACT_PERSONS).map(normalizePerson)
  } catch {
    return []
  }
}

export function serializeContactPersons(persons: XeroContactPerson[] | undefined): string | null {
  if (!persons?.length) return null
  return JSON.stringify(persons.slice(0, MAX_ADDITIONAL_CONTACT_PERSONS).map(normalizePerson))
}

function normalizePerson(p: XeroContactPerson): XeroContactPerson {
  return {
    firstName: p.firstName?.trim() || undefined,
    lastName: p.lastName?.trim() || undefined,
    emailAddress: p.emailAddress?.trim() || undefined,
    includeInEmails: p.includeInEmails ?? false,
  }
}

export function personDisplayName(p: XeroContactPerson): string {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || p.emailAddress || "Person"
}

export type ResolvedPerson = {
  ref: ContactPersonRef | null
  name: string
  email?: string
  phone?: string
  includeInEmails?: boolean
}

export function listPersonOptions(
  contact: Pick<ContactRecord, "contactName" | "contactEmail" | "contactPhone" | "contactPersons">,
): { ref: ContactPersonRef; label: string; email?: string }[] {
  const out: { ref: ContactPersonRef; label: string; email?: string }[] = []
  if (contact.contactName || contact.contactEmail) {
    out.push({
      ref: "primary",
      label: contact.contactName
        ? `${contact.contactName}${contact.contactEmail ? ` (${contact.contactEmail})` : ""}`
        : (contact.contactEmail ?? "Primary"),
      email: contact.contactEmail ?? undefined,
    })
  }
  contact.contactPersons?.forEach((p, i) => {
    out.push({
      ref: i as ContactPersonRef,
      label: `${personDisplayName(p)}${p.emailAddress ? "" : ""}${p.emailAddress ? ` (${p.emailAddress})` : ""}`,
      email: p.emailAddress,
    })
  })
  return out
}

export function resolvePerson(
  contact: Pick<
    ContactRecord,
    "contactName" | "contactEmail" | "contactPhone" | "contactPersons"
  >,
  ref: ContactPersonRef | string | null | undefined,
): ResolvedPerson {
  const parsed =
    typeof ref === "string" ? contactPersonRefFromStorage(ref) : (ref ?? null)

  if (parsed === "primary" || parsed == null) {
    return {
      ref: parsed,
      name: contact.contactName ?? contact.contactEmail ?? "",
      email: contact.contactEmail ?? undefined,
      phone: contact.contactPhone ?? undefined,
      includeInEmails: true,
    }
  }

  const p = contact.contactPersons?.[parsed]
  if (!p) {
    return {
      ref: parsed,
      name: contact.contactName ?? "",
      email: contact.contactEmail ?? undefined,
      phone: contact.contactPhone ?? undefined,
    }
  }

  return {
    ref: parsed,
    name: personDisplayName(p),
    email: p.emailAddress,
    phone: contact.contactPhone ?? undefined,
    includeInEmails: p.includeInEmails,
  }
}

export function resolvePersonFromSnapshot(
  snapshot: CustomerSnapshot,
  ref?: ContactPersonRef | string | null,
): ResolvedPerson {
  const parsed =
    ref == null
      ? snapshot.selectedPersonRef ?? "primary"
      : typeof ref === "string" && ref !== "primary"
        ? contactPersonRefFromStorage(ref) ?? snapshot.selectedPersonRef ?? "primary"
        : ref

  if (parsed === "primary" || parsed == null) {
    return {
      ref: "primary",
      name: snapshot.contactName ?? snapshot.accountsContact ?? snapshot.companyName,
      email: snapshot.contactEmail ?? snapshot.accountsEmail,
      phone: snapshot.contactPhone,
      includeInEmails: true,
    }
  }

  const p = snapshot.contactPersons?.[parsed]
  if (!p) {
    return resolvePersonFromSnapshot(snapshot, "primary")
  }

  return {
    ref: parsed,
    name: personDisplayName(p),
    email: p.emailAddress,
    phone: snapshot.contactPhone,
    includeInEmails: p.includeInEmails,
  }
}

export function validateContactPersons(
  persons: XeroContactPerson[] | undefined,
  primaryEmail: string | null | undefined,
): string | null {
  const list = persons ?? []
  if (list.length > MAX_ADDITIONAL_CONTACT_PERSONS) {
    return `Maximum ${MAX_ADDITIONAL_CONTACT_PERSONS} additional people (Xero limit)`
  }
  if (list.length > 0 && !primaryEmail?.trim()) {
    return "Primary person email is required before adding additional people"
  }
  for (let i = 0; i < list.length; i++) {
    const p = list[i]!
    if (!p.emailAddress?.trim() && !p.firstName?.trim() && !p.lastName?.trim()) {
      return `Additional person ${i + 1} needs a name or email`
    }
  }
  return null
}

export function validateContactPersonRef(
  ref: string | null | undefined,
  contact: Pick<ContactRecord, "contactName" | "contactEmail" | "contactPersons">,
): string | null {
  if (ref == null || ref === "") return null
  const parsed = contactPersonRefFromStorage(ref)
  if (!parsed) return "Invalid contact person reference"
  if (parsed === "primary") {
    if (!contact.contactName && !contact.contactEmail) return "Primary person not set on contact"
    return null
  }
  if (!contact.contactPersons?.[parsed]) return "Contact person not found on company"
  return null
}

export { contactPersonRefFromStorage, contactPersonRefToStorage }
