"use client"

import { useEffect, useState } from "react"
import { csrfFetch } from "@/lib/api-client"

type ResourceLink = { label: string; url: string }

type User = {
  id: string
  email: string
  name: string | null
  role: "admin" | "standard"
  active: boolean
}

export function SettingsClient({
  isAdmin,
  xeroReady,
}: {
  isAdmin: boolean
  xeroReady: boolean
}) {
  const [resources, setResources] = useState<ResourceLink[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch("/api/settings/resources")
        const data = await res.json()
        if (res.ok) setResources(data.resources?.length ? data.resources : [{ label: "", url: "" }])
        if (isAdmin) {
          const usersRes = await fetch("/api/settings/users")
          const usersData = await usersRes.json()
          if (usersRes.ok) setUsers(usersData.users ?? [])
        }
      } catch {
        setError("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAdmin])

  function updateResource(index: number, field: "label" | "url", value: string) {
    setResources((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  function addResourceRow() {
    setResources((prev) => [...prev, { label: "", url: "" }])
  }

  function removeResourceRow(index: number) {
    setResources((prev) => prev.filter((_, i) => i !== index))
  }

  async function saveResources() {
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const res = await csrfFetch("/api/settings/resources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resources }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to save resources")
      setResources(data.resources?.length ? data.resources : [{ label: "", url: "" }])
      setMessage("Resources saved.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save resources")
    } finally {
      setSaving(false)
    }
  }

  async function syncXeroContacts() {
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const res = await csrfFetch("/api/xero/sync", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Sync failed")
      setMessage(`Synced ${data.synced ?? 0} contacts from Xero.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed")
    } finally {
      setSaving(false)
    }
  }

  async function changeRole(userId: string, role: "admin" | "standard") {
    setSaving(true)
    setError("")
    try {
      const res = await csrfFetch("/api/settings/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to update role")
      setUsers(data.users ?? [])
      setMessage("User role updated.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update role")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Settings</h1>
        <p className="mt-1 text-muted-foreground">Integrations, resources, and user access.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <section className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-sm font-medium text-primary">Xero</p>
        {!xeroReady ? (
          <p className="text-sm text-muted-foreground">Add Xero credentials to .env.local</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/xero/connect"
              className="inline-block rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Connect Xero
            </a>
            {isAdmin && (
              <button
                type="button"
                onClick={syncXeroContacts}
                disabled={saving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Sync contacts from Xero
              </button>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-sm font-medium text-primary">Gmail</p>
        <p className="text-xs text-muted-foreground">
          Connect to send agreement emails from your @seamvex.com address.
        </p>
        <a
          href="/api/gmail/connect"
          className="inline-block rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
        >
          Connect Gmail
        </a>
      </section>

      {isAdmin && (
        <>
          <section className="rounded-xl border border-border p-4 space-y-4">
            <p className="text-sm font-medium text-primary">Drive resource links</p>
            <p className="text-xs text-muted-foreground">
              Shown on the Resources page for quick access to shared folders.
            </p>
            {resources.map((r, i) => (
              <div key={i} className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Label"
                  value={r.label}
                  onChange={(e) => updateResource(i, "label", e.target.value)}
                  className="rounded-md border border-border px-3 py-2 text-sm"
                />
                <input
                  type="url"
                  placeholder="https://drive.google.com/…"
                  value={r.url}
                  onChange={(e) => updateResource(i, "url", e.target.value)}
                  className="min-w-[280px] flex-1 rounded-md border border-border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeResourceRow(i)}
                  className="text-sm text-red-700 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addResourceRow}
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary"
              >
                Add row
              </button>
              <button
                type="button"
                onClick={saveResources}
                disabled={saving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Save resources
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-border p-4">
            <p className="text-sm font-medium text-primary">User roles</p>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2">Email</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/50">
                    <td className="py-2">{u.email}</td>
                    <td className="py-2">{u.name ?? "—"}</td>
                    <td className="py-2">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value as "admin" | "standard")}
                        disabled={saving}
                        className="rounded-md border border-border px-2 py-1 text-sm"
                      >
                        <option value="standard">Standard</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {!isAdmin && (
        <p className="text-sm text-muted-foreground">
          Admin-only settings (resources editor, user roles) are hidden for standard users.
        </p>
      )}
    </div>
  )
}
