"use client"

import { useEffect, useState } from "react"
import { csrfFetch } from "@/lib/api-client"
import { xeroNotConfiguredMessage } from "@/lib/integration-status"

type ResourceLink = { label: string; url: string }

type User = {
  id: string
  email: string
  name: string | null
  phone: string | null
  availableForCalls: boolean
  role: "admin" | "standard"
  active: boolean
}

type VoiceConfig = {
  timezone: string
  hoursStart: string
  hoursEnd: string
  daysOfWeek: number[]
  forceClosed: boolean
  inHoursGreeting: string
  afterHoursGreeting: string
  afterHoursPhone: string
  ringMode: "crm_users" | "explicit_list"
  explicitRingPhones: string[]
  noAnswerAction: "forward_mobile" | "hangup"
  noAnswerTimeoutSec: number
}

const DAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const

export function SettingsClient({
  isAdmin,
  xeroReady,
  companyPhone,
  gmailConnected,
  gmailStatus,
  xeroStatus,
}: {
  isAdmin: boolean
  xeroReady: boolean
  companyPhone: string | null
  gmailConnected: boolean
  gmailStatus?: string
  xeroStatus?: string
}) {
  const [resources, setResources] = useState<ResourceLink[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [myPhone, setMyPhone] = useState("")
  const [myAvailable, setMyAvailable] = useState(false)
  const [voice, setVoice] = useState<VoiceConfig | null>(null)
  const [explicitPhonesText, setExplicitPhonesText] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const meRes = await fetch("/api/settings/me")
        const meData = await meRes.json()
        if (meRes.ok && meData.user) {
          setMyPhone(meData.user.phone ?? "")
          setMyAvailable(Boolean(meData.user.availableForCalls))
        }

        const res = await fetch("/api/settings/resources")
        const data = await res.json()
        if (res.ok) setResources(data.resources?.length ? data.resources : [{ label: "", url: "" }])

        if (isAdmin) {
          const [usersRes, voiceRes] = await Promise.all([
            fetch("/api/settings/users"),
            fetch("/api/settings/voice"),
          ])
          const usersData = await usersRes.json()
          if (usersRes.ok) setUsers(usersData.users ?? [])

          const voiceData = await voiceRes.json()
          if (voiceRes.ok && voiceData.config) {
            setVoice(voiceData.config)
            setExplicitPhonesText((voiceData.config.explicitRingPhones ?? []).join("\n"))
          }
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

  async function saveMyPhone() {
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const res = await csrfFetch("/api/settings/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: myPhone.trim() || null,
          availableForCalls: myAvailable,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to save phone")
      setMyPhone(data.user.phone ?? "")
      setMyAvailable(Boolean(data.user.availableForCalls))
      setMessage("Your phone settings saved.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save phone")
    } finally {
      setSaving(false)
    }
  }

  async function saveVoiceConfig() {
    if (!voice) return
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const explicitRingPhones = explicitPhonesText
        .split(/[\n,]/)
        .map((p) => p.trim())
        .filter(Boolean)
      if (explicitRingPhones.length > 10) {
        setError("Only the first 10 ring phones are used (Twilio limit).")
      }
      const res = await csrfFetch("/api/settings/voice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: { ...voice, explicitRingPhones },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to save voice settings")
      setVoice(data.config)
      setExplicitPhonesText((data.config.explicitRingPhones ?? []).join("\n"))
      setMessage("Voice settings saved.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save voice settings")
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

  async function updateUserPhone(
    userId: string,
    patch: { phone?: string | null; availableForCalls?: boolean },
  ) {
    setSaving(true)
    setError("")
    try {
      const res = await csrfFetch("/api/settings/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...patch }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to update user")
      setUsers(data.users ?? [])
      setMessage("User phone updated.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Settings</h1>
        <p className="mt-1 text-muted-foreground">Integrations, phone, resources, and user access.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <section className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-sm font-medium text-primary">My phone (CRM calls)</p>
        <p className="text-xs text-muted-foreground">
          Used for click-to-call outbound and inbound ring group when enabled.
          {companyPhone && (
            <>
              {" "}
              Company line: <span className="font-mono text-foreground">{companyPhone}</span>
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="tel"
            placeholder="+447..."
            value={myPhone}
            onChange={(e) => setMyPhone(e.target.value)}
            className="rounded-md border border-border px-3 py-2 text-sm font-mono"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={myAvailable}
              onChange={(e) => setMyAvailable(e.target.checked)}
            />
            Receive inbound calls
          </label>
          <button
            type="button"
            onClick={saveMyPhone}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Save my phone
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-sm font-medium text-primary">Xero</p>
        {xeroStatus === "connected" && (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
            Xero connected successfully.
          </p>
        )}
        {xeroStatus === "error" && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            Xero connection failed. Check credentials and redirect URI.
          </p>
        )}
        {!xeroReady ? (
          <p className="text-sm text-muted-foreground">{xeroNotConfiguredMessage()}</p>
        ) : isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/xero/connect"
              className="inline-block rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Connect Xero
            </a>
            <button
              type="button"
              onClick={syncXeroContacts}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Sync contacts from Xero
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Xero connection is managed by admins.</p>
        )}
      </section>

      <section className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-sm font-medium text-primary">Gmail</p>
        <p className="text-xs text-muted-foreground">
          Connect to send agreement emails from your @seamvex.com address.
        </p>
        {gmailStatus === "connected" && (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
            Gmail connected successfully.
          </p>
        )}
        {gmailStatus === "error" && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            Gmail connection failed. Check Google OAuth redirect URIs and try again.
          </p>
        )}
        {gmailConnected ? (
          <p className="text-sm text-green-800">Connected — agreement sends use your mailbox.</p>
        ) : (
          <p className="text-sm text-amber-800">Not connected — Send for signature will not email the customer.</p>
        )}
        <a
          href="/api/gmail/connect"
          className="inline-block rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
        >
          {gmailConnected ? "Reconnect Gmail" : "Connect Gmail"}
        </a>
      </section>

      {isAdmin && voice && (
        <section className="rounded-xl border border-border p-4 space-y-4">
          <p className="text-sm font-medium text-primary">Voice routing</p>
          <p className="text-xs text-muted-foreground">
            Inbound to {companyPhone ?? "TWILIO_PHONE_NUMBER"} — business hours, ring group, after-hours mobile.
          </p>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={voice.forceClosed}
              onChange={(e) => setVoice({ ...voice, forceClosed: e.target.checked })}
            />
            Closed today (force after-hours routing)
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">
              <span className="text-muted-foreground">Hours start</span>
              <input
                type="time"
                value={voice.hoursStart}
                onChange={(e) => setVoice({ ...voice, hoursStart: e.target.value })}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Hours end</span>
              <input
                type="time"
                value={voice.hoursEnd}
                onChange={(e) => setVoice({ ...voice, hoursEnd: e.target.value })}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Timezone</span>
              <input
                type="text"
                value={voice.timezone}
                onChange={(e) => setVoice({ ...voice, timezone: e.target.value })}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Open days</span>
            <div className="mt-2 flex flex-wrap gap-3">
              {DAY_OPTIONS.map((d) => (
                <label key={d.value} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={voice.daysOfWeek.includes(d.value)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...new Set([...voice.daysOfWeek, d.value])].sort()
                        : voice.daysOfWeek.filter((x) => x !== d.value)
                      setVoice({ ...voice, daysOfWeek: next })
                    }}
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>

          <label className="text-sm block max-w-xs">
            <span className="text-muted-foreground">Ring timeout (seconds, 10–60)</span>
            <input
              type="number"
              min={10}
              max={60}
              value={voice.noAnswerTimeoutSec}
              onChange={(e) =>
                setVoice({ ...voice, noAnswerTimeoutSec: parseInt(e.target.value, 10) || 30 })
              }
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm block">
            <span className="text-muted-foreground">After-hours / on-call mobile</span>
            <input
              type="tel"
              placeholder="+447..."
              value={voice.afterHoursPhone}
              onChange={(e) => setVoice({ ...voice, afterHoursPhone: e.target.value })}
              className="mt-1 block w-full max-w-xs rounded-md border border-border px-3 py-2 text-sm font-mono"
            />
          </label>

          <label className="text-sm block">
            <span className="text-muted-foreground">In-hours greeting (optional)</span>
            <input
              type="text"
              value={voice.inHoursGreeting}
              onChange={(e) => setVoice({ ...voice, inHoursGreeting: e.target.value })}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm block">
            <span className="text-muted-foreground">After-hours greeting</span>
            <input
              type="text"
              value={voice.afterHoursGreeting}
              onChange={(e) => setVoice({ ...voice, afterHoursGreeting: e.target.value })}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </label>

          <div className="flex flex-wrap gap-4 text-sm">
            <label>
              Ring mode{" "}
              <select
                value={voice.ringMode}
                onChange={(e) =>
                  setVoice({
                    ...voice,
                    ringMode: e.target.value as VoiceConfig["ringMode"],
                  })
                }
                className="ml-2 rounded-md border border-border px-2 py-1"
              >
                <option value="crm_users">CRM users (available for calls)</option>
                <option value="explicit_list">Explicit phone list</option>
              </select>
            </label>
            <label>
              No answer{" "}
              <select
                value={voice.noAnswerAction}
                onChange={(e) =>
                  setVoice({
                    ...voice,
                    noAnswerAction: e.target.value as VoiceConfig["noAnswerAction"],
                  })
                }
                className="ml-2 rounded-md border border-border px-2 py-1"
              >
                <option value="forward_mobile">Forward to after-hours mobile</option>
                <option value="hangup">Hang up</option>
              </select>
            </label>
          </div>

          {voice.ringMode === "explicit_list" && (
            <label className="text-sm block">
              <span className="text-muted-foreground">Ring phones (one per line, max 10)</span>
              <textarea
                value={explicitPhonesText}
                onChange={(e) => setExplicitPhonesText(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm font-mono"
              />
            </label>
          )}

          <button
            type="button"
            onClick={saveVoiceConfig}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Save voice settings
          </button>
        </section>
      )}

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

          <section className="rounded-xl border border-border p-4 overflow-x-auto">
            <p className="text-sm font-medium text-primary">Users</p>
            <table className="mt-3 w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-2">Email</th>
                  <th className="py-2 pr-2">Phone</th>
                  <th className="py-2 pr-2">Inbound</th>
                  <th className="py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/50">
                    <td className="py-2 pr-2">{u.email}</td>
                    <td className="py-2 pr-2">
                      <input
                        type="tel"
                        defaultValue={u.phone ?? ""}
                        placeholder="+447..."
                        className="w-full max-w-[140px] rounded-md border border-border px-2 py-1 text-xs font-mono"
                        onBlur={(e) => {
                          const v = e.target.value.trim()
                          if (v !== (u.phone ?? "")) {
                            updateUserPhone(u.id, { phone: v || null })
                          }
                        }}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        defaultChecked={u.availableForCalls}
                        onChange={(e) =>
                          updateUserPhone(u.id, { availableForCalls: e.target.checked })
                        }
                      />
                    </td>
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
          Admin-only settings (voice routing, resources, user management) are hidden for standard users.
        </p>
      )}
    </div>
  )
}
