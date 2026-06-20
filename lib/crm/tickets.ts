import { execute, query, queryOne, ensureDb, newId } from "@/lib/db"

export type TicketStatus = "open" | "pending" | "resolved" | "closed"
export type TaskStatus = "open" | "done" | "cancelled"

export type TicketRecord = {
  id: string
  contactId: string
  orderId: string | null
  subject: string
  status: TicketStatus
  priority: string
  assigneeUserId: string | null
  gmailThreadId: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type TaskRecord = {
  id: string
  ticketId: string | null
  contactId: string | null
  orderId: string | null
  title: string
  status: TaskStatus
  assigneeUserId: string | null
  dueDate: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type TicketActivity = {
  id: string
  ticketId: string
  kind: string
  body: string | null
  metadata: Record<string, unknown> | null
  createdBy: string | null
  createdAt: string
}

function rowToTicket(row: Record<string, unknown>): TicketRecord {
  return {
    id: row.id as string,
    contactId: row.contact_id as string,
    orderId: (row.order_id as string | null) ?? null,
    subject: row.subject as string,
    status: row.status as TicketStatus,
    priority: row.priority as string,
    assigneeUserId: (row.assignee_user_id as string | null) ?? null,
    gmailThreadId: (row.gmail_thread_id as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function rowToTask(row: Record<string, unknown>): TaskRecord {
  return {
    id: row.id as string,
    ticketId: (row.ticket_id as string | null) ?? null,
    contactId: (row.contact_id as string | null) ?? null,
    orderId: (row.order_id as string | null) ?? null,
    title: row.title as string,
    status: row.status as TaskStatus,
    assigneeUserId: (row.assignee_user_id as string | null) ?? null,
    dueDate: (row.due_date as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function listTickets(opts?: { contactId?: string }): Promise<TicketRecord[]> {
  await ensureDb()
  let sql = "SELECT * FROM tickets WHERE 1=1"
  const params: unknown[] = []
  if (opts?.contactId) {
    sql += " AND contact_id = ?"
    params.push(opts.contactId)
  }
  sql += " ORDER BY updated_at DESC"
  const rows = await query<Record<string, unknown>>(sql, params)
  return rows.map(rowToTicket)
}

export async function getTicket(id: string): Promise<TicketRecord | null> {
  await ensureDb()
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM tickets WHERE id = ?", [id])
  return row ? rowToTicket(row) : null
}

export async function getOpenTicketForContact(contactId: string): Promise<TicketRecord | null> {
  await ensureDb()
  const row = await queryOne<Record<string, unknown>>(
    `SELECT * FROM tickets
     WHERE contact_id = ? AND status IN ('open', 'pending')
     ORDER BY updated_at DESC LIMIT 1`,
    [contactId],
  )
  return row ? rowToTicket(row) : null
}

export async function createTicket(input: {
  contactId: string
  orderId?: string
  subject: string
  assigneeUserId?: string
  createdBy?: string
}): Promise<TicketRecord> {
  await ensureDb()
  const id = newId("tkt")
  const now = new Date().toISOString()
  await execute(
    `INSERT INTO tickets (id, contact_id, order_id, subject, status, priority, assignee_user_id, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'open', 'normal', ?, ?, ?, ?)`,
    [
      id,
      input.contactId,
      input.orderId ?? null,
      input.subject,
      input.assigneeUserId ?? null,
      input.createdBy ?? null,
      now,
      now,
    ],
  )
  return (await getTicket(id))!
}

export async function updateTicket(
  id: string,
  patch: Partial<Pick<TicketRecord, "status" | "assigneeUserId" | "gmailThreadId" | "subject">>,
): Promise<void> {
  await ensureDb()
  const fields: string[] = []
  const params: unknown[] = []
  if (patch.status !== undefined) {
    fields.push("status = ?")
    params.push(patch.status)
  }
  if (patch.assigneeUserId !== undefined) {
    fields.push("assignee_user_id = ?")
    params.push(patch.assigneeUserId)
  }
  if (patch.gmailThreadId !== undefined) {
    fields.push("gmail_thread_id = ?")
    params.push(patch.gmailThreadId)
  }
  if (patch.subject !== undefined) {
    fields.push("subject = ?")
    params.push(patch.subject)
  }
  if (!fields.length) return
  fields.push("updated_at = ?")
  params.push(new Date().toISOString(), id)
  await execute(`UPDATE tickets SET ${fields.join(", ")} WHERE id = ?`, params)
}

export async function listTasks(opts: {
  assigneeUserId?: string
  ticketId?: string
  contactId?: string
  scopeAll?: boolean
}): Promise<TaskRecord[]> {
  await ensureDb()
  let sql = "SELECT * FROM tasks WHERE 1=1"
  const params: unknown[] = []
  if (opts.ticketId) {
    sql += " AND ticket_id = ?"
    params.push(opts.ticketId)
  }
  if (opts.contactId) {
    sql += " AND contact_id = ?"
    params.push(opts.contactId)
  }
  if (!opts.scopeAll && opts.assigneeUserId) {
    sql += " AND assignee_user_id = ?"
    params.push(opts.assigneeUserId)
  }
  sql += " ORDER BY due_date IS NULL, due_date ASC, created_at DESC"
  const rows = await query<Record<string, unknown>>(sql, params)
  return rows.map(rowToTask)
}

export async function createTask(input: {
  title: string
  ticketId?: string
  contactId?: string
  orderId?: string
  assigneeUserId?: string
  dueDate?: string
  createdBy?: string
}): Promise<TaskRecord> {
  await ensureDb()
  const id = newId("tsk")
  const now = new Date().toISOString()
  await execute(
    `INSERT INTO tasks (id, ticket_id, contact_id, order_id, title, status, assignee_user_id, due_date, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?)`,
    [
      id,
      input.ticketId ?? null,
      input.contactId ?? null,
      input.orderId ?? null,
      input.title,
      input.assigneeUserId ?? null,
      input.dueDate ?? null,
      input.createdBy ?? null,
      now,
      now,
    ],
  )
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM tasks WHERE id = ?", [id])
  return rowToTask(row!)
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  await ensureDb()
  await execute("UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?", [
    status,
    new Date().toISOString(),
    id,
  ])
}

export async function updateTask(
  id: string,
  patch: Partial<Pick<TaskRecord, "status" | "assigneeUserId" | "dueDate" | "title">>,
): Promise<TaskRecord | null> {
  await ensureDb()
  const fields: string[] = []
  const params: unknown[] = []
  if (patch.status !== undefined) {
    fields.push("status = ?")
    params.push(patch.status)
  }
  if (patch.assigneeUserId !== undefined) {
    fields.push("assignee_user_id = ?")
    params.push(patch.assigneeUserId)
  }
  if (patch.dueDate !== undefined) {
    fields.push("due_date = ?")
    params.push(patch.dueDate)
  }
  if (patch.title !== undefined) {
    fields.push("title = ?")
    params.push(patch.title)
  }
  if (!fields.length) {
    const row = await queryOne<Record<string, unknown>>("SELECT * FROM tasks WHERE id = ?", [id])
    return row ? rowToTask(row) : null
  }
  fields.push("updated_at = ?")
  params.push(new Date().toISOString(), id)
  await execute(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`, params)
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM tasks WHERE id = ?", [id])
  return row ? rowToTask(row) : null
}

export async function getTask(id: string): Promise<TaskRecord | null> {
  await ensureDb()
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM tasks WHERE id = ?", [id])
  return row ? rowToTask(row) : null
}

export async function addTicketActivity(input: {
  ticketId: string
  kind: string
  body?: string
  metadata?: Record<string, unknown>
  createdBy?: string
}): Promise<TicketActivity> {
  await ensureDb()
  const id = newId("act")
  const now = new Date().toISOString()
  await execute(
    `INSERT INTO ticket_activities (id, ticket_id, kind, body, metadata_json, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.ticketId,
      input.kind,
      input.body ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      input.createdBy ?? null,
      now,
    ],
  )
  await execute("UPDATE tickets SET updated_at = ? WHERE id = ?", [now, input.ticketId])
  return {
    id,
    ticketId: input.ticketId,
    kind: input.kind,
    body: input.body ?? null,
    metadata: input.metadata ?? null,
    createdBy: input.createdBy ?? null,
    createdAt: now,
  }
}

export async function listTicketActivities(ticketId: string): Promise<TicketActivity[]> {
  await ensureDb()
  const rows = await query<Record<string, unknown>>(
    "SELECT * FROM ticket_activities WHERE ticket_id = ? ORDER BY created_at ASC",
    [ticketId],
  )
  return rows.map((r) => ({
    id: r.id as string,
    ticketId: r.ticket_id as string,
    kind: r.kind as string,
    body: (r.body as string | null) ?? null,
    metadata: r.metadata_json ? JSON.parse(r.metadata_json as string) : null,
    createdBy: (r.created_by as string | null) ?? null,
    createdAt: r.created_at as string,
  }))
}

export async function createAgreementSendTicket(input: {
  contactId: string
  orderId: string
  createdBy?: string
  assigneeUserId?: string
}): Promise<{ ticket: TicketRecord; tasks: TaskRecord[] }> {
  const ticket = await createTicket({
    contactId: input.contactId,
    orderId: input.orderId,
    subject: "Agreement sent for signature",
    createdBy: input.createdBy,
    assigneeUserId: input.assigneeUserId,
  })
  const tasks = await Promise.all([
    createTask({
      ticketId: ticket.id,
      contactId: input.contactId,
      orderId: input.orderId,
      title: "Follow up if not signed within 5 days",
      assigneeUserId: input.assigneeUserId,
      createdBy: input.createdBy,
    }),
    createTask({
      ticketId: ticket.id,
      contactId: input.contactId,
      orderId: input.orderId,
      title: "Review signed agreement and Xero invoice",
      assigneeUserId: input.assigneeUserId,
      createdBy: input.createdBy,
    }),
  ])
  await addTicketActivity({
    ticketId: ticket.id,
    kind: "system",
    body: "Ticket auto-created when agreement was sent.",
    createdBy: input.createdBy,
  })
  return { ticket, tasks }
}
