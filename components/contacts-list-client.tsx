"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { csrfFetch } from "@/lib/api-client"
import { ContactPersonsEditor } from "@/components/contact-persons-editor"
import type { XeroContactPerson } from "@/lib/xero/types"

type Contact = {
  id: string
  companyName: string
  status: string
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
}

const EMPTY_FORM = {
  companyName: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  customerNumber: "",
  billingAddress1: "",
  billingAddress2: "",
  billingAddress3: "",
  postcode: "",
  country: "United Kingdom",
  accountsContact: "",
  accountsEmail: "",
}

export function ContactsListClient({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [status, setStatus] = useState<"" | "active" | "inactive">("")
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [contactPersons, setContactPersons] = useState<XeroContactPerson[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    const params = new URLSearchParams()
    if (status) params.set("status", status)
    if (q.trim()) params.set("q", q.trim())
    try {
      const res = await fetch(`/api/contacts?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to load contacts")
      setContacts(data.contacts ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contacts")
    } finally {
      setLoading(false)
    }
  }, [status, q])

  useEffect(() => {
    load()
  }, [load])

  async function createContact(e: React.FormEvent) {
    e.preventDefault()
    if (!form.companyName.trim()) return
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const body: Record<string, string> = { companyName: form.companyName.trim() }
      for (const [key, value] of Object.entries(form)) {
        if (key !== "companyName" && value.trim()) body[key] = value.trim()
      }
      const res = await csrfFetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, contactPersons }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to create contact")
      setShowNew(false)
      setForm(EMPTY_FORM)
      setContactPersons([])
      setMessage("Contact created and pushed to Xero.")
      router.push(`/admin/contacts/${data.contact.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create contact")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Contacts</h1>
          <p className="mt-1 text-muted-foreground">
            Customer records synced from Xero. Admin create/edit pushes to Xero when connected.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            {showNew ? "Cancel" : "New contact"}
          </button>
        )}
      </div>

      {showNew && isAdmin && (
        <form onSubmit={createContact} className="rounded-xl border border-border p-4 space-y-4">
          <p className="text-sm font-medium text-primary">New contact (creates in Xero when connected)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              <span className="text-muted-foreground">Company name *</span>
              <input
                required
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            {(
              [
                ["contactName", "Contact name"],
                ["contactEmail", "Contact email"],
                ["contactPhone", "Phone"],
                ["customerNumber", "Customer number"],
                ["accountsContact", "Accounts contact"],
                ["accountsEmail", "Accounts email"],
                ["billingAddress1", "Address line 1"],
                ["billingAddress2", "Address line 2"],
                ["billingAddress3", "Address line 3"],
                ["postcode", "Postcode"],
                ["country", "Country"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-sm">
                <span className="text-muted-foreground">
                  {key === "contactName" ? "Primary person name" : key === "contactEmail" ? "Primary person email" : label}
                </span>
                <input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </label>
            ))}
          </div>
          <ContactPersonsEditor persons={contactPersons} onChange={setContactPersons} />
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create contact"}
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "" | "active" | "inactive")}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input
          type="search"
          placeholder="Search company, name, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[220px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={load}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
        >
          Search
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Company</th>
              <th className="px-4 py-2 text-left">Contact</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && contacts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No contacts found.
                </td>
              </tr>
            )}
            {!loading &&
              contacts.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{c.companyName}</td>
                  <td className="px-4 py-2">{c.contactName ?? "—"}</td>
                  <td className="px-4 py-2">{c.contactEmail ?? "—"}</td>
                  <td className="px-4 py-2 capitalize">{c.status}</td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/contacts/${c.id}`} className="text-accent hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
