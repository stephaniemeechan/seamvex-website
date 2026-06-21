#!/usr/bin/env node
/**
 * Build deploy/cloud-run-env.prod.yaml from template + .secrets OAuth JSON.
 * Output is gitignored — run before apply-prod-env.ps1 or apply-prod-env.sh
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

function findOAuthJson() {
  if (!fs.existsSync(secretsDir)) return null
  const files = fs.readdirSync(secretsDir).filter((f) => f.startsWith("client_secret_") && f.endsWith(".json"))
  if (!files.length) return null
  return JSON.parse(fs.readFileSync(path.join(secretsDir, files[0]), "utf8"))
}

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local")
  if (!fs.existsSync(envPath)) return {}
  const out = {}
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

function requireVar(name, local) {
  const val = process.env[name] ?? local[name]
  if (!val) {
    console.error(`Missing ${name} — set in .env.local or export before running.`)
    process.exit(1)
  }
  return val
}

const oauth = findOAuthJson()
if (!oauth?.web?.client_id || !oauth?.web?.client_secret) {
  console.error("Missing .secrets/client_secret_*.json — add OAuth Web client JSON first.")
  process.exit(1)
}

const local = loadEnvLocal()
const DATABASE_URL = requireVar("DATABASE_URL", local)
const SESSION_SECRET = requireVar("SESSION_SECRET", local)
const DOCUMENSO_WEBHOOK_SECRET = requireVar("DOCUMENSO_WEBHOOK_SECRET", local)

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
