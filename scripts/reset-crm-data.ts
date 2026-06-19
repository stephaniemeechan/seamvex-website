#!/usr/bin/env tsx
/**
 * Wipe agreement/order data for greenfield CRM start.
 * Optionally import contacts from xero-customers-export.json
 *
 * Usage:
 *   pnpm reset-crm-data
 *   pnpm reset-crm-data --import-xero
 */
import fs from "fs"
import path from "path"
import { closeDb, ensureDb, execute, newId } from "@/lib/db"
import { upsertContactFromSnapshot } from "@/lib/crm/contacts"
import type { CustomerSnapshot } from "@/lib/proposals/orders"

async function main() {
  await ensureDb()
  const importXero = process.argv.includes("--import-xero")

  console.log("Wiping orders, contracts, tickets, tasks, ticket activities, email_log...")
  await execute("DELETE FROM ticket_activities")
  await execute("DELETE FROM tasks")
  await execute("DELETE FROM tickets")
  await execute("DELETE FROM email_log")
  await execute("DELETE FROM orders")
  await execute("DELETE FROM contracts")
  await execute("DELETE FROM contact_attachments")
  await execute("DELETE FROM contacts")

  if (importXero) {
    const exportPath = path.join(process.cwd(), "xero-customers-export.json")
    if (!fs.existsSync(exportPath)) {
      console.error("xero-customers-export.json not found. Run pnpm export-xero-customers first.")
      process.exit(1)
    }
    const data = JSON.parse(fs.readFileSync(exportPath, "utf8")) as {
      customers?: Array<{
        contactId: string
        name: string
        email?: string
        phone?: string
        accountNumber?: string
        address?: {
          line1?: string
          line2?: string
          line3?: string
          postcode?: string
          country?: string
        }
      }>
    }
    const customers = data.customers ?? []
    console.log(`Importing ${customers.length} contacts from Xero export...`)
    for (const c of customers) {
      const snapshot: CustomerSnapshot = {
        xeroContactId: c.contactId,
        companyName: c.name,
        customerNumber: c.accountNumber,
        contactEmail: c.email,
        contactPhone: c.phone,
        billingAddress1: c.address?.line1,
        billingAddress2: c.address?.line2,
        billingAddress3: c.address?.line3,
        postcode: c.address?.postcode,
        country: c.address?.country,
      }
      await upsertContactFromSnapshot(snapshot)
    }
    console.log("Import complete.")
  }

  await closeDb()
  console.log("CRM data reset complete.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
