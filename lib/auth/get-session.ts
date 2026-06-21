import { getUserById, setUserRole } from "@/lib/crm/users"
import { isAdminEmail } from "@/lib/auth/admin-emails"
import { getSession as getJwtSession, type Session } from "@/lib/auth/session"

/** Node-only session lookup — refreshes role from DB so ADMIN_EMAIL changes apply. */
export async function getSession(): Promise<Session | null> {
  const session = await getJwtSession()
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

export type { Session } from "@/lib/auth/session"
