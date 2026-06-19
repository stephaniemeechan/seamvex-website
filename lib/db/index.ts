import { queryOne, execute } from "@/lib/db/client"
import { runMigrations } from "@/lib/db/migrate"
import { assertProductionEnv } from "@/lib/env"

let migrated = false

export async function ensureDb(): Promise<void> {
  assertProductionEnv()
  if (migrated) return
  await runMigrations()
  migrated = true
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`
}

export async function nextDocumentNumber(): Promise<string> {
  await ensureDb()
  const row = await queryOne<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'so_sequence'",
  )
  const num = parseInt(row?.value ?? "1000121", 10)
  await execute("UPDATE settings SET value = ? WHERE key = 'so_sequence'", [String(num + 1)])
  return `SO-${num}`
}

export async function getSetting(key: string): Promise<string | null> {
  await ensureDb()
  const row = await queryOne<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key])
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await ensureDb()
  await execute(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value],
  )
}

/** @deprecated sync getDb — use async query helpers */
export { query, queryOne, execute, usePostgres, closeDb } from "@/lib/db/client"
