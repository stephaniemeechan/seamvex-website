import { isProduction } from "@/lib/env"

/** User-facing copy when Xero env vars are missing (xeroConfig() is null). */
export function xeroNotConfiguredMessage(): string {
  if (isProduction()) {
    return "Xero is not enabled on this server. Contact your administrator to complete server setup."
  }
  return "Add Xero credentials to .env.local (XERO_CLIENT_ID, XERO_CLIENT_SECRET)."
}

/** JSON API hint when an integration env var is missing. */
export function integrationConfigHint(integration: "xero" | "google"): string {
  if (isProduction()) {
    return `${integration === "xero" ? "Xero" : "Google sign-in"} is not configured on this server.`
  }
  if (integration === "xero") {
    return "Set XERO_CLIENT_ID and XERO_CLIENT_SECRET in .env.local"
  }
  return "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env.local"
}
