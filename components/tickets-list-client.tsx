"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { csrfFetch } from "@/lib/api-client"
import { PersonRefSelect } from "@/components/contact-persons-editor"
import type { XeroContactPerson } from "@/lib/xero/types"

type Ticket = {
  id: string
  contactId: string
  subject: string
  status: string
  priority: string
  updatedAt: string
  contactPersonRef: string | null
}

type Contact = {
  id: string
  companyName: string
  contactName: string | null
  contactEmail: string | null
  contactPersons: XeroContactPerson[]
}

export function TicketsListClient() {
  const searchParams = useSearchParams()
  const contactId = searchParams.get("contactId") ?? ""
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [newSubject, setNewSubject] = useState("")
  const [newContactId, setNewContactId] = useState(contactId)
  const [newPersonRef, setNewPersonRef] = useState("primary")
  const [creating, setCreating] = useState(false)

  const selectedContact = contacts.find((c) => c.id === newContactId)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = contactId ? `?contactId=${contactId}` : ""
      const [ticketsRes, contactsRes] = await Promise.all([
        fetch(`/api/tickets${params}`),
        fetch("/api/contacts"),
      ])
      const ticketsData = await ticketsRes.json()
      const contactsData = await contactsRes.json()
      if (!ticketsRes.ok) throw new Error(ticketsData.error ?? "Failed to load tickets")
      setTickets(ticketsData.tickets ?? [])
      setContacts(contactsData.contacts ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }, [contactId])

  useEffect(() => {
    setNewContactId(contactId)
    load()
  }, [contactId, load])

  useEffect(() => {
    setNewPersonRef("primary")
  }, [newContactId])

  async function createTicket(e: React.FormEvent) {
    e.preventDefault()
    if (!newSubject.trim() || !newContactId) return
    setCreating(true)
    try {
      const res = await csrfFetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newSubject.trim(),
          contactId: newContactId,
          contactPersonRef: newPersonRef === "" ? null : newPersonRef,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to create ticket")
      window.location.href = `/admin/tickets/${data.ticket.id}`
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create ticket")
      setCreating(false)
    }
  }

  const contactName = (id: string) => contacts.find((c) => c.id === id)?.companyName ?? id

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Tickets</h1>
          <p className="mt-1 text-muted-foreground">
            {contactId ? "Filtered by contact." : "Support tickets linked to customers."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNew(!showNew)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
        >
          New ticket
        </button>
      </div>

      {showNew && (
        <form onSubmit={createTicket} className="rounded-xl border border-border p-4 space-y-3">
          <p className="text-sm font-medium text-primary">Create ticket</p>
          <select
            value={newContactId}
            onChange={(e) => setNewContactId(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            required
          >
            <option value="">Select contact…</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
          {selectedContact && (
            <div>
              <label className="text-sm font-medium">Linked person</label>
              <PersonRefSelect
                contact={selectedContact}
                value={newPersonRef}
                onChange={setNewPersonRef}
                allowEmpty
              />
            </div>
          )}
          <input
            type="text"
            placeholder="Subject"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Create
          </button>
        </form>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Subject</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Updated</th>
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
            {!loading && tickets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No tickets yet.
                </td>
              </tr>
            )}
            {!loading &&
              tickets.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{t.subject}</td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/contacts/${t.contactId}`} className="text-accent hover:underline">
                      {contactName(t.contactId)}
                    </Link>
                  </td>
                  <td className="px-4 py-2 capitalize">{t.status}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(t.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/tickets/${t.id}`} className="text-accent hover:underline">
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
