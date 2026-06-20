import { readLegalFile } from "@/lib/legal/paths"

export type CustomerComms = {
  emailSubjects: string[]
  emailBody: string
  coverNoteAgreement: string
  followUpSubject: string
  followUpBody: string
  whoIsSeamcor: string
  doNotSay: string[]
}

function sectionAfter(md: string, heading: string): string {
  const idx = md.indexOf(heading)
  if (idx === -1) return ""
  return md.slice(idx + heading.length)
}

function sectionUntil(md: string, endHeadings: string[]): string {
  let end = md.length
  for (const h of endHeadings) {
    const i = md.indexOf(h)
    if (i !== -1 && i < end) end = i
  }
  return md.slice(0, end)
}

function extractBlockquote(block: string): string {
  const lines = block.split("\n")
  const quoteLines: string[] = []
  for (const line of lines) {
    const t = line.trim()
    if (t.startsWith(">")) quoteLines.push(t.replace(/^>\s?/, ""))
    else if (quoteLines.length > 0 && t === "") break
  }
  return quoteLines.join("\n").trim()
}

export function loadCustomerComms(): CustomerComms {
  const md = readLegalFile("customer-comms.md")

  const subjectBlock = sectionUntil(
    sectionAfter(md, "## Email subject lines"),
    ["\n---\n", "## Email body"],
  )
  const subjectLines = subjectBlock
    .split("\n")
    .filter((l) => l.startsWith("- "))
    .map((l) => l.replace(/^-\s*/, "").trim())

  const emailBlock = sectionUntil(
    sectionAfter(md, "## Email body (Stephanie)"),
    ["\n---\n"],
  )
  const emailBody = emailBlock.replace(/^[\s\S]*?\n\nDear/, "Dear").trim()

  const coverBlock = sectionUntil(
    sectionAfter(md, "## Short cover note (with updated agreement)"),
    ["\n---\n", "## If a customer asks"],
  )
  const coverNoteAgreement = extractBlockquote(coverBlock)

  const followUpBlock = sectionUntil(sectionAfter(md, "## Optional follow-up"), ["\n---\n"])
  const followUpSubject =
    followUpBlock.match(/Subject: (.+)/)?.[1]?.trim() ?? "Re: Seamcor — updated agreement"
  const followUpBody = followUpBlock.split("Dear")[1]?.trim() ?? ""

  const whoBlock = sectionUntil(
    sectionAfter(md, "## If a customer asks"),
    ["\n---\n", "This matches"],
  )
  const whoIsSeamcor = extractBlockquote(whoBlock)

  const doNotBlock = sectionUntil(sectionAfter(md, "## What not to say"), ["\n---\n", "## Optional"])
  const doNotSay = doNotBlock
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|[-:\s|]+\|$/.test(l) && !/^\|\s*Avoid\s*\|/.test(l))
    .map((l) => l.split("|")[1]?.trim())
    .filter(Boolean) as string[]

  return {
    emailSubjects: subjectLines.length ? subjectLines : ["Seamcor — a quick note from Stephanie"],
    emailBody,
    coverNoteAgreement,
    followUpSubject,
    followUpBody,
    whoIsSeamcor,
    doNotSay,
  }
}

export function fillCommsTemplate(template: string, vars: Record<string, string>): string {
  let out = template
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`[${k}]`, v)
  }
  return out
}

/** Body sent via Gmail on agreement send — must match app/api/orders/[id]/send/route.ts */
export function buildAgreementSendEmail(coverNote: string, signUrl: string): string {
  return (
    coverNote +
    "\n\nSign here: " +
    signUrl +
    "\n\nSeamvex Data Systems Ltd, trading as Seamcor"
  )
}
