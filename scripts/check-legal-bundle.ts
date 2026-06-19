import fs from "fs"
import path from "path"

const DEPLOY_LEGAL = path.join(process.cwd(), "deploy", "legal")
const PUBLIC_LOGOS = path.join(process.cwd(), "public", "logos")

const REQUIRED_LEGAL = [
  "_tc-body.txt",
  "customer-comms.md",
  "support-procedures.txt",
  "legal-acknowledgement.txt",
  "pdf-footer.txt",
  "agreement-signatory.txt",
  "seamvex-data-processing-agreement.md",
  "seamvex-platform-privacy-statement.md",
]

const REQUIRED_LOGOS = ["seamcor-legal.png", "seamcor-marketing.png", "seamcor-icon.png"]

let failed = false

for (const f of REQUIRED_LEGAL) {
  const p = path.join(DEPLOY_LEGAL, f)
  if (!fs.existsSync(p)) {
    console.error(`Missing legal file: deploy/legal/${f}`)
    failed = true
  }
}

for (const f of REQUIRED_LOGOS) {
  const p = path.join(PUBLIC_LOGOS, f)
  if (!fs.existsSync(p)) {
    console.error(`Missing logo: public/logos/${f}`)
    failed = true
  }
}

if (failed) {
  console.error("Run pnpm sync-legal-bundle after updating branding/")
  process.exit(1)
}

console.log("Legal bundle check passed.")
