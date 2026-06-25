import { NextResponse } from "next/server"
import { requireAdminMutation, requireSessionApi, sanitizeOrdersForApi, sanitizeOrderForApi } from "@/lib/auth/api-guards"
import { listOrders, listOrdersByContactId, createOrder, buildOrderInput } from "@/lib/proposals/orders"
import { fetchXeroContact, xeroContactToCustomerSnapshot } from "@/lib/xero/client"
import type { OrderInput, OrderStatus } from "@/lib/proposals/types"
import type { CustomerSnapshot } from "@/lib/proposals/orders"
import type { ContactPersonRef } from "@/lib/xero/types"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await requireSessionApi()
  if (session instanceof NextResponse) return session

  const { searchParams } = new URL(request.url)
  const contactId = searchParams.get("contactId")
  const status = searchParams.get("status") as OrderStatus | null

  const orders = contactId
    ? await listOrdersByContactId(contactId, status ? { status } : undefined)
    : await listOrders()

  return NextResponse.json({ orders: sanitizeOrdersForApi(orders, session) })
}

export async function POST(request: Request) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session

  const body = (await request.json()) as {
    xeroContactId?: string
    customer?: CustomerSnapshot
    selectedPersonRef?: ContactPersonRef
    order: Omit<OrderInput, "actionDate"> & { actionDate?: string }
  }

  let customer = body.customer
  if (body.xeroContactId) {
    const contact = await fetchXeroContact(body.xeroContactId)
    if (!contact) {
      return NextResponse.json({ error: "Xero contact not found" }, { status: 400 })
    }
    customer = xeroContactToCustomerSnapshot(contact)
  }
  if (!customer?.companyName) {
    return NextResponse.json({ error: "Customer required (Xero contact or manual details)" }, { status: 400 })
  }

  if (body.selectedPersonRef !== undefined) {
    customer = { ...customer, selectedPersonRef: body.selectedPersonRef }
  } else if (!customer.selectedPersonRef) {
    customer = { ...customer, selectedPersonRef: "primary" }
  }

  const input = buildOrderInput(body.order)
  const { order, error } = await createOrder(customer, input)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ order: sanitizeOrderForApi(order, session) })
}
