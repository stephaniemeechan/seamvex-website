import { createHash, randomBytes } from "crypto"
import { cookies } from "next/headers"

const CSRF_COOKIE = "seamvex_csrf"

export async function createCsrfToken(): Promise<string> {
  const token = randomBytes(32).toString("hex")
  const jar = await cookies()
  jar.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  })
  return token
}

export async function verifyCsrf(request: Request): Promise<boolean> {
  const header = request.headers.get("x-csrf-token")
  const jar = await cookies()
  const cookie = jar.get(CSRF_COOKIE)?.value
  if (!header || !cookie || header !== cookie) return false
  return true
}

const rateBuckets = new Map<string, { count: number; reset: number }>()

/** Simple in-memory rate limit — per key, max N requests per windowMs */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = rateBuckets.get(key)
  if (!bucket || now > bucket.reset) {
    rateBuckets.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  if (bucket.count >= max) return false
  bucket.count++
  return true
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  )
}

export function hashForLog(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12)
}
