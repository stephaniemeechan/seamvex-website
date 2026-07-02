# Seamvex CRM

Internal CRM and agreement admin for Seamvex Data Systems Ltd (trading as Seamcor).

**Production:** `seamvex-website-2` · `europe-west1` · domains on `seamvex.com` / `seamcor.com`. Go-live: [GO-LIVE.md](./GO-LIVE.md). Deploy: [DEPLOY.md](./DEPLOY.md).

## Roles

| Role | Contacts | Contracts/orders | Tickets | Tasks |
|------|----------|------------------|---------|-------|
| **Admin** | Full CRUD + Xero sync | Create, send, resend, void | Full | All |
| **Standard** | View all | View only | Create/manage | Own only |

Sign in with Google Workspace **`@seamvex.com`** only at **https://seamvex.com/admin/login**. Emails listed in `ADMIN_EMAIL` get **admin** on first sign-in; other `@seamvex.com` users get **standard** (`lib/crm/users.ts`).

Production Google SSO requires Cloud Run env (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`) — **working in prod**.

## Workflows

### Contacts

- **43 contacts imported** in prod — **do not re-run** bulk import.
- Sync from Xero: **Settings → Sync contacts** or `POST /api/xero/sync` (admin). Xero **connected** — seamvex data systems ltd.
- **Active** = has a contract with rollout status `signed` or `live`.
- **Inactive** = no such contract.
- Per-contact: support info textarea, Google Drive attachment links (metadata only).

### Agreements

1. **New order** — pick Xero contact, build proposal (types: new, amendment, renewal).
2. **Generate contract** — PDF with legal lockup (`seamcor-legal.png`).
3. **Send** — creates Documenso envelope (when live), Gmail **cover note** with signing link, CRM ticket + tasks.
4. **Resend** — refresh Documenso URL / re-email cover note (when order `sent`; admin only).
5. **Sign** — customer signs via Documenso; webhook (`x-documenso-secret`) marks order signed, stores PDF in GCS, creates **DRAFT** Xero invoice.

**Prod status:** Documenso live; webhook → CRM fix in repo — deploy then Resend webhook for signed orders.

Legacy `/sign/[token]` — local development only when Documenso is not configured (`NODE_ENV=development`).

**Order statuses:** `proposal` → `contract` → `sent` → `signed` (or `void`). Only **proposal** is editable.

**PDF types:**

| PDF | Route | When |
|-----|-------|------|
| Proposal | `GET /api/orders/[id]/proposal-pdf` | Draft proposal |
| Contract | `GET /api/orders/[id]/pdf` | After generate contract |
| Signed | `GET /api/orders/[id]/signed-pdf` | After signing (GCS in prod) |
| DPA | `GET /api/orders/[id]/dpa` | Fully Managed |
| Privacy | `GET /api/orders/[id]/privacy` | Fully Managed |

PDF layout code: `lib/proposals/pdf-theme.ts`, `pricing-tables.tsx`, `proposal-document.tsx`, `pdf-document.tsx`.

**Data:** local SQLite `data/proposals.db` or Postgres via `DATABASE_URL`; production Cloud SQL `seamvex_crm` + GCS `seamvex-contracts-eu`.

### Email

- Sent from **`"Name (Seamcor)" <user@seamvex.com>`** via Gmail API (each user connects in Settings).
- On agreement send, the app uses the **short cover note** from `deploy/legal/customer-comms.md` (`coverNoteAgreement`), plus a plain-text signing link.
- Merge fields: `[Name]`, `[Name / team]`, `[company]`, `[document]`, `[documentNumber]`, `[accountsEmail]`, `[signingLink]`.
- Gmail thread ID is stored on the agreement ticket for follow-up.
- Invoices: send from **Xero**, not Gmail.

### Voice (Twilio)

- **Voice only — no SMS** in v1.
- Outbound click-to-call from contact/ticket detail (rings CRM user, then customer).
- Inbound to company line (`+441870470573`) simulrings users with **Receive inbound calls**; after-hours routes to on-call mobile.
- Hours, greetings, ring group, and no-answer behaviour: **Admin → Settings** (`voice_config` in DB).
- Twilio Console: **A call comes in** → `POST https://seamvex.com/api/twilio/voice/inbound`.
- **`TWILIO_*` on Run** — set. Inbound webhook configured. **Voice E2E not tested** — configure personal **My phone** (not company line) and routing in Settings.

### Tickets & tasks

- Auto-created on agreement send.
- Twilio **voice** calls logged on ticket activity feed (no SMS).

### Resources

- **Settings → Resources** — curated Drive folder links (insurance, marketing, etc.).
- Not stored in app; links only.

## Legal deploy bundle

Production uses `deploy/legal/` (copied from gitignored `branding/legal/`):

```bash
pnpm sync-legal-bundle   # after editing branding/
pnpm check-legal-bundle  # CI / Docker build
```

Required files listed in `scripts/check-legal-bundle.ts`.

## Xero mapping

- Single Seamvex org only; extra tenants rejected when locked.
- Contact fields map 1:1 to Xero Contacts API.
- Invoice line items use order `lines_json`; account code from `XERO_SALES_ACCOUNT_CODE` (default `200`).
- Invoices created as **DRAFT** on Documenso sign webhook.

See [XERO-SETUP.md](./XERO-SETUP.md).

## Local development

```bash
docker compose up -d postgres   # optional Postgres
pnpm sync-legal-bundle
cp .env.local.example .env.local
pnpm dev
```

SQLite is used when `DATABASE_URL` is unset. Postgres when set.

Production smoke: `pnpm go-live-smoke` — HTTP/route checks only.

## Domains

| Domain | Use |
|--------|-----|
| seamvex.com | App, Google SSO, Gmail send |
| sign.seamvex.com | Documenso (live) |
| seamcor.com | Website (Cloudflare) |

App never sends `@seamcor.com` in v1.

## Out of scope (v1)

- SMS (Twilio voice only)
- Cashflow / overdue reporting dashboard
- Invoice paid polling
