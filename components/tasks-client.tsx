"use client"

import { useCallback, useEffect, useState } from "react"
import { csrfFetch } from "@/lib/api-client"

type Task = {
  id: string
  title: string
  status: string
  dueDate: string | null
  assigneeUserId: string | null
  createdAt: string
}

export function TasksClient({ isAdmin }: { isAdmin: boolean }) {
  const [scope, setScope] = useState<"mine" | "all">("mine")
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    const params = new URLSearchParams()
    if (isAdmin && scope === "all") params.set("scope", "all")
    try {
      const res = await fetch(`/api/tasks?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to load tasks")
      setTasks(data.tasks ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }, [isAdmin, scope])

  useEffect(() => {
    load()
  }, [load])

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await csrfFetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to create task")
      setTasks((prev) => [data.task, ...prev])
      setNewTitle("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create task")
    } finally {
      setCreating(false)
    }
  }

  async function toggleDone(task: Task) {
    const status = task.status === "done" ? "open" : "done"
    const res = await csrfFetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, status }),
    })
    const data = await res.json()
    if (res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Tasks</h1>
          <p className="mt-1 text-muted-foreground">Follow-ups and action items.</p>
        </div>
        {isAdmin && (
          <div className="flex rounded-md border border-border text-sm">
            <button
              type="button"
              onClick={() => setScope("mine")}
              className={`px-4 py-2 ${scope === "mine" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              My tasks
            </button>
            <button
              type="button"
              onClick={() => setScope("all")}
              className={`px-4 py-2 ${scope === "all" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              All tasks
            </button>
          </div>
        )}
      </div>

      <form onSubmit={createTask} className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="New task…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="min-w-[240px] flex-1 rounded-md border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          Add task
        </button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th className="px-4 py-2 text-left w-10"></th>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Due</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && tasks.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  No tasks.
                </td>
              </tr>
            )}
            {!loading &&
              tasks.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={t.status === "done"}
                      onChange={() => toggleDone(t)}
                      aria-label={`Mark ${t.title} done`}
                    />
                  </td>
                  <td className={`px-4 py-2 ${t.status === "done" ? "line-through text-muted-foreground" : "font-medium"}`}>
                    {t.title}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-2 capitalize">{t.status}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
