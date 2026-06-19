import fs from "fs"
import path from "path"

/** All agreement text — deploy/legal in prod, branding/legal locally */
export const LEGAL_DIRS = [
  path.join(process.cwd(), "deploy", "legal"),
  path.join(process.cwd(), "branding", "legal"),
]

export function legalPath(...segments: string[]): string {
  for (const dir of LEGAL_DIRS) {
    const filePath = path.join(dir, ...segments)
    if (fs.existsSync(filePath)) return filePath
  }
  return path.join(LEGAL_DIRS[0], ...segments)
}

export function readLegalFile(...segments: string[]): string {
  const filePath = legalPath(...segments)
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing legal file: ${segments.join("/")}. Run pnpm sync-legal-bundle or ensure branding/legal exists.`,
    )
  }
  return fs.readFileSync(filePath, "utf8")
}

export function legalLogoPath(): string {
  const candidates = [
    path.join(/* turbopackIgnore: true */ process.cwd(), "branding", "logos", "seamcor-legal.png"),
    path.join(/* turbopackIgnore: true */ process.cwd(), "public", "logos", "seamcor-legal.png"),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  throw new Error("Legal logo not found in branding/logos or public/logos")
}
