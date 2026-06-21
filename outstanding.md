# Go-live outstanding — START HERE (new chat)

**Updated:** 2026-06-21  
**Repo:** `main` @ `020abc6` (code complete — no code blockers)  
**GCP project:** `exalted-splicer-499401-e2` (console: **My First Project**)  
**Live service:** `seamvex-website-2` · `europe-west1` · public · 4 domain mappings active  
**Secrets:** `.env.local` (gitignored) + `deploy/apply-prod-env.local.sh` (gitignored) — **never commit**

**Smoke last run:** `pnpm go-live-smoke` → **5/6** — Google OAuth **503** until Cloud Run env + real `GOOGLE_*` set.

---

## NEXT ACTION (do this first in new chat)

**Fastest path (recommended):** generate env file from `.secrets/` OAuth JSON, then apply in one command.

```powershell
node deploy/generate-prod-env.mjs
gcloud auth login
.\deploy\apply-prod-env.ps1
```

Or on Cloud Shell / bash: `bash deploy/apply-prod-env.local.sh` (after uploading `deploy/cloud-run-env.prod.yaml`).

**Do not use** `--update-env-vars=...ADMIN_EMAIL=a@x.com,j@y.com` — gcloud treats commas as delimiters and breaks `ADMIN_EMAIL`. Use `--env-vars-file` (scripts above).

**Live revision check (2026-06-21):** `seamvex-website-2-00016-qgc` has only **3 vars** (`SESSION_SECRET`, truncated `DATABASE_URL`, `GOOGLE_CLIENT_ID`). Missing `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and 7 others → OAuth **503**.

**Console alternative:**  
https://console.cloud.google.com/run/deploy/europe-west1/seamvex-website-2?project=exalted-splicer-499401-e2  
→ **Variables & Secrets** — paste all 12 vars from `deploy/cloud-run-env.prod.yaml` (fix full `DATABASE_URL`) → **Deploy**

Then: `https://seamvex.com/admin/login` → Google sign-in as `s.meechan@seamvex.com` → **admin auto-created**.

**Git push does NOT wipe** Cloud Run env/SQL connection (`cloudbuild.yaml` only swaps image).

---

## DONE this session

| Item | Status |
|------|--------|
| Cloud Run target | `seamvex-website-2` live (public); orphan `seamvex-website` ew1+ew2 **still exist** — delete after login works |
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
- **Browser automation:** can fill non-secret URL vars in console; secrets + Deploy must be done by you (or `apply-prod-env.ps1` after `gcloud auth login`).

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
