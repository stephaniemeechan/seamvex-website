import { NextResponse } from "next/server"
import { requireAdminApi, requireAdminMutation } from "@/lib/auth/api-guards"
import { listUsers, setUserRole, type UserRecord } from "@/lib/crm/users"
import type { UserRole } from "@/lib/crm/contacts"

export const runtime = "nodejs"

export async function GET() {
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session

  const users: UserRecord[] = await listUsers()
  return NextResponse.json({ users })
}

export async function PATCH(request: Request) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session

  const body = (await request.json()) as { userId?: string; role?: UserRole }
  if (!body.userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }
  if (body.role !== "admin" && body.role !== "standard") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  await setUserRole(body.userId, body.role)
  const users = await listUsers()
  return NextResponse.json({ users })
}
