import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { isAdminEmail } from "@/lib/auth/admin-emails"
import { passwordLoginAllowed } from "@/lib/env"
import { getUserById, setUserRole } from "@/lib/crm/users"

const COOKIE = "seamcor_admin_session"
const MAX_AGE = 60 * 60 * 24 * 7

export type SessionRole = "admin" | "standard"

export type Session = {
  userId: string
  email: string
  role: SessionRole
  name: string
}

export type SessionUser = {
  id: string
  email: string
  role: SessionRole
  name: string
}

function requireSessionSecret(): Uint8Array {
  const s = process.env.SESSION_SECRET
  if (process.env.NODE_ENV === "production") {
    if (!s) throw new Error("SESSION_SECRET is required in production")
    return new TextEncoder().encode(s)
  }
  const fallback = s ?? process.env.ADMIN_PASSWORD ?? "dev-secret-change-me"
  return new TextEncoder().encode(fallback)
}

function parseSessionPayload(payload: Record<string, unknown>): Session | null {
  if (
    typeof payload.userId !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string" ||
    (payload.role !== "admin" && payload.role !== "standard")
  ) {
    return null
  }
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  }
}

export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(requireSessionSecret())
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, requireSessionSecret())
    return parseSessionPayload(payload as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  })
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.delete(COOKIE)
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (!token) return null
  const session = await verifySession(token)
  if (!session) return null

  const user = await getUserById(session.userId)
  if (!user?.active) return null

  let role = user.role
  if (isAdminEmail(user.email) && role !== "admin") {
    await setUserRole(user.id, "admin")
    role = "admin"
  }

  return {
    userId: user.id,
    email: user.email,
    role,
    name: user.name ?? session.name,
  }
}

/** Dev-only password login when Google OAuth is not configured. */
export function checkAdminCredentials(email: string, password: string): boolean {
  if (!passwordLoginAllowed()) return false
  if (process.env.GOOGLE_CLIENT_ID) return false
  const allowedPassword = process.env.ADMIN_PASSWORD
  if (!allowedPassword) return false
  return isAdminEmail(email) && password === allowedPassword
}

export { COOKIE as SESSION_COOKIE_NAME }
