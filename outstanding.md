# Go-live outstanding — START HERE (new chat)

**Updated:** 2026-06-21  
**Repo:** `main` @ `b00fe43` (code complete — no code blockers)  
**GCP project:** `exalted-splicer-499401-e2` (console: **My First Project**)  
**Live service:** `seamvex-website-2` · `europe-west1` · public · 4 domain mappings active  
**Secrets:** `.env.local` (gitignored) + `deploy/apply-prod-env.local.sh` (gitignored) — **never commit**

**Smoke last run:** `pnpm go-live-smoke` → **5/6** — Google OAuth **503** until Cloud Run env + real `GOOGLE_*` set.

---

## NEXT ACTION (do this first in new chat)

Run on **Cloud Shell** (GCP console → terminal icon) or local terminal if `gcloud` installed.

Replace `REPLACE_ME` with OAuth **Client ID** and **Client secret** from  
https://console.cloud.google.com/apis/credentials?project=exalted-splicer-499401-e2  
(Web app · redirects: `https://seamvex.com/api/auth/google/callback` + `https://seamvex.com/api/gmail/connect/callback`)

**PowerShell:** run as **two separate commands** (no `&&`).

```powershell
gcloud config set project exalted-splicer-499401-e2
```

```powershell
gcloud run services update seamvex-website-2 --region=europe-west1 --add-cloudsql-instances=exalted-splicer-499401-e2:europe-west1:free-trial-first-project --update-env-vars="DATABASE_URL=postgresql://postgres:cYoZk9Y%7E%7Ckvxy-%263@/seamvex_crm?host=/cloudsql/exalted-splicer-499401-e2:europe-west1:free-trial-first-project,SESSION_SECRET=a164dfc3bd27158d04f633a156423db600625df69f094e73ec942f6fafa14221,GOOGLE_REDIRECT_URI=https://seamvex.com/api/auth/google/callback,GMAIL_REDIRECT_URI=https://seamvex.com/api/gmail/connect/callback,NEXT_PUBLIC_APP_URL=https://seamvex.com,ADMIN_EMAIL=s.meechan@seamvex.com,j.cyprus@seamvex.com,GCS_BUCKET=seamvex-contracts-eu,DOCUMENSO_API_URL=https://sign.seamvex.com/api/v2,DOCUMENSO_API_KEY=pending,DOCUMENSO_WEBHOOK_SECRET=7531ec5e7a8b2726e01f75fd963905fed125a85af3e0752c,GOOGLE_CLIENT_ID=REPLACE_ME,GOOGLE_CLIENT_SECRET=REPLACE_ME"
```

Then: `https://seamvex.com/admin/login` → Google sign-in as `s.meechan@seamvex.com` → **admin auto-created**.

Deploy page (manual alternative):  
https://console.cloud.google.com/run/deploy/europe-west1/seamvex-website-2?project=exalted-splicer-499401-e2  
→ **Connections** → `free-trial-first-project` → **Variables & Secrets** → **Deploy**

**Git push does NOT wipe** Cloud Run env/SQL connection (`cloudbuild.yaml` only swaps image).

---

## DONE this session

| Item | Status |
|------|--------|
| Cloud Run target | `seamvex-website-2` only (orphan `seamvex-website` ew1+ew2 **deleted**) |
| Cloud SQL instance | `free-trial-first-project` · PostgreSQL **18** · `europe-west1` · free trial 30d |
| Database | **`seamvex_crm`** created |
| Xero developer app | **`seamvex-portal`** (Web app) · company URL `https://seamvex.com` · **0/5 connections** |
| Xero org | **seamvex data systems ltd** (new/empty) |
| Twilio recorded | SID in `.env.local` · `+441870470573` Seamvex Main |
| MFA on GCP | Resolved |
| `.env.local` | SQL password, `DATABASE_URL`, generated `SESSION_SECRET` + `DOCUMENSO_WEBHOOK_SECRET`, prod URLs |
| `sign.seamvex.com` | **NOT deployed** (ENOTFOUND) |

---

## NOT DONE — checklist

### P0 — blocks login

- [ ] **Cloud Run env applied** — gcloud command above OR console deploy (connection + all vars)
- [ ] **Google OAuth client** — create if missing; set real `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (not `REPLACE_ME`)
- [ ] **Google redirect URIs** in Credentials (D1–D2)
- [ ] **GCS bucket** `seamvex-contracts-eu` exists + Run SA `storage.objectUser` (verify)
- [ ] **Login works** — `s.meechan@seamvex.com` → admin
- [ ] **`pnpm go-live-smoke`** → 6/6

### P1 — blocks agreements

- [ ] **Documenso** at `sign.seamvex.com` — see [`e-sign.md`](e-sign.md)
- [ ] Real `DOCUMENSO_API_KEY` on Run (replace `pending`)
- [ ] **Xero** — connect org in Settings; sync contacts — see [`docs/XERO-SETUP.md`](docs/XERO-SETUP.md)
- [ ] **Customer import** — ask user: export file location; Xero empty, CRM seed via import or sync (not `data/proposals.db`)

### P2 — after live

- [ ] Twilio voice webhook + `TWILIO_*` on Run (SID/number known; auth token in `.env.local` only)
- [ ] Gmail connect per user in Settings
- [ ] Xero E2E: order → send → sign → DRAFT invoice
- [ ] Optional: `XERO_*` on Run, `XERO_SALES_ACCOUNT_CODE`, greenfield import

---

## Recorded IDs (non-secret)

| What | Value |
|------|--------|
| GCP project | `exalted-splicer-499401-e2` |
| Cloud SQL connection name | `exalted-splicer-499401-e2:europe-west1:free-trial-first-project` |
| Cloud SQL user | `postgres` |
| DB name | `seamvex_crm` |
| Xero app | `seamvex-portal` |
| Xero redirect | `https://seamvex.com/api/xero/callback` |
| Admin email | `s.meechan@seamvex.com` |
| Twilio SID | in `.env.local` only |
| Twilio number | `+441870470573` |

Passwords, tokens, `SESSION_SECRET` → **`.env.local` only**.

---

## Important facts (don't re-debate)

- **Login:** Google `@seamvex.com` only in prod. No `ADMIN_PASSWORD` on Run.
- **`data/proposals.db`:** local dev only (3 test orders, 0 contacts). **Not prod.** Prod uses Cloud SQL.
- **Proposals:** built in admin from **live Xero contacts**; not imported from SQLite.
- **`reset-crm-data --import-xero`:** contacts only, not proposals — ask before running.
- **Xero invoices:** free-text line descriptions; no Xero Item codes in code.
- **Browser automation:** cannot complete GCP forms (iframe/overlays). Use Cloud Shell or manual console.

---

## Doc index

| File | Purpose |
|------|---------|
| [`docs/GET-READY.md`](docs/GET-READY.md) | Full ordered checklist B–E |
| [`docs/XERO-SETUP.md`](docs/XERO-SETUP.md) | Xero app + org + sync |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Cloud Run reference |
| [`deploy/cloud-run-env.template`](deploy/cloud-run-env.template) | Blank env template (safe to commit) |
| [`e-sign.md`](e-sign.md) | Documenso deploy |

**After P0 login:** work P1, then `pnpm go-live-smoke`, then E2E per [`docs/GET-READY.md`](docs/GET-READY.md) §E.
