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
 *   pnpm reset-crm-data --import-xero --include-csv=xero-import-selected.csv --strip-xero-ids --dry-run
 */
import fs from "fs"
import path from "path"
import { closeDb, ensureDb, execute } from "@/lib/db"
import { upsertContactFromSnapshot } from "@/lib/crm/contacts"
import type { CustomerSnapshot } from "@/lib/proposals/orders"
import type { XeroCustomersExport } from "@/lib/xero/export-customers"
import {
  allowedCompanyNamesFromManifest,
  collectSnapshotsFromExport,
  dedupeSnapshotsByCompany,
  loadImportManifestCsv,
  preflightImport,
} from "@/lib/xero/import-manifest"

function argValue(prefix: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`${prefix}=`))
  return hit?.slice(prefix.length + 1)
}

async function main() {
  const importXero = process.argv.includes("--import-xero")
  const stripXeroIds = process.argv.includes("--strip-xero-ids")
  const dryRun = process.argv.includes("--dry-run")
  const force = process.argv.includes("--force")
  const includeCsv = argValue("--include-csv") ?? "xero-import-selected.csv"

  if (importXero) {
    const csvPath = path.isAbsolute(includeCsv)
      ? includeCsv
      : path.join(process.cwd(), includeCsv)
    if (!fs.existsSync(csvPath)) {
      console.error(`Include CSV not found: ${csvPath}`)
      console.error("Run: node --import tsx -e \"import { buildImportManifestFromList, manifestToCsv } from './lib/xero/import-manifest.ts'; import fs from 'fs'; fs.writeFileSync('xero-import-selected.csv', manifestToCsv(buildImportManifestFromList()))\"")
      process.exit(1)
    }

    const preflight = preflightImport(process.cwd(), csvPath)
    console.log(`Preflight: ${preflight.manifestRows.length} manifest rows → ${preflight.uniqueContacts} unique contacts`)
    if (preflight.duplicateOrgWarnings.length) {
      console.log("Duplicate org (resolved per company):")
      for (const w of preflight.duplicateOrgWarnings) console.log(`  - ${w}`)
    }
    if (preflight.unresolved.length) {
      console.error("Unresolved list names (not in export):")
      for (const u of preflight.unresolved) console.error(`  - ${u}`)
      if (!force) {
        console.error("Fix manifest or export, or pass --force to import anyway.")
        process.exit(1)
      }
    }

    const exportPath = path.join(process.cwd(), "xero-customers-export.json")
    if (!fs.existsSync(exportPath)) {
      console.error("xero-customers-export.json not found. Run pnpm export-xero-customers first.")
      process.exit(1)
    }

    const data = JSON.parse(fs.readFileSync(exportPath, "utf8")) as XeroCustomersExport
    const manifestRows = loadImportManifestCsv(csvPath)
    const allowed = allowedCompanyNamesFromManifest(manifestRows)
    const deduped = dedupeSnapshotsByCompany(collectSnapshotsFromExport(data), allowed)
    let filtered: CustomerSnapshot[] = deduped.map((d) => ({ ...d.snap }))

    if (stripXeroIds) {
      for (const snap of filtered) delete snap.xeroContactId
    }

    if (dryRun) {
      console.log("\nDry run — no database changes.")
      console.log(`Would wipe CRM data then import ${filtered.length} contacts:`)
      for (const snap of filtered) console.log(`  - ${snap.companyName}`)
      return
    }

    await ensureDb()
  } else if (dryRun) {
    console.log("--dry-run requires --import-xero")
    process.exit(1)
  } else {
    await ensureDb()
  }

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
    const csvPath = path.isAbsolute(includeCsv!)
      ? includeCsv!
      : path.join(process.cwd(), includeCsv!)
    const exportPath = path.join(process.cwd(), "xero-customers-export.json")
    const data = JSON.parse(fs.readFileSync(exportPath, "utf8")) as XeroCustomersExport
    const manifestRows = loadImportManifestCsv(csvPath)
    const allowed = allowedCompanyNamesFromManifest(manifestRows)
    const deduped = dedupeSnapshotsByCompany(collectSnapshotsFromExport(data), allowed)
    let filtered: CustomerSnapshot[] = deduped.map((d) => ({ ...d.snap }))

    if (stripXeroIds) {
      for (const snap of filtered) delete snap.xeroContactId
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
