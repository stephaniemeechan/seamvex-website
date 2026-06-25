import { NextResponse } from "next/server"
import { requireSessionApi, requireSessionMutation } from "@/lib/auth/api-guards"
import {
  contactToSnapshot,
  getContact,
  updateContact,
  updateContactPersons,
} from "@/lib/crm/contacts"
import { validateContactPersons } from "@/lib/crm/contact-persons"
import { createXeroContact, updateXeroContact, xeroConfig } from "@/lib/xero/client"
import { execute } from "@/lib/db"
import type { XeroContactPerson } from "@/lib/xero/types"

export const runtime = "nodejs"

const ADMIN_PATCH_FIELDS = [
  "companyName",
  "customerNumber",
  "billingAddress1",
  "billingAddress2",
  "billingAddress3",
  "postcode",
  "country",
  "contactName",
  "contactPhone",
  "contactEmail",
  "accountsContact",
  "accountsEmail",
] as const

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionApi()
  if (session instanceof NextResponse) return session

  const { id } = await params
  const contact = await getContact(id)
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ contact })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionMutation(request)
  if (session instanceof NextResponse) return session

  const { id } = await params
  const existing = await getContact(id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = (await request.json()) as Record<string, unknown>
  const isAdmin = session.role === "admin"
  const patch: Record<string, string | null> = {}

  if (body.supportInfo !== undefined || body.support_info !== undefined) {
    patch.supportInfo = String(body.supportInfo ?? body.support_info ?? "")
  }

  if (isAdmin) {
    for (const key of ADMIN_PATCH_FIELDS) {
      if (body[key] !== undefined) {
        patch[key] = body[key] == null ? null : String(body[key])
      }
    }
  } else {
    for (const key of ADMIN_PATCH_FIELDS) {
      if (body[key] !== undefined) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }
    if (body.contactPersons !== undefined) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  let contact = await updateContact(id, patch)
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (isAdmin && body.contactPersons !== undefined) {
    const persons = body.contactPersons as XeroContactPerson[]
    const personsErr = validateContactPersons(persons, contact.contactEmail)
    if (personsErr) return NextResponse.json({ error: personsErr }, { status: 400 })
    contact = (await updateContactPersons(id, persons))!
  }

  if (isAdmin && xeroConfig()) {
    try {
      if (existing.xeroContactId) {
        await updateXeroContact(existing.xeroContactId, contactToSnapshot(contact))
      } else {
        const xc = await createXeroContact(contactToSnapshot(contact))
        const now = new Date().toISOString()
        await execute(
          "UPDATE contacts SET xero_contact_id = ?, xero_synced_at = ?, updated_at = ? WHERE id = ?",
          [xc.ContactID, now, now, id],
        )
        contact = (await getContact(id))!
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Xero contact sync failed"
      return NextResponse.json({ error: message }, { status: 502 })
    }
  }

  return NextResponse.json({ contact })
}
