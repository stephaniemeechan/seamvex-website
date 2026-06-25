#!/usr/bin/env tsx
/**
 * Push CRM contacts to Xero (create new contacts in connected org).
 *
 * Usage:
 *   pnpm push-contacts-to-xero --dry-run
 *   pnpm push-contacts-to-xero --include-csv=xero-import-selected.csv
 *   pnpm push-contacts-to-xero --include-csv=xero-import-selected.csv --force
 *
 * Requires Xero OAuth tokens in DB (connect from prod admin first).
 * Run against prod DATABASE_URL — not a local acceptance test.
 */
import fs from "fs"
import path from "path"
import { closeDb, ensureDb, execute } from "@/lib/db"
import { contactToSnapshot, listContacts } from "@/lib/crm/contacts"
import { createXeroContact, xeroConfig } from "@/lib/xero/client"
import {
  allowedCompanyNamesFromManifest,
  loadImportManifestCsv,
  preflightImport,
} from "@/lib/xero/import-manifest"

function argValue(prefix: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`${prefix}=`))
  return hit?.slice(prefix.length + 1)
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const force = process.argv.includes("--force")
  const includeCsv = argValue("--include-csv") ?? "xero-import-selected.csv"

  if (!xeroConfig()) {
    console.error("Xero not configured (XERO_CLIENT_ID / XERO_CLIENT_SECRET).")
    process.exit(1)
  }

  const csvPath = path.isAbsolute(includeCsv)
    ? includeCsv
    : path.join(process.cwd(), includeCsv)
  if (!fs.existsSync(csvPath)) {
    console.error(`Include CSV not found: ${csvPath}`)
    process.exit(1)
  }

  const preflight = preflightImport(process.cwd(), csvPath)
  const allowed = allowedCompanyNamesFromManifest(preflight.manifestRows)

  await ensureDb()
  const allContacts = await listContacts()
  const targets = allContacts.filter((c) => allowed.has(c.companyName.toLowerCase()))

  const toCreate = targets.filter((c) => !c.xeroContactId?.trim())
  const skipped = targets.filter((c) => c.xeroContactId?.trim())

  console.log(`Manifest: ${preflight.manifestRows.length} rows, ${preflight.uniqueContacts} unique`)
  console.log(`CRM matches: ${targets.length} (${toCreate.length} to create, ${skipped.length} already linked)`)

  if (skipped.length && !force) {
    console.log("Already linked (skipped):")
    for (const c of skipped) console.log(`  - ${c.companyName}`)
  }

  if (!toCreate.length) {
    console.log("Nothing to push.")
    await closeDb()
    return
  }

  if (dryRun) {
    console.log("\nDry run — would create in Xero:")
    for (const c of toCreate) console.log(`  - ${c.companyName}`)
    await closeDb()
    return
  }

  let created = 0
  for (const contact of toCreate) {
    try {
      const xc = await createXeroContact(contactToSnapshot(contact))
      await execute(
        "UPDATE contacts SET xero_contact_id = ?, xero_synced_at = ?, updated_at = ? WHERE id = ?",
        [xc.ContactID, new Date().toISOString(), new Date().toISOString(), contact.id],
      )
      console.log(`Created: ${contact.companyName} → ${xc.ContactID}`)
      created++
    } catch (e) {
      console.error(`Failed: ${contact.companyName}: ${e instanceof Error ? e.message : e}`)
      if (!force) process.exit(1)
    }
  }

  console.log(`\nDone. Created ${created} contact(s) in Xero.`)
  await closeDb()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
