/**
 * Environment gates. Production must never silently fall back to dev behaviour.
 *
 * pnpm dev (NODE_ENV=development) → SQLite, local PDFs, password login if no Google, legacy /sign if no Documenso
 * NODE_ENV=production → requires prod vars; legacy sign and password login blocked
 */

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production"
}

const PROD_REQUIRED = [
  "SESSION_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "DATABASE_URL",
  "GCS_BUCKET",
  "DOCUMENSO_API_KEY",
  "DOCUMENSO_API_URL",
  "DOCUMENSO_WEBHOOK_SECRET",
  "NEXT_PUBLIC_APP_URL",
] as const

let prodValidated = false

/** Call at first DB access in production. Throws if misconfigured. */
export function assertProductionEnv(): void {
  if (!isProduction()) return
  if (prodValidated) return
  const missing = PROD_REQUIRED.filter((k) => !process.env[k]?.trim())
  if (missing.length) {
    throw new Error(`Production misconfiguration — missing: ${missing.join(", ")}`)
  }
  prodValidated = true
}

export function legacySignAllowed(): boolean {
  return !isProduction()
}

export function passwordLoginAllowed(): boolean {
  return !isProduction() && !process.env.GOOGLE_CLIENT_ID?.trim()
}

export function documensoRequired(): boolean {
  return isProduction()
}

export function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}
