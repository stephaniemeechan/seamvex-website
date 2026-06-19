import { NextResponse } from "next/server"
import { requireSessionApi, requireSessionMutation } from "@/lib/auth/api-guards"
import {
  createTask,
  getTask,
  listTasks,
  updateTask,
  type TaskStatus,
} from "@/lib/crm/tickets"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await requireSessionApi()
  if (session instanceof NextResponse) return session

  const { searchParams } = new URL(request.url)
  const scope = searchParams.get("scope")
  const ticketId = searchParams.get("ticketId") ?? undefined
  const contactId = searchParams.get("contactId") ?? undefined
  const scopeAll = session.role === "admin" && scope === "all"

  const tasks = await listTasks({
    assigneeUserId: scopeAll ? undefined : session.userId,
    ticketId,
    contactId,
    scopeAll,
  })
  return NextResponse.json({ tasks })
}

export async function POST(request: Request) {
  const session = await requireSessionMutation(request)
  if (session instanceof NextResponse) return session

  const body = (await request.json()) as {
    title?: string
    ticketId?: string
    contactId?: string
    orderId?: string
    assigneeUserId?: string
    dueDate?: string
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 })
  }

  const assigneeUserId =
    session.role === "admin" && body.assigneeUserId ? body.assigneeUserId : session.userId

  const task = await createTask({
    title: body.title.trim(),
    ticketId: body.ticketId,
    contactId: body.contactId,
    orderId: body.orderId,
    assigneeUserId,
    dueDate: body.dueDate,
    createdBy: session.userId,
  })
  return NextResponse.json({ task })
}

export async function PATCH(request: Request) {
  const session = await requireSessionMutation(request)
  if (session instanceof NextResponse) return session

  const body = (await request.json()) as {
    id?: string
    status?: TaskStatus
    title?: string
    dueDate?: string | null
    assigneeUserId?: string | null
  }

  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const existing = await getTask(body.id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (session.role !== "admin" && existing.assigneeUserId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const validStatuses: TaskStatus[] = ["open", "done", "cancelled"]
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const patch: Parameters<typeof updateTask>[1] = {}
  if (body.status !== undefined) patch.status = body.status
  if (body.title !== undefined) patch.title = body.title
  if (body.dueDate !== undefined) patch.dueDate = body.dueDate
  if (body.assigneeUserId !== undefined && session.role === "admin") {
    patch.assigneeUserId = body.assigneeUserId
  }

  const task = await updateTask(body.id, patch)
  return NextResponse.json({ task })
}
