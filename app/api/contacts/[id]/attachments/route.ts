import { NextResponse } from "next/server"
import { requireAdminMutation, requireSessionApi } from "@/lib/auth/api-guards"
import {
  addContactAttachment,
  deleteContactAttachment,
  getContact,
  listContactAttachments,
} from "@/lib/crm/contacts"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi()
  if (session instanceof NextResponse) return session

  const { id } = await params
  const contact = await getContact(id)
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const attachments = await listContactAttachments(id)
  return NextResponse.json({ attachments })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session

  const { id } = await params
  const contact = await getContact(id)
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = (await request.json()) as {
    title?: string
    driveUrl?: string
    driveFileId?: string
    kind?: string
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 })
  }

  const attachment = await addContactAttachment({
    contactId: id,
    title: body.title.trim(),
    driveUrl: body.driveUrl,
    driveFileId: body.driveFileId,
    kind: body.kind,
    uploadedBy: session.userId,
  })
  return NextResponse.json({ attachment })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session

  const { id } = await params
  const contact = await getContact(id)
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const attachmentId = searchParams.get("attachmentId")
  if (!attachmentId) {
    return NextResponse.json({ error: "attachmentId query param required" }, { status: 400 })
  }

  const attachments = await listContactAttachments(id)
  if (!attachments.some((a) => a.id === attachmentId)) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
  }

  await deleteContactAttachment(attachmentId)
  return NextResponse.json({ ok: true })
}
