#!/usr/bin/env tsx
/**
 * Wipe agreement/order data for greenfield CRM start.
 * Optionally import contacts from xero-customers-export.json
 *
 * Usage:
 *   pnpm reset-crm-data
 *   pnpm reset-crm-data --import-xero
 *   pnpm reset-crm-data --import-xero --include-csv=xero-import-selected.csv
 *   pnpm reset-crm-data --import-xero --include-csv=xero-import-selected.csv --strip-xero-ids
 */
import fs from "fs"
import path from "path"
import { closeDb, ensureDb, execute } from "@/lib/db"
import { upsertContactFromSnapshot } from "@/lib/crm/contacts"
import type { CustomerSnapshot } from "@/lib/proposals/orders"
import type { XeroCustomersExport } from "@/lib/xero/export-customers"

function argValue(prefix: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`${prefix}=`))
  return hit?.slice(prefix.length + 1)
}

function loadIncludeCompanyNames(csvPath: string): Set<string> {
  const raw = fs.readFileSync(csvPath, "utf8")
  const lines = raw.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return new Set()

  const header = parseCsvLine(lines[0]!)
  const nameIdx = header.findIndex((h) => h.toLowerCase() === "companyname")
  if (nameIdx === -1) {
    console.error(`CSV must have a companyName column: ${csvPath}`)
    process.exit(1)
  }

  const names = new Set<string>()
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line)
    const name = cols[nameIdx]?.trim()
    if (name) names.add(name.toLowerCase())
  }
  return names
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      out.push(cur)
      cur = ""
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

async function main() {
  await ensureDb()
  const importXero = process.argv.includes("--import-xero")
  const stripXeroIds = process.argv.includes("--strip-xero-ids")
  const includeCsv = argValue("--include-csv")

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
    const data = JSON.parse(fs.readFileSync(exportPath, "utf8")) as XeroCustomersExport & {
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

    const snapshots: CustomerSnapshot[] = []

    if (data.organisations?.length) {
      for (const org of data.organisations) {
        for (const snap of org.agreementSnapshots ?? []) {
          snapshots.push(snap)
        }
      }
    } else if (data.customers?.length) {
      for (const c of data.customers) {
        snapshots.push({
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
        })
      }
    }

    let filtered = snapshots
    if (includeCsv) {
      const csvPath = path.isAbsolute(includeCsv) ? includeCsv : path.join(process.cwd(), includeCsv)
      if (!fs.existsSync(csvPath)) {
        console.error(`Include CSV not found: ${csvPath}`)
        process.exit(1)
      }
      const allowed = loadIncludeCompanyNames(csvPath)
      filtered = snapshots.filter((s) => allowed.has(s.companyName.toLowerCase()))
      console.log(`Filtered to ${filtered.length} of ${snapshots.length} contacts (${allowed.size} names in CSV).`)
    }

    if (stripXeroIds) {
      for (const snap of filtered) {
        delete snap.xeroContactId
      }
      console.log("Stripped xeroContactId from import rows (for new Xero org).")
    }

    console.log(`Importing ${filtered.length} contacts from Xero export...`)
    for (const snapshot of filtered) {
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
