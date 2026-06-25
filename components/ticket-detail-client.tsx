"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { csrfFetch } from "@/lib/api-client"
import { PersonRefSelect } from "@/components/contact-persons-editor"
import { resolvePerson } from "@/lib/crm/contact-persons"
import type { XeroContactPerson } from "@/lib/xero/types"

type Ticket = {
  id: string
  contactId: string
  subject: string
  status: string
  priority: string
  contactPersonRef: string | null
  assigneeUserId: string | null
}

type Activity = {
  id: string
  kind: string
  body: string | null
  createdAt: string
}

type Contact = {
  id: string
  companyName: string
  contactPhone: string | null
  contactName: string | null
  contactEmail: string | null
  contactPersons: XeroContactPerson[]
}

type User = { id: string; name: string | null; email: string }

const STATUSES = ["open", "pending", "resolved", "closed"] as const

export function TicketDetailClient({ id, isAdmin }: { id: string; isAdmin: boolean }) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [contact, setContact] = useState<Contact | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [personRef, setPersonRef] = useState("primary")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [calling, setCalling] = useState(false)

  async function load() {
    setLoading(true)
    setError("")
    try {
      const ticketRes = await fetch(`/api/tickets/${id}`)
      const ticketData = await ticketRes.json()
      if (!ticketRes.ok) throw new Error(ticketData.error ?? "Ticket not found")
      setTicket(ticketData.ticket)
      setPersonRef(ticketData.ticket.contactPersonRef ?? "")

      const fetches: Promise<Response>[] = [
        fetch(`/api/tickets/${id}/activities`),
        fetch(`/api/contacts/${ticketData.ticket.contactId}`),
      ]
      if (isAdmin) fetches.push(fetch("/api/settings/users"))
      const [activitiesRes, contactRes, usersRes] = await Promise.all(fetches)
      const activitiesData = await activitiesRes.json()
      const contactData = await contactRes.json()
      setActivities(activitiesData.activities ?? [])
      if (contactRes.ok) setContact(contactData.contact)
      if (usersRes?.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users ?? [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ticket")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id, isAdmin])

  async function updateStatus(status: string) {
    setSaving(true)
    try {
      const res = await csrfFetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to update")
      setTicket(data.ticket)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status")
    } finally {
      setSaving(false)
    }
  }

  async function savePersonRef(ref: string) {
    setPersonRef(ref)
    setSaving(true)
    setError("")
    try {
      const res = await csrfFetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactPersonRef: ref === "" ? null : ref }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to update person")
      setTicket(data.ticket)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update person")
    } finally {
      setSaving(false)
    }
  }

  async function saveAssignee(assigneeUserId: string) {
    if (!isAdmin) return
    setSaving(true)
    setError("")
    try {
      const res = await csrfFetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeUserId: assigneeUserId || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to update assignee")
      setTicket(data.ticket)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update assignee")
    } finally {
      setSaving(false)
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    setSaving(true)
    try {
      const res = await csrfFetch(`/api/tickets/${id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "note", body: note.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to add note")
      setActivities((prev) => [...prev, data.activity])
      setNote("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add note")
    } finally {
      setSaving(false)
    }
  }

  async function clickToCall() {
    const phone = contact?.contactPhone
    if (!phone) return
    setCalling(true)
    setError("")
    try {
      const res = await csrfFetch("/api/twilio/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phone, ticketId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to initiate call")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to initiate call")
    } finally {
      setCalling(false)
    }
  }

  const linkedPerson =
    contact && ticket
      ? resolvePerson(contact, ticket.contactPersonRef ?? "primary")
      : null

  if (loading) return <p className="text-muted-foreground">Loading…</p>
  if (error && !ticket) return <p className="text-destructive">{error}</p>
  if (!ticket) return <p className="text-muted-foreground">Ticket not found.</p>

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/tickets" className="text-sm text-accent hover:underline">
          ← Tickets
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-primary">{ticket.subject}</h1>
        {contact && (
          <p className="text-sm text-muted-foreground">
            <Link href={`/admin/contacts/${contact.id}`} className="text-accent hover:underline">
              {contact.companyName}
            </Link>
            {" · "}
            <span className="capitalize">{ticket.status}</span>
            {linkedPerson?.name && (
              <>
                {" · "}
                <span>{linkedPerson.name}</span>
              </>
            )}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={saving || ticket.status === s}
            onClick={() => updateStatus(s)}
            className={`rounded-md border px-3 py-1.5 text-sm capitalize ${
              ticket.status === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-secondary"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {contact && (
        <div className="rounded-xl border border-border p-4 space-y-2">
          <p className="text-sm font-medium text-primary">Linked person</p>
          <PersonRefSelect
            contact={contact}
            value={personRef}
            onChange={savePersonRef}
            disabled={saving}
            allowEmpty
          />
        </div>
      )}

      {isAdmin && (
        <div className="rounded-xl border border-border p-4 space-y-2">
          <p className="text-sm font-medium text-primary">Assignee</p>
          <select
            value={ticket.assigneeUserId ?? ""}
            disabled={saving}
            onChange={(e) => saveAssignee(e.target.value)}
            className="w-full max-w-md rounded-md border border-border px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-xl border border-border p-4 space-y-4">
        <p className="text-sm font-medium text-primary">Activity feed</p>
        <ul className="space-y-3 text-sm">
          {activities.length === 0 && (
            <li className="text-muted-foreground">No activity yet.</li>
          )}
          {activities.map((a) => (
            <li key={a.id} className="border-b border-border/50 pb-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-secondary px-2 py-0.5 capitalize">{a.kind.replace("_", " ")}</span>
                <span>{new Date(a.createdAt).toLocaleString()}</span>
              </div>
              {a.body && <p className="mt-1 whitespace-pre-wrap text-foreground">{a.body}</p>}
            </li>
          ))}
        </ul>

        <form onSubmit={addNote} className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-medium text-primary">Add note</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            placeholder="Internal note…"
          />
          <button
            type="submit"
            disabled={saving || !note.trim()}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
          >
            Add note
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-sm font-medium text-primary">Phone</p>
        {!contact?.contactPhone ? (
          <p className="text-xs text-muted-foreground">Add a phone number on the contact record first.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">{contact.contactPhone}</p>
            <button
              type="button"
              onClick={clickToCall}
              disabled={calling}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
            >
              {calling ? "Calling…" : "Click to call"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
