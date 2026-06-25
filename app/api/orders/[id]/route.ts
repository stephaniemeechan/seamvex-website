import { NextResponse } from "next/server"
import { requireSessionApi, requireAdminMutation, sanitizeOrderForApi } from "@/lib/auth/api-guards"
import { getOrder, updateOrder, buildOrderInput, type CustomerSnapshot } from "@/lib/proposals/orders"
import type { OrderInput } from "@/lib/proposals/types"
import { fetchXeroContact, xeroContactToCustomerSnapshot } from "@/lib/xero/client"

export const runtime = "nodejs"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi()
  if (session instanceof NextResponse) return session
  const { id } = await params
  const order = await getOrder(id)
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ order: sanitizeOrderForApi(order, session) })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session
  const { id } = await params
  const body = (await request.json()) as {
    xeroContactId?: string
    customer: CustomerSnapshot
    order: Omit<OrderInput, "actionDate"> & { actionDate?: string }
  }

  let customer = body.customer
  const xeroId = body.xeroContactId ?? body.customer.xeroContactId
  if (xeroId) {
    const contact = await fetchXeroContact(xeroId)
    if (contact) {
      const selectedPersonRef = body.customer.selectedPersonRef
      customer = xeroContactToCustomerSnapshot(contact)
      if (selectedPersonRef !== undefined) {
        customer = { ...customer, selectedPersonRef }
      }
    }
  }

  const input = buildOrderInput(body.order)
  const { order, error } = await updateOrder(id, customer, input)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ order: sanitizeOrderForApi(order, session) })
}
