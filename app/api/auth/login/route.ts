import { NextResponse } from "next/server"
import { checkAdminCredentials, createSession, setSessionCookie } from "@/lib/auth/session"
import { getUserByEmail } from "@/lib/crm/users"
import { passwordLoginAllowed } from "@/lib/env"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!passwordLoginAllowed()) {
    return NextResponse.json({ error: "Password login is disabled" }, { status: 403 })
  }
  const { email, password } = (await request.json()) as { email?: string; password?: string }
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 })
  }
  if (!checkAdminCredentials(email, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const normalizedEmail = email.toLowerCase()
  const user = await getUserByEmail(normalizedEmail)
  const token = await createSession({
    id: user?.id ?? `dev-${normalizedEmail}`,
    email: normalizedEmail,
    role: user?.role ?? "admin",
    name: user?.name ?? normalizedEmail.split("@")[0] ?? "Admin",
  })
  await setSessionCookie(token)
  return NextResponse.json({ ok: true })
}
