import { readLegalFile } from "./paths"

let cachedTc: string | null = null
let cachedFooter: string | null = null
let cachedAck: string | null = null
let cachedSupport: string | null = null
let cachedSignatory: { name: string; position: string } | null = null

export function loadTcBody(): string {
  if (cachedTc) return cachedTc
  cachedTc = readLegalFile("_tc-body.txt")
  return cachedTc
}

export function loadPdfFooter(): string {
  if (cachedFooter) return cachedFooter
  cachedFooter = readLegalFile("pdf-footer.txt").trim()
  return cachedFooter
}

export function loadLegalAcknowledgement(): string {
  if (cachedAck) return cachedAck
  cachedAck = readLegalFile("legal-acknowledgement.txt").trim()
  return cachedAck
}

export type PriorAgreementRefs = {
  priorAgreementDate?: string | null
  priorDocumentNumber?: string | null
}

/** Customer signature acknowledgement — omits Seamcor Ltd replacement sentence when prior refs absent. */
export function formatLegalAcknowledgement(prior?: PriorAgreementRefs): string {
  const raw = loadLegalAcknowledgement()
  const paragraphs = raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const base = paragraphs[0] ?? raw
  const replacement = paragraphs[1]
  const date = prior?.priorAgreementDate?.trim()
  const doc = prior?.priorDocumentNumber?.trim()
  if (!replacement || !date || !doc) return base
  return `${base}\n\n${replacement
    .replace("[PRIOR_AGREEMENT_DATE]", date)
    .replace("[PRIOR_DOCUMENT_NUMBER]", doc)
    .replace(/\s*Leave blank or delete this sentence for new customers with no prior Seamcor Limited agreement\.\s*$/, "")}`
}

export function loadSupportProcedures(): { intro: string; hours: string[]; upgrade: string } {
  if (cachedSupport) {
    return parseSupportProcedures(cachedSupport)
  }
  cachedSupport = readLegalFile("support-procedures.txt")
  return parseSupportProcedures(cachedSupport)
}

function parseSupportProcedures(raw: string): { intro: string; hours: string[]; upgrade: string } {
  const blocks = raw.split(/\n\n+/).map((b) => b.trim()).filter(Boolean)
  const introBlock = blocks.find((b) => b.startsWith("Logging")) ?? blocks[0] ?? ""
  const intro = introBlock.replace(/^Logging Support Issues\n?/, "").trim()
  const hours = blocks
    .filter((b) => /^(Standard|Premium|Fully Managed|SOTI):/.test(b))
    .map((b) => b.replace(/\n/g, " "))
  const upgrade = blocks.find((b) => b.startsWith("To upgrade")) ?? ""
  return { intro, hours, upgrade }
}

export function loadAgreementSignatory(): { name: string; position: string } {
  if (cachedSignatory) return cachedSignatory
  const lines = readLegalFile("agreement-signatory.txt")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  cachedSignatory = { name: lines[0] ?? "Stephanie Meechan", position: lines[1] ?? "Director" }
  return cachedSignatory
}

/** Split T&Cs same as build-customer-agreement.ps1 regex */
export function splitTcSections(body: string): { heading: string | null; paragraphs: string[] }[] {
  const normalized = body.replace(/Terms & Conditions/g, "Terms and Conditions")
  const pattern =
    /(?=Terms and Conditions|DEFINITIONS USED|THIS AGREEMENT|PROVISION OF SOFTWARE AND CHARGES|PROVISION OF SOFTWARE|CHARGES|YOUR OBLIGATIONS TO US|SUPPORT SERVICES|PROFESSIONAL SERVICES|HARDWARE|CONFIDENTIALITY|DATA PROTECTION|TERMINATION|OUR LIABILITY TO YOU|GENERAL|END USER LICENCE AGREEMENT|Interpretation|License|Export and compliance|Intellectual property rights|Duration and termination|Waiver|Remedies|Entire agreement|Variation|Third-party rights|Notices|Governing law and jurisdiction)/
  const parts = normalized.split(pattern).map((p) => p.trim()).filter((p) => p.length >= 40)

  return parts.map((section) => {
    const sentences = section.split(/(?<=[.!?])\s+(?=[A-Z"(])/)
    const first = sentences[0]?.trim() ?? ""
    const isHeading = first.length < 80 && /^[A-Z]/.test(first)
    if (isHeading) {
      return { heading: first, paragraphs: sentences.slice(1).map((s) => s.trim()).filter((s) => s.length > 25) }
    }
    return { heading: null, paragraphs: sentences.map((s) => s.trim()).filter((s) => s.length > 25) }
  })
}

export type TcBlock = { type: "heading" | "paragraph"; text: string }

/** Flatten T&C sections for flowing PDF layout (not one page per section). */
export function flowTcBlocks(body?: string): TcBlock[] {
  const sections = splitTcSections(body ?? loadTcBody())
  const blocks: TcBlock[] = []
  for (const sec of sections) {
    if (sec.heading) blocks.push({ type: "heading", text: sec.heading })
    for (const p of sec.paragraphs) {
      if (p.length > 20) blocks.push({ type: "paragraph", text: p })
    }
  }
  return blocks
}
