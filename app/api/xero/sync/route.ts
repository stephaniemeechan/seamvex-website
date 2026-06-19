import { NextResponse } from "next/server"
import { requireAdminMutation } from "@/lib/auth/api-guards"
import { syncContactsFromXero } from "@/lib/xero/client"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session

  try {
    const result = await syncContactsFromXero()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 },
    )
  }
}
