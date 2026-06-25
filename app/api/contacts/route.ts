import { NextResponse } from "next/server"
import { requireAdminMutation, requireSessionApi } from "@/lib/auth/api-guards"
import { createContact, listContacts, updateContactPersons } from "@/lib/crm/contacts"
import type { CustomerSnapshot } from "@/lib/proposals/orders"
import { validateContactPersons } from "@/lib/crm/contact-persons"
import { createXeroContact, xeroConfig } from "@/lib/xero/client"
import type { XeroContactPerson } from "@/lib/xero/types"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await requireSessionApi()
  if (session instanceof NextResponse) return session

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") as "active" | "inactive" | null
  const q = searchParams.get("q") ?? undefined

  const contacts = await listContacts({
    status: status === "active" || status === "inactive" ? status : undefined,
    q,
  })
  return NextResponse.json({ contacts })
}

export async function POST(request: Request) {
  const session = await requireAdminMutation(request)
  if (session instanceof NextResponse) return session

  const body = (await request.json()) as {
    companyName?: string
    xeroContactId?: string
    supportInfo?: string
    customerNumber?: string
    billingAddress1?: string
    billingAddress2?: string
    billingAddress3?: string
    postcode?: string
    country?: string
    contactName?: string
    contactPhone?: string
    contactEmail?: string
    accountsContact?: string
    accountsEmail?: string
    contactPersons?: XeroContactPerson[]
  }

  if (!body.companyName?.trim()) {
    return NextResponse.json({ error: "companyName is required" }, { status: 400 })
  }

  const personsErr = validateContactPersons(body.contactPersons, body.contactEmail)
  if (personsErr) return NextResponse.json({ error: personsErr }, { status: 400 })

  let xeroContactId = body.xeroContactId?.trim() || undefined
  if (!xeroContactId && xeroConfig()) {
    const snapshot: CustomerSnapshot = {
      companyName: body.companyName.trim(),
      customerNumber: body.customerNumber,
      billingAddress1: body.billingAddress1,
      billingAddress2: body.billingAddress2,
      billingAddress3: body.billingAddress3,
      postcode: body.postcode,
      country: body.country,
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
      accountsContact: body.accountsContact,
      accountsEmail: body.accountsEmail,
      contactPersons: body.contactPersons,
    }
    try {
      const xc = await createXeroContact(snapshot)
      xeroContactId = xc.ContactID
    } catch (e) {
      const message = e instanceof Error ? e.message : "Xero create contact failed"
      return NextResponse.json({ error: message }, { status: 502 })
    }
  }

  const contact = await createContact({
    companyName: body.companyName.trim(),
    xeroContactId,
    supportInfo: body.supportInfo,
    customerNumber: body.customerNumber,
    billingAddress1: body.billingAddress1,
    billingAddress2: body.billingAddress2,
    billingAddress3: body.billingAddress3,
    postcode: body.postcode,
    country: body.country,
    contactName: body.contactName,
    contactPhone: body.contactPhone,
    contactEmail: body.contactEmail,
    accountsContact: body.accountsContact,
    accountsEmail: body.accountsEmail,
    contactPersons: body.contactPersons,
  })
  return NextResponse.json({ contact })
}
