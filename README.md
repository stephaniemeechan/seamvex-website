# Seamvex-website

Next.js marketing site + internal CRM/agreement admin for **Seamvex Data Systems Ltd** (trading as **Seamcor**).

**Plans:** chat refinements consolidated in [`docs/IMPLEMENTATION-CHECKLIST.md`](docs/IMPLEMENTATION-CHECKLIST.md).

---

## Quick start (local)

```bash
pnpm install
pnpm sync-legal-bundle          # copies branding/ → deploy/legal + public/logos (gitignored source)
cp .env.local.example .env.local
pnpm dev                        # http://localhost:3000/admin/login
```

Optional Postgres: `docker compose up -d postgres` + `DATABASE_URL=postgresql://seamvex:seamvex@localhost:5432/seamvex_crm`

Optional Documenso: `docker compose --profile documenso up -d` (creates `documenso` DB via init script)

---

## Local vs production (`NODE_ENV`)

`pnpm dev` sets `NODE_ENV=development`. Cloud Run / `pnpm build && pnpm start` uses `NODE_ENV=production`.

| Local (`pnpm dev`) | Production (`NODE_ENV=production`) |
|--------------------|-------------------------------------|
| SQLite OK (`DATABASE_URL` optional) | **Requires** `DATABASE_URL` (Postgres) |
| Local PDFs in `data/pdfs/` | **Requires** `GCS_BUCKET` |
| Password login if `GOOGLE_CLIENT_ID` unset | Google OAuth only; password login **403** |
| Legacy `/sign/[token]` if Documenso not configured | Legacy sign **404**; Documenso **required** |
| `SESSION_SECRET` falls back to `ADMIN_PASSWORD` | **Requires** `SESSION_SECRET` |
| Documenso optional on send | **Requires** `DOCUMENSO_API_URL` + `DOCUMENSO_API_KEY` + `DOCUMENSO_WEBHOOK_SECRET` |

Implementation: [`lib/env.ts`](lib/env.ts) — `legacySignAllowed()`, `passwordLoginAllowed()`, `documensoRequired()`, `assertProductionEnv()`.

**No silent prod fallbacks.** Missing required prod env vars throw on first database access (`ensureDb()`), not at process boot.

---

## What the CRM does

| Feature | Admin | Standard user |
|---------|-------|---------------|
| Google SSO `@seamvex.com` | Yes | Yes |
| View contacts, orders, contracts | Yes | Yes (read-only orders) |
| Create/send/void agreements | Yes | **No** (API + UI gated) |
| Manage tickets | Yes | Yes |
| Own tasks only | All tasks | Own assignee only |
| Settings (own phone, inbound calls, Xero/Gmail connect) | Yes | Yes |
| Settings (voice routing, Xero sync, users, resources edit) | Yes | No (sections hidden) |
| Voice (outbound click-to-call; inbound simulring) | Yes | Yes (set phone + **Receive inbound calls**) |
| Resources page (Drive links) | Yes | **No** (admin only) |
| Contact Drive attachments | Add/remove | View only |

**Signing (production):** Documenso CE → webhook → GCS PDF → Xero DRAFT invoice → ticket activity.

**Email:** Gmail API as action user `"Name (Seamcor)" <user@seamvex.com>` on agreement send; thread linked to ticket.

**Twilio (voice only — no SMS):** Outbound from contact/ticket detail (rings your phone, then customer). Inbound to company line simulrings CRM users with **Receive inbound calls**; after-hours routes to on-call mobile. Hours, greetings, ring group, and no-answer behaviour configured in **Admin → Settings** (`voice_config` in DB, not env).

**Not in v1:** SMS, cashflow, overdue reporting, invoice paid polling.

---

## Security (implemented)

| Control | Location |
|---------|----------|
| Session on `/admin/*` and `/api/*` | `middleware.ts` |
| CSRF on mutating API routes | `lib/auth/api-guards.ts` + `GET /api/auth/csrf` + `lib/api-client.ts` `csrfFetch` |
| Rate limit auth routes (20/min) | `middleware.ts` |
| Admin-only contract mutations | `requireAdminMutation` on order routes |
| Contact PATCH: standard = `supportInfo` only | `app/api/contacts/[id]/route.ts` |
| Xero OAuth: admin session + user cookie bind | `app/api/xero/connect`, `callback` |
| Single Xero tenant lock | `lib/xero/client.ts` `setLockedTenantId` |
| Legacy sign: non-production only, requires `status=sent` | `app/api/sign/[token]/*` |
| `signToken` stripped from order API in production | `sanitizeOrderForApi` / `sanitizeOrdersForApi` |
| Documenso webhook secret (header `x-documenso-secret`, timing-safe) | `app/api/documenso/webhook/route.ts` |
| Twilio voice webhooks (public routes, signature verified) | `middleware.ts` + `app/api/twilio/voice/*` |

---

## Production environment

Cloud Run service: **`seamvex-website-2`** (europe-west1). See [`docs/DEPLOY.md`](docs/DEPLOY.md).

**Production today (2026-06-21):** Rev `00020-crd` @ `9419bc9`. Env applied (12 vars). `pnpm go-live-smoke` **6/6**. After `git push`, run `deploy/deploy-live.ps1` (trigger only updates ew2 orphan). Documenso at `sign.seamvex.com` is **not deployed**.

**Required** — `lib/env.ts` `PROD_REQUIRED` (throws on first DB access if missing):

```
SESSION_SECRET
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI
DATABASE_URL
GCS_BUCKET
DOCUMENSO_API_URL / DOCUMENSO_API_KEY / DOCUMENSO_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL=https://seamvex.com
```

**Also set for full CRM** (not in `PROD_REQUIRED`):

```
GMAIL_REDIRECT_URI=https://seamvex.com/api/gmail/connect/callback
XERO_CLIENT_ID / XERO_CLIENT_SECRET / XERO_REDIRECT_URI
ADMIN_EMAIL=s.meechan@seamvex.com,j.cyprus@seamvex.com
TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER   # voice only
```

Gmail send is per-user OAuth (Settings → Connect Gmail). Google OAuth client needs redirect `https://seamvex.com/api/gmail/connect/callback` (and localhost for dev).

GCS: Cloud Run service account needs **`roles/storage.objectUser`** on the PDF bucket.

Voice routing (business hours, greetings, ring group, after-hours mobile) is stored in DB (`voice_config`), configured at `/admin/settings` — not env vars.

---

## Legal assets and PDFs

- Source (local, gitignored): `branding/legal/`, `branding/logos/`
- Deploy bundle (commit to git): `deploy/legal/`, `public/logos/` (PNG required for PDFs)
- Sync: `pnpm sync-legal-bundle` then `pnpm check-legal-bundle`
- Docker build runs `check-legal-bundle` before `next build`

Brand accent on PDFs: `#E5007D` ([`lib/brand.ts`](lib/brand.ts) `BRAND_COLORS.pink`).

---

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Local dev server |
| `pnpm build` | Production build (includes legal check) |
| `pnpm sync-legal-bundle` | Copy branding → deploy/public |
| `pnpm reset-crm-data` | Wipe agreements/tickets/contacts |
| `pnpm reset-crm-data --import-xero` | Wipe + import `xero-customers-export.json` |
| `pnpm export-xero-customers` | Export Xero contacts (PII, gitignored) |
| `pnpm go-live-smoke` | HTTP smoke tests against production (`https://seamvex.com`) |

---

## Documentation

| File | Contents |
|------|----------|
| [`docs/IMPLEMENTATION-CHECKLIST.md`](docs/IMPLEMENTATION-CHECKLIST.md) | Watertight checklist vs plan (39 items) |
| [`docs/CRM.md`](docs/CRM.md) | Workflows, roles, integrations |
| [`docs/XERO-SETUP.md`](docs/XERO-SETUP.md) | **Manual** — Section B after OAuth |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | **Manual** — Section C Cloud Run |
| [`outstanding.md`](outstanding.md) | **Start here** — what's left for go-live (manual GCP only) |
| [`docs/GET-READY.md`](docs/GET-READY.md) | **Manual** — ordered go-live checklist (local, deploy, Twilio) |
| [`docs/PROPOSALS.md`](docs/PROPOSALS.md) | Agreement PDF workflow |
| [`e-sign.md`](e-sign.md) | Documenso CE deploy (not live on `sign.seamvex.com` yet) |
| [`docs/DNS-SETUP.md`](docs/DNS-SETUP.md) | Domain mappings for seamvex.com + seamcor.com |

---

## Domains

| Domain | Role |
|--------|------|
| **seamvex.com** | App host, Google SSO, Gmail send (`@seamvex.com`) |
| **seamcor.com** | Marketing site (Cloudflare); email stays M365 until you migrate |

App does **not** send from `@seamcor.com` in v1.

---

## Manual steps you still must do

**Priority order** (see [`docs/GET-READY.md`](docs/GET-READY.md)):

1. **Login E2E** — [https://seamvex.com/admin/login](https://seamvex.com/admin/login) → Google SSO
2. **Deploy after push** — `.\deploy\deploy-live.ps1` (push only updates ew2 orphan until trigger fixed)
3. **Fix Cloud Build trigger** — use `/cloudbuild.yaml` → `seamvex-website-2` ew1; delete ew2 orphan
4. **Documenso CE** — [`e-sign.md`](e-sign.md): deploy on `sign.seamvex.com`
5. **GCS IAM** — bucket `seamvex-contracts-eu`, Run SA `storage.objectUser`
6. **Xero** — [`docs/XERO-SETUP.md`](docs/XERO-SETUP.md): connect org, sync, test sign → DRAFT invoice
7. **Twilio** — voice webhook + routing in `/admin/settings`
8. **Gmail** — each admin connects in Settings
9. **Greenfield** (when ready): `pnpm reset-crm-data --import-xero`

---

## Known limitations (facts)

- **Deploy trigger misconfigured** — `git push` updates ew2 orphan only; run `deploy/deploy-live.ps1` after push. See [`docs/DEPLOY.md`](docs/DEPLOY.md).
- **Documenso not deployed** — agreement send/sign blocked until `sign.seamvex.com` is live and `DOCUMENSO_API_KEY` is set.
- **Xero not connected in prod** — contacts/invoices need Xero vars on Run + org connect.
- **Edge middleware** imports `crypto` via `lib/auth/security.ts` — build warns; works today but may need Edge-safe rate limit later.
- **Standard users** cannot access the Resources page (admin only). Settings is open to all users (own phone + inbound toggle); voice routing, user phones, and resource links are admin-only sections.
- **Documenso customer email** disabled via `distributionMethod: "NONE"` — verify once with real Documenso CE instance.
- **Contact `live` status** — rule includes `live` rollout status but app only sets `signed` today; inactive/active still works via `signed`.
