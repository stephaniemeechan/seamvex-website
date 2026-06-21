# Get ready — local + Cloud Run

Work through this file **in order**. Mark each item when done.

**Status key:** `[ ]` not done · `[x]` done · `[!]` blocked (note why in Notes column)

Do **not** commit `.env.local`. It stays on your machine only.

## Production state (2026-06-20 audit)

| Item | Status |
|------|--------|
| Cloud Run service **`seamvex-website-2`** (europe-west1, public) | **Live** — confirmed in GCP |
| Domain mappings (`seamvex.com`, `www`, `seamcor.com`, `www`) | **Active** — HTTPS 200 on `seamvex.com` and `www.seamcor.com` |
| `cloudbuild.yaml` deploy target | **`seamvex-website-2`** — correct in repo |
| Cloud Run env (`PROD_REQUIRED` + Xero/Twilio) | **Not set** — Google OAuth 503; Documenso webhook 503 |
| Documenso at `sign.seamvex.com` | **Not deployed** — host unreachable |
| Orphan services `seamvex-website` (ew1 + ew2) | **Still exist** — delete after B8 green |

Repo code on `origin/main` through **`4946376`** is complete for go-live; remaining work is **manual GCP + external consoles** (sections C–E below).

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
| B6 | Commit | [x] | Latest: `4946376` (Gmail UX, smoke test, doc sync) |
| B7 | Push to `main` | [x] | All commits through `4946376` on `origin/main` |
| B8 | Cloud Build trigger runs and finishes green | [ ] | Confirm in GCP Console after latest push — must deploy **`seamvex-website-2`** |

**Key repo commits (done — do not re-do):**

| Commit | What |
|--------|------|
| `d1531a5` | `cloudbuild.yaml` → **`seamvex-website-2`**; signed-pdf GCS via `readOrderPdf()`; `PROD_REQUIRED` env gate |
| `26a2c8f` | Go-live docs aligned; Xero import/sync fixes |
| `df55a72` | `pnpm go-live-smoke` script + env template |
| `caea067` | Gmail connection status, send preview, OAuth smoke check |
| `4946376` | GET-READY session log + smoke notes |

---

## C — Google Cloud Run env (`seamvex-website-2`, region `europe-west1`)

Set each in **Cloud Run → seamvex-website-2 → Edit → Variables & secrets** (or Secret Manager references).

Required by code in production (`lib/env.ts` `PROD_REQUIRED`). **None of these go in `.env.local` for prod.**

| # | Variable | Status | Where you get the value | Notes |
|---|----------|--------|---------------------------|-------|
| C1 | `SESSION_SECRET` | [ ] | Generate: long random string | Not `change-me-in-production` |
| C2 | `GOOGLE_CLIENT_ID` | [ ] | Google Cloud Console → APIs & Services → Credentials | **Smoke 503** — not set on Run yet |
| C3 | `GOOGLE_CLIENT_SECRET` | [ ] | Same OAuth client | **Smoke 503** — not set on Run yet |
| C4 | `GOOGLE_REDIRECT_URI` | [ ] | Set to: `https://seamvex.com/api/auth/google/callback` | Must match OAuth client (D1) |
| C5 | `DATABASE_URL` | [ ] | **Not in repo** — see below | Local: `docker compose postgres` only. Prod: create Cloud SQL or use existing instance |
| C6 | `GCS_BUCKET` | [ ] | `seamvex-contracts-eu` | Cloud Run SA needs `storage.objectUser` — see [DEPLOY.md](./DEPLOY.md) |
| C7 | `DOCUMENSO_API_KEY` | [ ] | Documenso admin | Blocked until D4 (`sign.seamvex.com` not deployed) |
| C8 | `DOCUMENSO_WEBHOOK_SECRET` | [ ] | You choose; same value in Documenso webhook config | **Smoke 503** — not set; header `x-documenso-secret` |
| C9 | `DOCUMENSO_API_URL` | [ ] | Set to: `https://sign.seamvex.com/api/v2` | Blocked until D4 |
| C10 | `XERO_CLIENT_ID` | [ ] | https://developer.xero.com/app/manage | Needed for Xero connect + DRAFT invoices |
| C11 | `XERO_CLIENT_SECRET` | [ ] | Same Xero app | |
| C12 | `XERO_REDIRECT_URI` | [ ] | Set to: `https://seamvex.com/api/xero/callback` | Must match Xero app (D3) |
| C13 | `NEXT_PUBLIC_APP_URL` | [ ] | Set to: `https://seamvex.com` | |
| C14 | `ADMIN_EMAIL` | [ ] | Set to: `s.meechan@seamvex.com` | First matching user becomes admin |
| C15 | Deploy new Cloud Run revision after env set | [ ] | Redeploy after all C1–C14 set | |
| C16 | Open `https://seamvex.com/admin/login` — Google sign-in works | [ ] | Blocked until C2–C4 + D1 | `/api/auth/google` must redirect (302), not 503 |

**Do not set on Cloud Run:** `ADMIN_PASSWORD` (password login disabled in production).

**Optional (when you use them):**

| # | Variable | Status | Notes |
|---|----------|--------|-------|
| C17 | `TWILIO_ACCOUNT_SID` | [ ] | in `.env.local` / Cloud Run | Recorded 2026-06-20 — Twilio Console Workbench |
| C18 | `TWILIO_AUTH_TOKEN` | [ ] | Twilio Console → Show → copy | **Secret** — Cloud Run only, not git |
| C19 | `TWILIO_PHONE_NUMBER` | [ ] | `+441870470573` | Friendly name: Seamvex Main · Scotland UK |
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
| D4 | Documenso service running at `sign.seamvex.com` | [ ] | See [e-sign.md](../e-sign.md) — **not deployed** (host unreachable 2026-06-20) |
| D5 | Documenso webhook URL: `https://seamvex.com/api/documenso/webhook` | [ ] | Header **`x-documenso-secret`** = `DOCUMENSO_WEBHOOK_SECRET`; configure after D4 |
| D6 | Cloud SQL instance exists and app can connect | [ ] | Set `DATABASE_URL` in C5 |
| D7 | GCS bucket exists (region `europe-west1`) + Run SA has `storage.objectUser` | [ ] | See [DEPLOY.md](./DEPLOY.md) |
| D8 | Twilio `+441870470573` voice webhook → `https://seamvex.com/api/twilio/voice/inbound` | [ ] | Twilio domain verify file passes smoke; voice webhook not verified |
| D9 | Delete orphan Cloud Run services `seamvex-website` (ew1 + ew2) after B8 green | [ ] | Live service is **`seamvex-website-2`** only |

---

## E — After prod is live (manual, not blocking deploy)

| # | Task | Status | Notes |
|---|------|--------|-------|
| E1 | Section B in `docs/XERO-SETUP.md` — connect Xero, sync contacts, test sign → DRAFT invoice | [ ] | Blocked until C10–C12, D3, and Google SSO (C2–C4) |
| E2 | Connect Gmail per admin user in Settings | [ ] | Blocked until C2–C4, D2, and Google SSO working |
| E3 | `pnpm reset-crm-data --import-xero` when ready for greenfield | [ ] | Reads `organisations[].agreementSnapshots` from export; run only after E1 verified |

---

## Smoke tests (automated)

Run against production:

```bash
pnpm go-live-smoke
```

Checks: home 200, admin login 200, Twilio verify file, legacy `/sign` 404, Documenso webhook rejects unsigned POST (401 or 503), Google OAuth redirect (302 not 503).

**Latest run (2026-06-20, `4946376` on `main`):**

| Check | Result |
|-------|--------|
| Marketing home | PASS 200 |
| Admin login page | PASS 200 |
| Twilio domain verify | PASS 200 |
| Legacy sign blocked | PASS 404 |
| Documenso webhook unsigned | PASS 503 (secret not set — expect 401 after C8) |
| Google OAuth configured | **FAIL 503** — set C2–C4 on Cloud Run |

Manual E2E still required after env set: Google SSO, agreement send/sign, Gmail, Xero DRAFT, Twilio voice.

---

## Current session log

```
Handoff 2026-06-21 → see outstanding.md (next: gcloud Cloud Run env + GOOGLE OAuth)
GCP project: exalted-splicer-499401-e2
Cloud SQL: free-trial-first-project / seamvex_crm CREATED
Xero app: seamvex-portal (0/5 connections)
Cloud Run env: NOT APPLIED YET
```
