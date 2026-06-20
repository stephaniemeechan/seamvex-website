"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { csrfFetch } from "@/lib/api-client"

type Contact = {
  id: string
  companyName: string
  status: string
  supportInfo: string | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  customerNumber: string | null
  billingAddress1: string | null
  postcode: string | null
  country: string | null
}

type Attachment = {
  id: string
  title: string
  driveUrl: string | null
  createdAt: string
}

type Ticket = {
  id: string
  subject: string
  status: string
  updatedAt: string
}

export function ContactDetailClient({
  id,
  companyPhone,
  isAdmin,
}: {
  id: string
  companyPhone: string | null
  isAdmin: boolean
}) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [supportInfo, setSupportInfo] = useState("")
  const [attachTitle, setAttachTitle] = useState("")
  const [attachUrl, setAttachUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [calling, setCalling] = useState(false)

  async function load() {
    setLoading(true)
    setError("")
    try {
      const [contactRes, attachRes, ticketsRes] = await Promise.all([
        fetch(`/api/contacts/${id}`),
        fetch(`/api/contacts/${id}/attachments`),
        fetch(`/api/tickets?contactId=${id}`),
      ])
      const contactData = await contactRes.json()
      const attachData = await attachRes.json()
      const ticketsData = await ticketsRes.json()
      if (!contactRes.ok) throw new Error(contactData.error ?? "Contact not found")
      setContact(contactData.contact)
      setSupportInfo(contactData.contact.supportInfo ?? "")
      setAttachments(attachData.attachments ?? [])
      setTickets(ticketsData.tickets ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contact")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function saveSupportInfo() {
    setSaving(true)
    setMessage("")
    try {
      const res = await csrfFetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supportInfo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to save")
      setContact(data.contact)
      setMessage("Support info saved.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function addAttachment(e: React.FormEvent) {
    e.preventDefault()
    if (!attachTitle.trim() || !attachUrl.trim()) return
    setSaving(true)
    setMessage("")
    try {
      const res = await csrfFetch(`/api/contacts/${id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: attachTitle.trim(), driveUrl: attachUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to add attachment")
      setAttachments((prev) => [data.attachment, ...prev])
      setAttachTitle("")
      setAttachUrl("")
      setMessage("Attachment added.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add attachment")
    } finally {
      setSaving(false)
    }
  }

  async function removeAttachment(attachmentId: string) {
    if (!confirm("Remove this attachment?")) return
    const res = await csrfFetch(`/api/contacts/${id}/attachments?attachmentId=${attachmentId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
    }
  }

  async function clickToCall() {
    if (!contact?.contactPhone) return
    setCalling(true)
    setError("")
    setMessage("")
    try {
      const res = await csrfFetch("/api/twilio/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: contact.contactPhone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to initiate call")
      setMessage("Call initiated.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to initiate call")
    } finally {
      setCalling(false)
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>
  if (error && !contact) return <p className="text-destructive">{error}</p>
  if (!contact) return <p className="text-muted-foreground">Contact not found.</p>

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/contacts" className="text-sm text-accent hover:underline">
          ← Contacts
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-primary">{contact.companyName}</h1>
        <p className="text-sm text-muted-foreground capitalize">
          {contact.status} · {contact.customerNumber ?? "No customer number"}
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm font-medium text-primary">Contact details</p>
          <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
            <div>
              <dt className="inline font-medium text-foreground">Name: </dt>
              <dd className="inline">{contact.contactName ?? "—"}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">Email: </dt>
              <dd className="inline">{contact.contactEmail ?? "—"}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">Phone: </dt>
              <dd className="inline">{contact.contactPhone ?? "—"}</dd>
              {contact.contactPhone && (
                <button
                  type="button"
                  onClick={clickToCall}
                  disabled={calling}
                  className="ml-3 rounded-md border border-border px-2 py-0.5 text-xs font-medium hover:bg-secondary disabled:opacity-50"
                >
                  {calling ? "Calling…" : "Click to call"}
                </button>
              )}
            </div>
            <div>
              <dt className="inline font-medium text-foreground">Address: </dt>
              <dd className="inline">
                {[contact.billingAddress1, contact.postcode, contact.country].filter(Boolean).join(", ") ||
                  "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border p-4">
          <p className="text-sm font-medium text-primary">Company line</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {companyPhone ? (
              <>
                Outbound calls show{" "}
                <span className="font-mono text-foreground">{companyPhone}</span> as caller ID.
              </>
            ) : (
              "Set TWILIO_PHONE_NUMBER in environment to enable calling."
            )}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-sm font-medium text-primary">Support info</p>
        <textarea
          value={supportInfo}
          onChange={(e) => setSupportInfo(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="Internal support notes, access details, escalation paths…"
        />
        <button
          type="button"
          onClick={saveSupportInfo}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Save support info
        </button>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-4">
        <p className="text-sm font-medium text-primary">Drive attachments</p>
        <ul className="space-y-2 text-sm">
          {attachments.length === 0 && (
            <li className="text-muted-foreground">No attachments yet.</li>
          )}
          {attachments.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
              <div>
                {a.driveUrl ? (
                  <a href={a.driveUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                    {a.title}
                  </a>
                ) : (
                  <span>{a.title}</span>
                )}
                <span className="ml-2 text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => removeAttachment(a.id)}
                  className="text-xs text-red-700 hover:underline"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        {isAdmin && (
          <form onSubmit={addAttachment} className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Title"
              value={attachTitle}
              onChange={(e) => setAttachTitle(e.target.value)}
              className="rounded-md border border-border px-3 py-2 text-sm"
            />
            <input
              type="url"
              placeholder="Google Drive URL"
              value={attachUrl}
              onChange={(e) => setAttachUrl(e.target.value)}
              className="min-w-[240px] flex-1 rounded-md border border-border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Add link
            </button>
          </form>
        )}
      </div>

      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-primary">Linked tickets</p>
          <Link
            href={`/admin/tickets?contactId=${id}`}
            className="text-sm text-accent hover:underline"
          >
            View all
          </Link>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {tickets.length === 0 && (
            <li className="text-muted-foreground">No tickets for this contact.</li>
          )}
          {tickets.slice(0, 5).map((t) => (
            <li key={t.id} className="flex items-center justify-between border-b border-border/50 pb-2">
              <Link href={`/admin/tickets/${t.id}`} className="text-accent hover:underline">
                {t.subject}
              </Link>
              <span className="capitalize text-muted-foreground">{t.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
