import fs from "fs"
import path from "path"

const ROOT = process.cwd()
const BRANDING_LEGAL = path.join(ROOT, "branding", "legal")
const BRANDING_LOGOS = path.join(ROOT, "branding", "logos")
const DEPLOY_LEGAL = path.join(ROOT, "deploy", "legal")
const PUBLIC_LOGOS = path.join(ROOT, "public", "logos")

const LEGAL_FILES = [
  "_tc-body.txt",
  "customer-comms.md",
  "support-procedures.txt",
  "legal-acknowledgement.txt",
  "pdf-footer.txt",
  "agreement-signatory.txt",
  "seamvex-data-processing-agreement.md",
  "seamvex-platform-privacy-statement.md",
]

const LOGO_FILES = [
  "seamcor-marketing.png",
  "seamcor-marketing-transparent.png",
  "seamcor-marketing.svg",
  "seamcor-legal.png",
  "seamcor-legal-transparent.png",
  "seamcor-legal.svg",
  "seamcor-icon.png",
  "seamcor-icon.svg",
]

function copyIfExists(src: string, dest: string) {
  if (!fs.existsSync(src)) {
    console.warn(`Skip missing: ${src}`)
    return false
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
  return true
}

console.log("Syncing legal bundle to deploy/legal and public/logos...")
fs.mkdirSync(DEPLOY_LEGAL, { recursive: true })
fs.mkdirSync(PUBLIC_LOGOS, { recursive: true })

let legalCopied = 0
for (const file of LEGAL_FILES) {
  if (copyIfExists(path.join(BRANDING_LEGAL, file), path.join(DEPLOY_LEGAL, file))) legalCopied++
}

let logosCopied = 0
for (const file of LOGO_FILES) {
  if (copyIfExists(path.join(BRANDING_LOGOS, file), path.join(PUBLIC_LOGOS, file))) logosCopied++
}

console.log(`Copied ${legalCopied}/${LEGAL_FILES.length} legal files, ${logosCopied}/${LOGO_FILES.length} logos.`)
