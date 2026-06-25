# Get ready — local + Cloud Run

Work through this file **in order**. Mark each item when done.

**Status key:** `[ ]` not done · `[x]` done · `[!]` blocked (note why in Notes column)

Do **not** commit `.env.local`. It stays on your machine only.

## Production state (2026-06-21)

| Item | Status |
|------|--------|
| Cloud Run **`seamvex-website-2`** (europe-west1) | **Live** — rev `00020-crd` @ `9419bc9` |
| Domain mappings | **Active** — HTTPS 200 |
| Cloud Run env (12 vars) | **Applied** — OAuth 307, smoke 6/6 |
| Cloud Build trigger | **Misconfigured** — push updates ew2 orphan only; use `deploy/deploy-live.ps1` |
| Documenso at `sign.seamvex.com` | **Not deployed** |
| Orphan `seamvex-website` (ew2) | **Deleted** 2026-06-21 — create ew1 trigger next |
| Admin emails on Run | **Both** `s.meechan@seamvex.com`, `j.cyprus@seamvex.com` (verified on rev `00020-crd`) |
| Admin login E2E | **Verify in browser** |

**Deploy after push:** `.\deploy\deploy-live.ps1` then `pnpm go-live-smoke`. See [DEPLOY.md](./DEPLOY.md).

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
| A12 | `.env.local` has Xero vars if you test Xero locally (`XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REDIRECT_URI=http://localhost:3000/api/xero/callback`) | [!] | Keys exist; **values empty** — get from Xero developer app **seamvex-portal** |
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
| B6 | Commit | [x] | Through `9419bc9` (OAuth redirect fix) |
| B7 | Push to `main` | [x] | Latest: `9419bc9` on `origin/main` |
| B8 | Live service updated after push | [!] | Push builds **ew2 orphan only** — run `deploy/deploy-live.ps1` after each push until trigger fixed |

**Key repo commits (done — do not re-do):**

| Commit | What |
|--------|------|
| `9419bc9` | OAuth redirects use public URL on Cloud Run (`lib/request-url.ts`) |
| `0cf22c5` | `deploy/generate-prod-env.mjs`, env apply scripts |
| `d1531a5` | `cloudbuild.yaml` → **`seamvex-website-2`**; `PROD_REQUIRED` env gate |

---

## C — Google Cloud Run env (`seamvex-website-2`, region `europe-west1`)

Set via **Cloud Run → Variables & secrets** or `deploy/generate-prod-env.mjs` + `deploy/apply-prod-env.ps1`.

### C-A — `PROD_REQUIRED` (10 vars, `lib/env.ts`)

| # | Variable | Status | Notes |
|---|----------|--------|-------|
| C1 | `SESSION_SECRET` | [x] | Applied rev `00019-nbr` |
| C2 | `GOOGLE_CLIENT_ID` | [x] | Applied |
| C3 | `GOOGLE_CLIENT_SECRET` | [x] | Applied |
| C4 | `GOOGLE_REDIRECT_URI` | [x] | `https://seamvex.com/api/auth/google/callback` |
| C5 | `DATABASE_URL` | [x] | Cloud SQL `seamvex_crm` — **connectivity verified at login E2E only** |
| C6 | `GCS_BUCKET` | [x] | `seamvex-contracts-eu` — **IAM not verified** |
| C7 | `DOCUMENSO_API_KEY` | [!] | `pending` until Documenso deployed |
| C8 | `DOCUMENSO_WEBHOOK_SECRET` | [x] | Applied |
| C9 | `DOCUMENSO_API_URL` | [x] | `https://sign.seamvex.com/api/v2` |
| C10 | `NEXT_PUBLIC_APP_URL` | [x] | `https://seamvex.com` |

### C-B — Also applied (12 total from generator)

| # | Variable | Status | Notes |
|---|----------|--------|-------|
| C11 | `GMAIL_REDIRECT_URI` | [x] | `https://seamvex.com/api/gmail/connect/callback` |
| C12 | `ADMIN_EMAIL` | [x] | `s.meechan@seamvex.com,j.cyprus@seamvex.com` |

### C-C — Not on Run yet

| # | Variable | Status | Notes |
|---|----------|--------|-------|
| C13 | `XERO_CLIENT_ID` | [ ] | See [XERO-SETUP.md](./XERO-SETUP.md) |
| C14 | `XERO_CLIENT_SECRET` | [ ] | |
| C15 | `XERO_REDIRECT_URI` | [ ] | When Xero vars added |
| C16 | Google sign-in E2E | [ ] | Browser test after `9419bc9` / rev `00020-crd` |

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
| D1 | Google OAuth client: redirect `https://seamvex.com/api/auth/google/callback` | [x] | In GCP Credentials |
| D2 | Google OAuth client: Gmail redirect `https://seamvex.com/api/gmail/connect/callback` | [x] | In GCP Credentials |
| D3 | Xero app: add redirect `https://seamvex.com/api/xero/callback` | [ ] | Keep `http://localhost:3000/api/xero/callback` for local |
| D4 | Documenso service running at `sign.seamvex.com` | [ ] | See [e-sign.md](../e-sign.md) — **not deployed** (2026-06-21) |
| D5 | Documenso webhook URL: `https://seamvex.com/api/documenso/webhook` | [ ] | Header **`x-documenso-secret`** = `DOCUMENSO_WEBHOOK_SECRET`; configure after D4 |
| D6 | Cloud SQL connectivity from Run | [ ] | `DATABASE_URL` set in C5 — mark [x] after login E2E creates session in DB |
| D7 | GCS bucket + Run SA `storage.objectUser` | [ ] | C6 sets var only — IAM unverified; see [DEPLOY.md](./DEPLOY.md) |
| D8 | Twilio `+441870470573` voice webhook → `https://seamvex.com/api/twilio/voice/inbound` | [ ] | Twilio domain verify file passes smoke; voice webhook not verified |
| D9 | Create ew1 Cloud Build trigger + confirm orphan gone | [x] | Orphan + trigger **deleted** 2026-06-21 — **create trigger** per [DEPLOY.md](./DEPLOY.md) |

---

## E — After prod is live (manual, not blocking deploy)

| # | Task | Status | Notes |
|---|------|--------|-------|
| E1 | Section B in `docs/XERO-SETUP.md` — connect Xero, sync contacts, test sign → DRAFT invoice | [ ] | Blocked until C13–C15, D3, Documenso, login E2E |
| E2 | Connect Gmail per admin user in Settings | [ ] | Blocked until login E2E + C11 |
| E3 | `pnpm reset-crm-data --import-xero` when ready for greenfield | [ ] | Reads `organisations[].agreementSnapshots` from export; run only after E1 verified |

---

## Smoke tests (automated)

Run against production:

```bash
pnpm go-live-smoke
```

Checks: home 200, admin login 200, Twilio verify file, legacy `/sign` 404, Documenso webhook rejects unsigned POST (401), Google OAuth redirect (307 not 503).

**Does not test:** Google login callback, DB writes, GCS uploads, Xero, Documenso signing.

**Latest run (2026-06-21, `9419bc9` on `main`, rev `00020-crd`):**

| Check | Result |
|-------|--------|
| Marketing home | PASS 200 |
| Admin login page | PASS 200 |
| Twilio domain verify | PASS 200 |
| Legacy sign blocked | PASS 404 |
| Documenso webhook unsigned | PASS 401 |
| Google OAuth configured | PASS 307 |

Manual E2E still required: Google SSO login in browser, agreement send/sign, Gmail, Xero DRAFT, Twilio voice.

---

## Current session log

```
2026-06-21: Env applied (12 vars, rev 00019). OAuth redirect fix deployed (9419bc9, rev 00020).
Smoke 6/6. Deploy gap documented: push -> ew2 orphan only; use deploy/deploy-live.ps1.
Next: browser login E2E, fix Cloud Build trigger, Documenso, Xero.
```
