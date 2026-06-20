import { execute, query, queryOne, ensureDb, newId } from "@/lib/db"
import type { UserRole } from "@/lib/crm/contacts"
import { isValidE164, normalizePhoneE164 } from "@/lib/phone/normalize"

export type UserRecord = {
  id: string
  googleSub: string | null
  email: string
  name: string | null
  phone: string | null
  availableForCalls: boolean
  role: UserRole
  active: boolean
  createdAt: string
  updatedAt: string
}

function rowToUser(row: Record<string, unknown>): UserRecord {
  return {
    id: row.id as string,
    googleSub: (row.google_sub as string | null) ?? null,
    email: row.email as string,
    name: (row.name as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    availableForCalls: Boolean(row.available_for_calls),
    role: row.role as UserRole,
    active: Boolean(row.active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function normalizeUserPhone(phone: string | null | undefined): string | null {
  if (phone == null || !phone.trim()) return null
  const e164 = normalizePhoneE164(phone.trim())
  if (!e164 || !isValidE164(e164)) {
    throw new Error("Invalid phone — use E.164 format, e.g. +447...")
  }
  return e164
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  await ensureDb()
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM users WHERE email = ?", [
    email.toLowerCase(),
  ])
  return row ? rowToUser(row) : null
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  await ensureDb()
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM users WHERE id = ?", [id])
  return row ? rowToUser(row) : null
}

export async function getUserByGoogleSub(sub: string): Promise<UserRecord | null> {
  await ensureDb()
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM users WHERE google_sub = ?", [
    sub,
  ])
  return row ? rowToUser(row) : null
}

export async function listUsers(): Promise<UserRecord[]> {
  await ensureDb()
  const rows = await query<Record<string, unknown>>("SELECT * FROM users ORDER BY email ASC")
  return rows.map(rowToUser)
}

export async function upsertGoogleUser(input: {
  googleSub: string
  email: string
  name?: string
}): Promise<UserRecord> {
  await ensureDb()
  const email = input.email.toLowerCase()
  const adminEmail = (process.env.ADMIN_EMAIL ?? "s.meechan@seamvex.com").toLowerCase()
  const existing = await getUserByGoogleSub(input.googleSub)
  const now = new Date().toISOString()

  if (existing) {
    await execute("UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?", [
      input.name ?? existing.name,
      email,
      now,
      existing.id,
    ])
    return (await getUserById(existing.id))!
  }

  const byEmail = await getUserByEmail(email)
  if (byEmail) {
    await execute(
      "UPDATE users SET google_sub = ?, name = ?, updated_at = ? WHERE id = ?",
      [input.googleSub, input.name ?? byEmail.name, now, byEmail.id],
    )
    return (await getUserById(byEmail.id))!
  }

  const id = newId("usr")
  const role: UserRole = email === adminEmail ? "admin" : "standard"
  await execute(
    `INSERT INTO users (id, google_sub, email, name, phone, available_for_calls, role, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, NULL, 0, ?, 1, ?, ?)`,
    [id, input.googleSub, email, input.name ?? null, role, now, now],
  )
  return (await getUserById(id))!
}

export async function updateUserProfile(
  userId: string,
  patch: { phone?: string | null; availableForCalls?: boolean },
): Promise<UserRecord | null> {
  await ensureDb()
  const fields: string[] = []
  const params: unknown[] = []

  if (patch.phone !== undefined) {
    fields.push("phone = ?")
    params.push(patch.phone === null || patch.phone === "" ? null : normalizeUserPhone(patch.phone))
  }
  if (patch.availableForCalls !== undefined) {
    fields.push("available_for_calls = ?")
    params.push(patch.availableForCalls ? 1 : 0)
  }
  if (!fields.length) return getUserById(userId)

  fields.push("updated_at = ?")
  params.push(new Date().toISOString(), userId)
  await execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, params)
  return getUserById(userId)
}

export async function updateUserPhoneByAdmin(
  userId: string,
  patch: { phone?: string | null; availableForCalls?: boolean },
): Promise<UserRecord | null> {
  return updateUserProfile(userId, patch)
}

export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  await ensureDb()
  await execute("UPDATE users SET role = ?, updated_at = ? WHERE id = ?", [
    role,
    new Date().toISOString(),
    userId,
  ])
}

export async function setUserActive(userId: string, active: boolean): Promise<void> {
  await ensureDb()
  await execute("UPDATE users SET active = ?, updated_at = ? WHERE id = ?", [
    active ? 1 : 0,
    new Date().toISOString(),
    userId,
  ])
}

export function userToPublicJson(u: UserRecord) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    availableForCalls: u.availableForCalls,
    role: u.role,
    active: u.active,
  }
}
