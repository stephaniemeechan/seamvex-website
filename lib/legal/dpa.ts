import { readLegalFile } from "./paths"

export type DpaSection = { heading: string | null; paragraphs: string[] }

export function loadDpaMarkdown(): string {
  return readLegalFile("seamvex-data-processing-agreement.md")
}

/** Parse DPA markdown into PDF sections (skip frontmatter-style blocks before ## 1.) */
export function splitDpaSections(md: string): DpaSection[] {
  const body = md.split("## 1. Background")[0]
  const main = md.includes("## 1. Background") ? md.slice(md.indexOf("## 1. Background")) : md
  const parts = main.split(/^## /m).filter(Boolean)
  return parts.map((chunk) => {
    const lines = chunk.trim().split("\n")
    const heading = lines[0]?.trim() ?? null
    const rest = lines.slice(1).join("\n").trim()
    const paragraphs = rest
      .split(/\n\n+/)
      .map((p) =>
        p
          .replace(/^>\s*/gm, "")
          .replace(/\|/g, " ")
          .replace(/\*\*/g, "")
          .replace(/^-\s+/gm, "• ")
          .replace(/^\d+\.\d+\s+/gm, "")
          .trim(),
      )
      .filter((p) => p.length > 20 && !p.startsWith("---"))
    return { heading, paragraphs }
  })
}

export function dpaPartiesBlock(customerName: string, customerAddress: string): string {
  return `(1) ${customerName} of ${customerAddress} ("Controller"); and\n\n(2) SEAMVEX DATA SYSTEMS LTD, company number 17188046, registered office Church Court, Stourbridge Road, Halesowen, England, B63 3TT, trading as Seamcor ("Processor").`
}
