#!/usr/bin/env node
/**
 * Build deploy/cloud-run-env.prod.yaml from template + .secrets OAuth JSON.
 * Output is gitignored — run before apply-prod-env.local.sh or apply-prod-env.ps1
 *
 *   node deploy/generate-prod-env.mjs
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const secretsDir = path.join(root, ".secrets")
const outPath = path.join(__dirname, "cloud-run-env.prod.yaml")

const SQL = "exalted-splicer-499401-e2:europe-west1:free-trial-first-project"

function findOAuthJson() {
  if (!fs.existsSync(secretsDir)) return null
  const files = fs.readdirSync(secretsDir).filter((f) => f.startsWith("client_secret_") && f.endsWith(".json"))
  if (!files.length) return null
  return JSON.parse(fs.readFileSync(path.join(secretsDir, files[0]), "utf8"))
}

const oauth = findOAuthJson()
if (!oauth?.web?.client_id || !oauth?.web?.client_secret) {
  console.error("Missing .secrets/client_secret_*.json — add OAuth Web client JSON first.")
  process.exit(1)
}

// Values from go-live session (outstanding.md). Override via env when generating.
const DATABASE_URL =
  process.env.DATABASE_URL ??
  `postgresql://postgres:cYoZk9Y%7E%7Ckvxy-%263@/seamvex_crm?host=/cloudsql/${SQL}`
const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "a164dfc3bd27158d04f633a156423db600625df69f094e73ec942f6fafa14221"
const DOCUMENSO_WEBHOOK_SECRET =
  process.env.DOCUMENSO_WEBHOOK_SECRET ?? "7531ec5e7a8b2726e01f75fd963905fed125a85af3e0752c"

const env = {
  SESSION_SECRET,
  GOOGLE_CLIENT_ID: oauth.web.client_id,
  GOOGLE_CLIENT_SECRET: oauth.web.client_secret,
  GOOGLE_REDIRECT_URI: "https://seamvex.com/api/auth/google/callback",
  GMAIL_REDIRECT_URI: "https://seamvex.com/api/gmail/connect/callback",
  DATABASE_URL,
  GCS_BUCKET: "seamvex-contracts-eu",
  DOCUMENSO_API_URL: "https://sign.seamvex.com/api/v2",
  DOCUMENSO_API_KEY: process.env.DOCUMENSO_API_KEY ?? "pending",
  DOCUMENSO_WEBHOOK_SECRET,
  NEXT_PUBLIC_APP_URL: "https://seamvex.com",
  ADMIN_EMAIL: "s.meechan@seamvex.com,j.cyprus@seamvex.com",
}

if (process.env.XERO_CLIENT_ID) env.XERO_CLIENT_ID = process.env.XERO_CLIENT_ID
if (process.env.XERO_CLIENT_SECRET) env.XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET
if (process.env.XERO_CLIENT_ID || process.env.XERO_CLIENT_SECRET) {
  env.XERO_REDIRECT_URI = "https://seamvex.com/api/xero/callback"
}
if (process.env.TWILIO_ACCOUNT_SID) env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
if (process.env.TWILIO_AUTH_TOKEN) env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
if (process.env.TWILIO_PHONE_NUMBER) env.TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

const yaml = Object.entries(env)
  .map(([k, v]) => `${k}: "${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
  .join("\n")

fs.writeFileSync(outPath, yaml + "\n", "utf8")
console.log(`Wrote ${outPath} (${Object.keys(env).length} vars)`)
