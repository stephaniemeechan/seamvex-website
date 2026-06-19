import fs from "fs"
import { legalLogoPath } from "@/lib/legal/paths"

let cachedLogoUri: string | null = null

export function getLegalLogoUri(): string {
  if (cachedLogoUri) return cachedLogoUri
  const logoSrc = legalLogoPath()
  const logoData = fs.readFileSync(logoSrc)
  cachedLogoUri = `data:image/png;base64,${logoData.toString("base64")}`
  return cachedLogoUri
}
