/**
 * Export all Xero customers from every linked organisation to project root.
 *
 *   pnpm export-xero-customers
 */
import fs from "fs"
import path from "path"
import { ensureXeroTokenFresh, writeXeroCustomerExports } from "../lib/xero/export-customers"

const root = process.cwd()
const envPath = path.join(root, ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

async function main() {
  await ensureXeroTokenFresh()
  const data = await writeXeroCustomerExports(root)

  console.log(`Exported ${data.totalCustomers} customers from ${data.organisationCount} organisation(s):`)
  for (const org of data.organisations) {
    console.log(`  - ${org.tenantName}: ${org.customerCount}`)
  }
  console.log("")
  console.log("Written to project root:")
  console.log("  xero-customers-export.json")
  console.log("  xero-customers-export.csv")
  console.log("  xero-customers-export.md")
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
