import { NextResponse } from "next/server"
import { requireSessionMutation } from "@/lib/auth/api-guards"
import { logSentEmail, sendEmail } from "@/lib/gmail/client"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const session = await requireSessionMutation(request)
  if (session instanceof NextResponse) return session

  const body = (await request.json()) as {
    to?: string
    subject?: string
    body?: string
    threadId?: string
    orderId?: string
    ticketId?: string
  }

  if (!body.to?.trim() || !body.subject?.trim() || !body.body?.trim()) {
    return NextResponse.json({ error: "to, subject, and body are required" }, { status: 400 })
  }

  try {
    const result = await sendEmail(session.userId, {
      to: body.to.trim(),
      subject: body.subject.trim(),
      body: body.body,
      threadId: body.threadId,
    })
    await logSentEmail({
      sentByUserId: session.userId,
      toEmail: body.to.trim(),
      subject: body.subject.trim(),
      gmailMessageId: result.messageId,
      threadId: result.threadId,
      orderId: body.orderId,
      ticketId: body.ticketId,
    })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Send failed" },
      { status: 500 },
    )
  }
}
