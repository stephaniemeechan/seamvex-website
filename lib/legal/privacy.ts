import { readLegalFile } from "./paths"

export type PrivacySection = { heading: string | null; paragraphs: string[] }

export function loadPrivacyMarkdown(): string {
  return readLegalFile("seamvex-platform-privacy-statement.md")
}

/** Parse platform privacy markdown into PDF sections (from ## Privacy Statement onward). */
export function splitPrivacySections(md: string): PrivacySection[] {
  const start = md.indexOf("## Privacy Statement")
  const main = start >= 0 ? md.slice(start) : md
  const parts = main.split(/^## /m).filter(Boolean)
  return parts.map((chunk) => {
    const lines = chunk.trim().split("\n")
    const heading = lines[0]?.replace(/^#+\s*/, "").trim() ?? null
    const rest = lines.slice(1).join("\n").trim()
    const paragraphs = rest
      .split(/\n\n+/)
      .map((p) =>
        p
          .replace(/^###\s+/gm, "")
          .replace(/^>\s*/gm, "")
          .replace(/\|/g, " ")
          .replace(/\*\*/g, "")
          .replace(/^-\s+/gm, "• ")
          .trim(),
      )
      .filter((p) => p.length > 20 && !p.startsWith("---") && !p.startsWith("|"))
    return { heading, paragraphs }
  })
}
