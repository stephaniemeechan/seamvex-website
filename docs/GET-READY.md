# Get ready — local + Cloud Run

Work through this file **in order**. Mark each item when done.

**Status key:** `[ ]` not done · `[x]` done · `[!]` blocked (note why in Notes column)

Do **not** commit `.env.local`. It stays on your machine only.

---

## A — Local machine (your PC)

| # | Task | Status | Notes |
|---|------|--------|-------|
| A1 | `pnpm install` in repo root | [x] | Done — lockfile up to date |
| A2 | Confirm `branding/logos/` exists (source for sync) | [x] | 8 files in `branding/logos/` |
| A3 | Run `pnpm sync-legal-bundle` | [x] | 8/8 legal, 8/8 logos copied |
| A4 | Confirm these files exist: `public/logos/seamcor-legal.png`, `seamcor-marketing.png`, `seamcor-icon.png` | [x] | Verified on disk |
| A5 | Confirm `deploy/legal/` has 8 legal files | [x] | Verified |
| A6 | `.env.local` exists (not committed) | [x] | |
| A7 | `.env.local` has `ADMIN_EMAIL` | [x] | |
| A8 | `.env.local` has `ADMIN_PASSWORD` | [x] | |
| A9 | `.env.local` has `SESSION_SECRET` (any non-empty string for local) | [x] | |
| A10 | `.env.local` has `NEXT_PUBLIC_APP_URL=http://localhost:3000` | [x] | |
| A11 | `.env.local` has **no** `GOOGLE_CLIENT_ID` (unless you want Google login locally instead of password) | [x] | No Google vars — password login path |
| A12 | `.env.local` has Xero vars if you test Xero locally (`XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REDIRECT_URI=http://localhost:3000/api/xero/callback`) | [x] | Xero vars present |
| A13 | Run `pnpm dev` | [x] | Running on http://localhost:3000 |
| A14 | Open `http://localhost:3000/admin/login` — password login works | [x] | Login API returns 200 |
| A15 | Run `pnpm build` — completes without error | [x] | Passed |

---

## B — Git (before push)

| # | Task | Status | Notes |
|---|------|--------|-------|
| B1 | Run `git status` — `.env.local` must **not** appear | [x] | Verified before push |
| B2 | Stage all project files (`git add .` or selective add) | [x] | |
| B3 | Confirm staged: `public/logos/*.png` (all 3 required PNGs) | [x] | 3 PNGs committed in repo |
| B4 | Confirm staged: `deploy/legal/` | [x] | 8 legal files committed |
| B5 | Confirm staged: CRM code (`app/admin/`, `app/api/`, `lib/`, `middleware.ts`, etc.) | [x] | |
| B6 | Commit | [x] | `d1531a5` — deploy target, signed-pdf GCS, prod env vars |
| B7 | Push to `main` | [x] | Pushed to `main` |
| B8 | Cloud Build trigger runs and finishes green | [ ] | Confirm after `26a2c8f` push — targets `seamvex-website-2` |

**Code fixes in `d1531a5` (done in repo):**

- `cloudbuild.yaml` → deploys **`seamvex-website-2`** (not orphan `seamvex-website`)
- `signed-pdf` route uses `readOrderPdf()` for GCS paths
- `lib/env.ts` `PROD_REQUIRED` includes `GOOGLE_REDIRECT_URI`, `DOCUMENSO_API_URL`, `NEXT_PUBLIC_APP_URL`

---

## C — Google Cloud Run env (`seamvex-website-2`, region `europe-west1`)

Set each in **Cloud Run → seamvex-website-2 → Edit → Variables & secrets** (or Secret Manager references).

Required by code in production (`lib/env.ts` `PROD_REQUIRED`). **None of these go in `.env.local` for prod.**

| # | Variable | Status | Where you get the value | Notes |
|---|----------|--------|---------------------------|-------|
| C1 | `SESSION_SECRET` | [ ] | Generate: long random string | Not `change-me-in-production` |
| C2 | `GOOGLE_CLIENT_ID` | [ ] | Google Cloud Console → APIs & Services → Credentials | |
| C3 | `GOOGLE_CLIENT_SECRET` | [ ] | Same OAuth client | |
| C4 | `GOOGLE_REDIRECT_URI` | [ ] | Set to: `https://seamvex.com/api/auth/google/callback` | Must match OAuth client |
| C5 | `DATABASE_URL` | [ ] | Cloud SQL Postgres connection string | |
| C6 | `GCS_BUCKET` | [ ] | `seamvex-contracts-eu` | Cloud Run SA needs `storage.objectUser` — see [DEPLOY.md](./DEPLOY.md) |
| C7 | `DOCUMENSO_API_KEY` | [ ] | Documenso admin | |
| C8 | `DOCUMENSO_WEBHOOK_SECRET` | [ ] | You choose; same value in Documenso webhook config | Header `x-documenso-secret` |
| C9 | `DOCUMENSO_API_URL` | [ ] | Set to: `https://sign.seamvex.com/api/v2` | |
| C10 | `XERO_CLIENT_ID` | [ ] | https://developer.xero.com/app/manage | |
| C11 | `XERO_CLIENT_SECRET` | [ ] | Same Xero app | |
| C12 | `XERO_REDIRECT_URI` | [ ] | Set to: `https://seamvex.com/api/xero/callback` | Must match Xero app |
| C13 | `NEXT_PUBLIC_APP_URL` | [ ] | Set to: `https://seamvex.com` | |
| C14 | `ADMIN_EMAIL` | [ ] | Set to: `s.meechan@seamvex.com` | |
| C15 | Deploy new Cloud Run revision after env set | [ ] | | |
| C16 | Open `https://seamvex.com/admin/login` — Google sign-in works | [ ] | | |

**Do not set on Cloud Run:** `ADMIN_PASSWORD` (password login disabled in production).

**Optional (when you use them):**

| # | Variable | Status | Notes |
|---|----------|--------|-------|
| C17 | `TWILIO_ACCOUNT_SID` | [ ] | Voice company line |
| C18 | `TWILIO_AUTH_TOKEN` | [ ] | Rotate if exposed |
| C19 | `TWILIO_PHONE_NUMBER` | [ ] | e.g. `+441870470573` |
| C20 | Twilio number voice webhook | [ ] | POST `https://seamvex.com/api/twilio/voice/inbound` |
| C21 | Admin → Settings → voice routing | [ ] | Hours, after-hours mobile, ring group |
| C22 | `XERO_SALES_ACCOUNT_CODE` | [ ] | Default in code is `200` |

---

## D — External consoles (redirect URIs must match Cloud Run)

| # | Task | Status | Notes |
|---|------|--------|-------|
| D1 | Google OAuth client: add redirect `https://seamvex.com/api/auth/google/callback` | [ ] | Keep `http://localhost:3000/api/auth/google/callback` if you use Google locally |
| D2 | Google OAuth client: add Gmail redirect `https://seamvex.com/api/gmail/connect/callback` | [ ] | Keep `http://localhost:3000/api/gmail/connect/callback` for local |
| D3 | Xero app: add redirect `https://seamvex.com/api/xero/callback` | [ ] | Keep `http://localhost:3000/api/xero/callback` for local |
| D4 | Documenso service running at `sign.seamvex.com` | [ ] | See `e-sign.md` — **manual deploy** |
| D5 | Documenso webhook URL: `https://seamvex.com/api/documenso/webhook` | [ ] | Header **`x-documenso-secret`** = `DOCUMENSO_WEBHOOK_SECRET` |
| D6 | Cloud SQL instance exists and app can connect | [ ] | |
| D7 | GCS bucket exists (region `europe-west1`) + Run SA has `storage.objectUser` | [ ] | See [DEPLOY.md](./DEPLOY.md) |
| D8 | Twilio `+441870470573` voice webhook → `https://seamvex.com/api/twilio/voice/inbound` | [ ] | Rotate auth token if exposed |
| D9 | Delete orphan Cloud Run services `seamvex-website` (ew1 + ew2) after B8 green | [ ] | Live service is `seamvex-website-2` |

---

## E — After prod is live (manual, not blocking deploy)

| # | Task | Status | Notes |
|---|------|--------|-------|
| E1 | Section B in `docs/XERO-SETUP.md` — connect Xero, sync contacts, test sign → DRAFT invoice | [ ] | |
| E2 | Connect Gmail per admin user in Settings | [ ] | Requires D2 redirect URIs |
| E3 | `pnpm reset-crm-data --import-xero` when ready for greenfield | [ ] | Reads `organisations[].agreementSnapshots` from export |

---

## Smoke tests (automated)

Run against production:

```bash
pnpm go-live-smoke
```

Checks: home 200, admin login 200, Twilio verify file, legacy `/sign` 404, Documenso webhook rejects unsigned POST.

Manual E2E still required: Google SSO, agreement send/sign, Gmail, Xero DRAFT, Twilio voice.

---

## Current session log

```
Last completed: df55a72 — go-live smoke test script; pnpm go-live-smoke PASS (5/5)
Next step: B8 — confirm Cloud Build green; C1–C16 using deploy/cloud-run-env.template
Automated smoke 2026-06-20: seamvex.com + seamcor.com home 200; admin login 200; Twilio verify 200; /sign 404; sign.seamvex.com NOT REACHABLE (Documenso not deployed)
```
