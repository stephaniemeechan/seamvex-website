import { NextResponse } from "next/server"
import { requireAdminApi, requireAdminMutation } from "@/lib/auth/api-guards"
import {
  listUsers,
  setUserRole,
  updateUserPhoneByAdmin,
  userToPublicJson,
} from "@/lib/crm/users"
import type { UserRole } from "@/lib/crm/contacts"

export const runtime = "nodejs"

export async function GET() {
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session

  const users = await listUsers()
  return NextResponse.json({ users: users.map(userToPublicJson) })
}

export async function PATCH(request: Request) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session

  const body = (await request.json()) as {
    userId?: string
    role?: UserRole
    phone?: string | null
    availableForCalls?: boolean
  }
  if (!body.userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  try {
    if (body.role !== undefined) {
      if (body.role !== "admin" && body.role !== "standard") {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      }
      await setUserRole(body.userId, body.role)
    }

    if (body.phone !== undefined || body.availableForCalls !== undefined) {
      await updateUserPhoneByAdmin(body.userId, {
        phone: body.phone,
        availableForCalls: body.availableForCalls,
      })
    }

    const users = await listUsers()
    return NextResponse.json({ users: users.map(userToPublicJson) })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    )
  }
}
