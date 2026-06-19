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
| Documenso optional on send | **Requires** `DOCUMENSO_API_KEY` + `DOCUMENSO_WEBHOOK_SECRET` |

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
| Settings (Xero, users, resources edit) | Yes | **No** (redirect) |
| Resources page (Drive links) | Yes | **No** (admin only) |
| Contact Drive attachments | Add/remove | View only |

**Signing (production):** Documenso CE → webhook → GCS PDF → Xero DRAFT invoice → ticket activity.

**Email:** Gmail API as action user `"Name (Seamcor)" <user@seamvex.com>` on agreement send; thread linked to ticket.

**Not in v1:** cashflow, overdue reporting, invoice paid polling.

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
| Documenso webhook secret (timing-safe) | `app/api/documenso/webhook/route.ts` |
| Twilio webhook signature | `app/api/twilio/webhook/route.ts` |

---

## Production environment (required)

Set in Cloud Run / Secret Manager — see [`docs/DEPLOY.md`](docs/DEPLOY.md):

```
SESSION_SECRET
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI
DATABASE_URL
GCS_BUCKET
DOCUMENSO_API_URL / DOCUMENSO_API_KEY / DOCUMENSO_WEBHOOK_SECRET
XERO_CLIENT_ID / XERO_CLIENT_SECRET / XERO_REDIRECT_URI
TWILIO_* (if using SMS/voice)
NEXT_PUBLIC_APP_URL=https://seamvex.com
ADMIN_EMAIL=s.meechan@seamvex.com
```

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

---

## Documentation

| File | Contents |
|------|----------|
| [`docs/IMPLEMENTATION-CHECKLIST.md`](docs/IMPLEMENTATION-CHECKLIST.md) | Watertight checklist vs plan (39 items) |
| [`docs/CRM.md`](docs/CRM.md) | Workflows, roles, integrations |
| [`docs/XERO-SETUP.md`](docs/XERO-SETUP.md) | **Manual** — Section B after OAuth |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | **Manual** — Section C Cloud Run |
| [`docs/PROPOSALS.md`](docs/PROPOSALS.md) | Agreement PDF workflow |
| [`e-sign.md`](e-sign.md) | Documenso CE deploy |

---

## Domains

| Domain | Role |
|--------|------|
| **seamvex.com** | App host, Google SSO, Gmail send (`@seamvex.com`) |
| **seamcor.com** | Marketing site (Cloudflare); email stays M365 until you migrate |

App does **not** send from `@seamcor.com` in v1.

---

## Manual steps you still must do

1. **Section B** — [`docs/XERO-SETUP.md`](docs/XERO-SETUP.md): connect Xero, map Items, verify test sign → DRAFT invoice
2. **Section C** — [`docs/DEPLOY.md`](docs/DEPLOY.md): Cloud SQL, GCS, Secret Manager, deploy `seamvex-website` + `seamvex-documenso` on `sign.seamvex.com`
3. **Commit** `deploy/legal/` and `public/logos/` after `pnpm sync-legal-bundle`
4. **Greenfield** (when ready): `pnpm reset-crm-data --import-xero`

---

## Known limitations (facts)

- **Edge middleware** imports `crypto` via `lib/auth/security.ts` — build warns; works today but may need Edge-safe rate limit later.
- **Standard users** cannot access Settings/Resources pages (admin only); Gmail connect for ticket email is admin-focused on agreement send.
- **Documenso customer email** disabled via `distributionMethod: "NONE"` — verify once with real Documenso CE instance.
- **Contact `live` status** — rule includes `live` rollout status but app only sets `signed` today; inactive/active still works via `signed`.
