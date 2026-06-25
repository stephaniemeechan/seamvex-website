#!/usr/bin/env tsx
/** Regenerate xero-import-selected.csv from list-of-companies.csv + export JSON. */
import fs from "fs"
import path from "path"
import {
  buildImportManifestFromList,
  manifestToCsv,
  preflightImport,
} from "@/lib/xero/import-manifest"

const root = process.cwd()
const rows = buildImportManifestFromList(root)
const out = path.join(root, "xero-import-selected.csv")
fs.writeFileSync(out, manifestToCsv(rows), "utf8")

const pf = preflightImport(root, out)
console.log(`Wrote ${out}: ${rows.length} rows → ${pf.uniqueContacts} unique contacts`)
if (pf.duplicateOrgWarnings.length) {
  console.log("Duplicate org warnings:")
  for (const w of pf.duplicateOrgWarnings) console.log(`  - ${w}`)
}
if (pf.unresolved.length) {
  console.error("Unresolved:", pf.unresolved)
  process.exit(1)
}
