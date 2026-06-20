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
| B1 | Run `git status` — `.env.local` must **not** appear | [ ] | |
| B2 | Stage all project files (`git add .` or selective add) | [ ] | |
| B3 | Confirm staged: `public/logos/*.png` (all 3 required PNGs) | [ ] | |
| B4 | Confirm staged: `deploy/legal/` | [ ] | |
| B5 | Confirm staged: CRM code (`app/admin/`, `app/api/`, `lib/`, `middleware.ts`, etc.) | [ ] | |
| B6 | Commit | [ ] | |
| B7 | Push to `main` | [ ] | |
| B8 | Cloud Build trigger runs and finishes green | [ ] | |

---

## C — Google Cloud Run env (`seamvex-website`, region `europe-west1`)

Set each in **Cloud Run → seamvex-website → Edit → Variables & secrets** (or Secret Manager references).

Required by code in production (`lib/env.ts` + app). **None of these go in `.env.local` for prod.**

| # | Variable | Status | Where you get the value | Notes |
|---|----------|--------|---------------------------|-------|
| C1 | `SESSION_SECRET` | [ ] | Generate: long random string | Not `change-me-in-production` |
| C2 | `GOOGLE_CLIENT_ID` | [ ] | Google Cloud Console → APIs & Services → Credentials | |
| C3 | `GOOGLE_CLIENT_SECRET` | [ ] | Same OAuth client | |
| C4 | `GOOGLE_REDIRECT_URI` | [ ] | Set to: `https://seamvex.com/api/auth/google/callback` | Must match OAuth client |
| C5 | `DATABASE_URL` | [ ] | Cloud SQL Postgres connection string | |
| C6 | `GCS_BUCKET` | [ ] | Your GCS bucket name (e.g. `seamvex-contracts-eu`) | |
| C7 | `DOCUMENSO_API_KEY` | [ ] | Documenso admin | |
| C8 | `DOCUMENSO_WEBHOOK_SECRET` | [ ] | You choose; same value in Documenso webhook config | |
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
| D1 | Google OAuth client: add redirect `https://seamvex.com/api/auth/google/callback` | [ ] | Keep localhost URI if you use Google locally later |
| D2 | Xero app: add redirect `https://seamvex.com/api/xero/callback` | [ ] | Keep `http://localhost:3000/api/xero/callback` for local |
| D3 | Documenso service running at `sign.seamvex.com` | [ ] | See `e-sign.md` |
| D4 | Documenso webhook URL: `https://seamvex.com/api/documenso/webhook` | [ ] | Header secret = `DOCUMENSO_WEBHOOK_SECRET` |
| D5 | Cloud SQL instance exists and app can connect | [ ] | |
| D6 | GCS bucket exists (region `europe-west1`) | [ ] | |
| D7 | Twilio `+441870470573` voice webhook → `https://seamvex.com/api/twilio/voice/inbound` | [ ] | Rotate auth token if exposed |

---

## E — After prod is live (manual, not blocking deploy)

| # | Task | Status | Notes |
|---|------|--------|-------|
| E1 | Section B in `docs/XERO-SETUP.md` — connect Xero, sync contacts, test sign → DRAFT invoice | [ ] | |
| E2 | Connect Gmail per admin user in Settings | [ ] | |
| E3 | `pnpm reset-crm-data --import-xero` when ready for greenfield | [ ] | |

---

## Current session log

Use this line when we finish each step together:

```
Last completed: A14 — login works (fixed SQLite migration in lib/db/migrate.ts)
Next step: B1 — git status, confirm .env.local not staged
```
