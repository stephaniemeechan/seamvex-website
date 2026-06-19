import { NextResponse } from "next/server"
import { requireSessionMutation } from "@/lib/auth/api-guards"
import { initiateCall } from "@/lib/twilio/client"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const session = await requireSessionMutation(request)
  if (session instanceof NextResponse) return session

  const body = (await request.json()) as { to?: string; ticketId?: string }
  if (!body.to?.trim()) {
    return NextResponse.json({ error: "to is required" }, { status: 400 })
  }

  try {
    const result = await initiateCall(body.to.trim(), {
      ticketId: body.ticketId,
      createdBy: session.userId,
    })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Call failed" },
      { status: 500 },
    )
  }
}
