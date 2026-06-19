import { NextResponse } from "next/server"
import { requireSessionApi, requireAdminMutation, sanitizeOrdersForApi, sanitizeOrderForApi } from "@/lib/auth/api-guards"
import { listOrders, createOrder, buildOrderInput } from "@/lib/proposals/orders"
import { fetchXeroContact, xeroContactToCustomerSnapshot } from "@/lib/xero/client"
import type { OrderInput } from "@/lib/proposals/types"
import type { CustomerSnapshot } from "@/lib/proposals/orders"

export const runtime = "nodejs"

export async function GET() {
  const session = await requireSessionApi()
  if (session instanceof NextResponse) return session
  return NextResponse.json({ orders: sanitizeOrdersForApi(await listOrders(), session) })
}

export async function POST(request: Request) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session

  const body = (await request.json()) as {
    xeroContactId?: string
    customer?: CustomerSnapshot
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

  const input = buildOrderInput(body.order)
  const { order, error } = await createOrder(customer, input)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ order: sanitizeOrderForApi(order, session) })
}
