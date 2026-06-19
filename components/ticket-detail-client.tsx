"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { csrfFetch } from "@/lib/api-client"

type Ticket = {
  id: string
  contactId: string
  subject: string
  status: string
  priority: string
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
}

const STATUSES = ["open", "pending", "resolved", "closed"] as const

export function TicketDetailClient({ id }: { id: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [contact, setContact] = useState<Contact | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [note, setNote] = useState("")
  const [smsBody, setSmsBody] = useState("")
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

      const [activitiesRes, contactRes] = await Promise.all([
        fetch(`/api/tickets/${id}/activities`),
        fetch(`/api/contacts/${ticketData.ticket.contactId}`),
      ])
      const activitiesData = await activitiesRes.json()
      const contactData = await contactRes.json()
      setActivities(activitiesData.activities ?? [])
      if (contactRes.ok) setContact(contactData.contact)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ticket")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

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

  async function sendSms(e: React.FormEvent) {
    e.preventDefault()
    if (!smsBody.trim() || !contact?.contactPhone) return
    setSaving(true)
    setError("")
    try {
      const res = await csrfFetch("/api/twilio/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: contact.contactPhone,
          message: smsBody.trim(),
          ticketId: id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to send SMS")
      await load()
      setSmsBody("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send SMS")
    } finally {
      setSaving(false)
    }
  }

  async function clickToCall() {
    if (!contact?.contactPhone) return
    setCalling(true)
    setError("")
    try {
      const res = await csrfFetch("/api/twilio/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: contact.contactPhone, ticketId: id }),
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

      <div className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-sm font-medium text-primary">Send SMS</p>
        {!contact?.contactPhone ? (
          <p className="text-xs text-muted-foreground">Add a phone number on the contact record first.</p>
        ) : (
          <p className="text-xs text-muted-foreground">To: {contact.contactPhone}</p>
        )}
        <form onSubmit={sendSms} className="space-y-2">
          <textarea
            value={smsBody}
            onChange={(e) => setSmsBody(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="SMS message to customer…"
          />
          <button
            type="submit"
            disabled={saving || !smsBody.trim() || !contact?.contactPhone}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
          >
            Send SMS
          </button>
        </form>
      </div>
    </div>
  )
}
