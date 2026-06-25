"use client"

import type { XeroContactPerson } from "@/lib/xero/types"
import { MAX_ADDITIONAL_CONTACT_PERSONS } from "@/lib/crm/contact-persons"

const emptyPerson = (): XeroContactPerson => ({
  firstName: "",
  lastName: "",
  emailAddress: "",
  includeInEmails: false,
})

const inputClass = "mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"

export function ContactPersonsEditor({
  persons,
  onChange,
  disabled,
}: {
  persons: XeroContactPerson[]
  onChange: (persons: XeroContactPerson[]) => void
  disabled?: boolean
}) {
  function updateAt(i: number, patch: Partial<XeroContactPerson>) {
    const next = persons.map((p, idx) => (idx === i ? { ...p, ...patch } : p))
    onChange(next)
  }

  function removeAt(i: number) {
    onChange(persons.filter((_, idx) => idx !== i))
  }

  function addPerson() {
    if (persons.length >= MAX_ADDITIONAL_CONTACT_PERSONS) return
    onChange([...persons, emptyPerson()])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-800">Additional people</h3>
        <span className="text-xs text-slate-500">Max {MAX_ADDITIONAL_CONTACT_PERSONS} (Xero limit)</span>
      </div>
      {persons.length === 0 && (
        <p className="text-sm text-slate-500">No additional people. Primary person is used for invoices/comms.</p>
      )}
      {persons.map((p, i) => (
        <div key={i} className="rounded border border-slate-200 p-3 space-y-2 bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              className={inputClass}
              placeholder="First name"
              value={p.firstName ?? ""}
              disabled={disabled}
              onChange={(e) => updateAt(i, { firstName: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="Last name"
              value={p.lastName ?? ""}
              disabled={disabled}
              onChange={(e) => updateAt(i, { lastName: e.target.value })}
            />
            <input
              className={`${inputClass} sm:col-span-2`}
              type="email"
              placeholder="Email"
              value={p.emailAddress ?? ""}
              disabled={disabled}
              onChange={(e) => updateAt(i, { emailAddress: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={p.includeInEmails ?? false}
              disabled={disabled}
              onChange={(e) => updateAt(i, { includeInEmails: e.target.checked })}
            />
            Include in emails (Xero invoices)
          </label>
          {!disabled && (
            <button type="button" className="text-sm text-red-700 hover:underline" onClick={() => removeAt(i)}>
              Remove
            </button>
          )}
        </div>
      ))}
      {!disabled && persons.length < MAX_ADDITIONAL_CONTACT_PERSONS && (
        <button type="button" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary" onClick={addPerson}>
          + Add person
        </button>
      )}
    </div>
  )
}

export function PersonRefSelect({
  contact,
  value,
  onChange,
  disabled,
  allowEmpty,
}: {
  contact: {
    contactName: string | null
    contactEmail: string | null
    contactPersons: XeroContactPerson[]
  }
  value: string
  onChange: (ref: string) => void
  disabled?: boolean
  allowEmpty?: boolean
}) {
  const options: { ref: string; label: string }[] = []
  if (allowEmpty) options.push({ ref: "", label: "— Not specified —" })
  if (contact.contactName || contact.contactEmail) {
    options.push({
      ref: "primary",
      label: `Primary: ${contact.contactName ?? contact.contactEmail ?? "Primary"}`,
    })
  }
  contact.contactPersons?.forEach((p, i) => {
    const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || p.emailAddress || `Person ${i + 1}`
    options.push({ ref: String(i), label: name })
  })

  if (options.length === 0) {
    return <span className="text-sm text-slate-500">No people on contact</span>
  }

  return (
    <select className={inputClass} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.ref} value={o.ref}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
