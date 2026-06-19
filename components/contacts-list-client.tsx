"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

type Contact = {
  id: string
  companyName: string
  status: string
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
}

export function ContactsListClient() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [status, setStatus] = useState<"" | "active" | "inactive">("")
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Contacts</h1>
          <p className="mt-1 text-muted-foreground">Customer records synced from Xero and agreements.</p>
        </div>
      </div>

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
