import fs from "fs"
import path from "path"
import type { CustomerSnapshot } from "@/lib/proposals/orders"
import type { XeroCustomersExport } from "@/lib/xero/export-customers"

/** List names excluded from import (see excluded-companies.md). */
export const EXCLUDED_LIST_NAMES = [
  "Puratos (Liverpool)",
  "Harbourside Products",
  "Dartmouth Foods",
  "Seabrook Crisps (Calbee Group UK)",
  "Newberry International Produce Ltd",
  "Flavour Fresh",
  "Deli-Lites",
  "Breffni Mushrooms Marketing Ltd",
  "Hartleys Farm Foods Ltd",
  "Alan Baybutt & Sons Ltd",
  "Punjana (Thompson's Teas)",
  "Gressingham Foods",
] as const

/** Confirmed list name → canonical Xero export companyName. */
export const LIST_TO_XERO_NAME: Record<string, string> = {
  "Wholebake Ltd": "Wholebake Limited",
  "UIN Foods Limited": "UIN Foods",
  "Westcountry Spice Ltd": "Westcountry Spice Limited",
  "Shepcote Distribution Ltd": "Shepcote Distributors Limited",
  "Westland Horticulture - Driffield": "Westland Horticulture Limited",
  "Westland Horticultural - Ellesmere": "Westland Horticulture Limited",
  "YORK HOUSE FOODS": "York House Foods",
  "Thomas Hardy Burtonwood Ltd": "Thomas Hardy Holdings Limited",
  "Welsh Pantry": "The Welsh Pantry",
  "Stonegate Farmers": "Stonegate Farmers Ltd",
  "Peters Food": "Peter's Food Service Ltd",
  "Manor Farms": "Manor Farm",
  "Kanes Foods": "Kanes Foods Limited",
  JPAO: "J Pao & Company Limited",
  "Evolution Foods Ltd": "Evolution Foods Limited",
  "Holland & Barrett (Benelux)": "Holland & Barrett BV",
  "Elis UK": "Elis",
  "Forthglade Foods Limited": "Forthglade Foods LImited",
  "Heck Foods": "Heck! Food Ltd",
  "Jennings Bakery Ltd": "Jennings Bakery",
  "FEI Foods Limited": "FEI Foods Ltd",
  "DB Foods (Vantage Foods)": "DB Foods Limited (Vantage Foods)",
  "Dairy Partners": "Dairy Partners Ltd",
  "Corrboard UK": "Corrboard UK Limited",
  "British Pepper and Spice Co": "British Pepper and Spice",
  "Bridge Farm Group": "Bridge Farm Horticulture Ltd",
  "AM Fresh UK": "AM Fresh Food & Drink (UK) Ltd",
  "Adlam Engineering (PTY) LTD": "Adlam Engineering (PTY) Ltd",
}

export const PREFERRED_ORG = "Seamcor Limited"

export type ImportManifestRow = {
  listName: string
  companyName: string
  organisation: string
  notes: string
}

export function canonicalXeroName(listName: string): string {
  const trimmed = listName.trim()
  if (LIST_TO_XERO_NAME[trimmed]) return LIST_TO_XERO_NAME[trimmed]
  return trimmed
}

export function loadListOfCompanies(rootDir = process.cwd()): string[] {
  const listPath = path.join(rootDir, "list-of-companies.csv")
  if (!fs.existsSync(listPath)) {
    throw new Error("list-of-companies.csv not found")
  }
  return fs
    .readFileSync(listPath, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
}

export function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') inQuotes = false
      else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ",") {
      out.push(cur)
      cur = ""
    } else cur += ch
  }
  out.push(cur)
  return out
}

export function loadImportManifestCsv(csvPath: string): ImportManifestRow[] {
  const raw = fs.readFileSync(csvPath, "utf8")
  const lines = raw.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const header = parseCsvLine(lines[0]!)
  const idx = {
    companyName: header.findIndex((h) => h.toLowerCase() === "companyname"),
    listName: header.findIndex((h) => h.toLowerCase() === "listname"),
    organisation: header.findIndex((h) => h.toLowerCase() === "organisation"),
    notes: header.findIndex((h) => h.toLowerCase() === "notes"),
  }
  if (idx.companyName === -1) {
    throw new Error(`Import manifest must have companyName column: ${csvPath}`)
  }

  const rows: ImportManifestRow[] = []
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line)
    const companyName = cols[idx.companyName]?.trim()
    if (!companyName) continue
    rows.push({
      companyName,
      listName: idx.listName >= 0 ? (cols[idx.listName]?.trim() ?? companyName) : companyName,
      organisation: idx.organisation >= 0 ? (cols[idx.organisation]?.trim() ?? "") : "",
      notes: idx.notes >= 0 ? (cols[idx.notes]?.trim() ?? "") : "",
    })
  }
  return rows
}

export function allowedCompanyNamesFromManifest(rows: ImportManifestRow[]): Set<string> {
  return new Set(rows.map((r) => r.companyName.toLowerCase()))
}

type SnapshotWithOrg = { snap: CustomerSnapshot; org: string }

export function collectSnapshotsFromExport(data: XeroCustomersExport): SnapshotWithOrg[] {
  const out: SnapshotWithOrg[] = []
  if (data.organisations?.length) {
    for (const org of data.organisations) {
      for (const snap of org.agreementSnapshots ?? []) {
        out.push({ snap, org: org.tenantName })
      }
    }
  }
  return out
}

/** Pick Seamcor Limited when the same companyName appears in multiple orgs. */
export function dedupeSnapshotsByCompany(
  items: SnapshotWithOrg[],
  allowed: Set<string>,
): SnapshotWithOrg[] {
  const byName = new Map<string, SnapshotWithOrg>()
  for (const item of items) {
    const key = item.snap.companyName.toLowerCase()
    if (!allowed.has(key)) continue

    const existing = byName.get(key)
    if (!existing) {
      byName.set(key, item)
      continue
    }
    const preferNew =
      item.org === PREFERRED_ORG && existing.org !== PREFERRED_ORG
    if (preferNew) byName.set(key, item)
  }
  return [...byName.values()]
}

export function buildImportManifestFromList(rootDir = process.cwd()): ImportManifestRow[] {
  const listNames = loadListOfCompanies(rootDir)
  const exportPath = path.join(rootDir, "xero-customers-export.json")
  if (!fs.existsSync(exportPath)) {
    throw new Error("xero-customers-export.json not found")
  }
  const data = JSON.parse(fs.readFileSync(exportPath, "utf8")) as XeroCustomersExport
  const exportByName = new Map<string, string>()
  const allItems = collectSnapshotsFromExport(data)
  for (const { snap, org } of allItems) {
    const key = snap.companyName.toLowerCase()
    const existing = exportByName.get(key)
    if (!existing) {
      exportByName.set(key, org)
    } else if (org === PREFERRED_ORG && existing !== PREFERRED_ORG) {
      exportByName.set(key, org)
    }
  }

  const excluded = new Set(EXCLUDED_LIST_NAMES.map((n) => n.toLowerCase()))
  const rows: ImportManifestRow[] = []

  for (const listName of listNames) {
    if (excluded.has(listName.toLowerCase())) continue

    const companyName = canonicalXeroName(listName)
    const org = exportByName.get(companyName.toLowerCase())
    if (!org) {
      throw new Error(`List name not found in export: ${listName} → ${companyName}`)
    }

    const notes =
      listName !== companyName
        ? "alias"
        : listName === "Westland Horticultural - Ellesmere"
          ? "same as Driffield"
          : ""

    rows.push({ listName, companyName, organisation: org, notes })
  }

  return rows
}

export type PreflightResult = {
  manifestRows: ImportManifestRow[]
  uniqueContacts: number
  duplicateOrgWarnings: string[]
  unresolved: string[]
}

export function preflightImport(rootDir = process.cwd(), manifestPath?: string): PreflightResult {
  const manifestFile =
    manifestPath ?? path.join(rootDir, "xero-import-selected.csv")
  const resolved = path.isAbsolute(manifestFile)
    ? manifestFile
    : path.join(rootDir, manifestFile)

  const manifestRows = fs.existsSync(resolved)
    ? loadImportManifestCsv(resolved)
    : buildImportManifestFromList(rootDir)

  const exportPath = path.join(rootDir, "xero-customers-export.json")
  const data = JSON.parse(fs.readFileSync(exportPath, "utf8")) as XeroCustomersExport
  const all = collectSnapshotsFromExport(data)
  const allowed = allowedCompanyNamesFromManifest(manifestRows)

  const duplicateOrgWarnings: string[] = []
  const namesInMultipleOrgs = new Map<string, Set<string>>()
  for (const { snap, org } of all) {
    const key = snap.companyName.toLowerCase()
    if (!allowed.has(key)) continue
    if (!namesInMultipleOrgs.has(key)) namesInMultipleOrgs.set(key, new Set())
    namesInMultipleOrgs.get(key)!.add(org)
  }
  for (const [name, orgs] of namesInMultipleOrgs) {
    if (orgs.size > 1) {
      duplicateOrgWarnings.push(
        `${manifestRows.find((r) => r.companyName.toLowerCase() === name)?.companyName ?? name}: ${[...orgs].join(" + ")} (using ${PREFERRED_ORG})`,
      )
    }
  }

  const deduped = dedupeSnapshotsByCompany(all, allowed)
  const listNames = loadListOfCompanies(rootDir)
  const excluded = new Set(EXCLUDED_LIST_NAMES.map((n) => n.toLowerCase()))
  const unresolved: string[] = []
  for (const listName of listNames) {
    if (excluded.has(listName.toLowerCase())) continue
    const companyName = canonicalXeroName(listName)
    if (!deduped.some((d) => d.snap.companyName.toLowerCase() === companyName.toLowerCase())) {
      unresolved.push(listName)
    }
  }

  return {
    manifestRows,
    uniqueContacts: deduped.length,
    duplicateOrgWarnings,
    unresolved,
  }
}

export function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function manifestToCsv(rows: ImportManifestRow[]): string {
  const header = "companyName,listName,organisation,notes"
  const lines = rows.map((r) =>
    [r.companyName, r.listName, r.organisation, r.notes].map(csvEscape).join(","),
  )
  return `${header}\r\n${lines.join("\r\n")}\r\n`
}
