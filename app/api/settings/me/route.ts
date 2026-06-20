import { NextResponse } from "next/server"
import { requireSessionApi, requireSessionMutation } from "@/lib/auth/api-guards"
import { getUserById, updateUserProfile, userToPublicJson } from "@/lib/crm/users"

export const runtime = "nodejs"

export async function GET() {
  const session = await requireSessionApi()
  if (session instanceof NextResponse) return session

  const user = await getUserById(session.userId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  return NextResponse.json({ user: userToPublicJson(user) })
}

export async function PATCH(request: Request) {
  const session = await requireSessionMutation(request)
  if (session instanceof NextResponse) return session

  const body = (await request.json()) as {
    phone?: string | null
    availableForCalls?: boolean
  }

  try {
    const user = await updateUserProfile(session.userId, {
      phone: body.phone,
      availableForCalls: body.availableForCalls,
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json({ user: userToPublicJson(user) })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    )
  }
}
