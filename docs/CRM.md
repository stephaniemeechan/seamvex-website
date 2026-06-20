# Seamvex CRM

Internal CRM and agreement admin for Seamvex Data Systems Ltd (trading as Seamcor).

## Roles

| Role | Contacts | Contracts/orders | Tickets | Tasks |
|------|----------|------------------|---------|-------|
| **Admin** | Full CRUD + Xero sync | Create, send, void | Full | All |
| **Standard** | View all | View only | Create/manage | Own only |

Sign in with Google Workspace **`@seamvex.com`** only. First user matching `ADMIN_EMAIL` becomes admin.

Production Google SSO requires Cloud Run env (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`) — see [GET-READY.md](./GET-READY.md) §C.

## Workflows

### Contacts

- Sync from Xero: **Settings → Sync contacts** or `POST /api/xero/sync` (admin).
- **Active** = has a contract with rollout status `signed` or `live`.
- **Inactive** = no such contract.
- Per-contact: support info textarea, Google Drive attachment links (metadata only).

### Agreements

1. **New order** — pick Xero contact, build proposal.
2. **Generate contract** — PDF with legal lockup (`seamcor-legal.png`).
3. **Send** — creates Documenso envelope (if configured), Gmail **cover note** (not the full Stephanie letter) with signing link, CRM ticket + tasks.
4. **Sign** — customer signs via Documenso; webhook (`x-documenso-secret`) marks order signed, stores PDF in GCS (`gcs://…`) or local `data/pdfs/`, creates **DRAFT** Xero invoice.

Legacy `/sign/[token]` remains for local development when Documenso is not configured (`NODE_ENV=development` only).

### Email

- Sent from **`"Name (Seamcor)" <user@seamvex.com>`** via Gmail API (each user connects in Settings).
- On agreement send, the app uses the **short cover note** from `deploy/legal/customer-comms.md` (`coverNoteAgreement`), plus a plain-text signing link — **not** the full “Email body (Stephanie)” letter (that template is for manual customer transition emails).
- Merge fields: `[Name]`, `[Name / team]`, `[company]`, `[document]`, `[documentNumber]`, `[accountsEmail]`, `[signingLink]`.
- Gmail thread ID is stored on the agreement ticket for follow-up.
- Invoices: send from **Xero**, not Gmail.

### Voice (Twilio)

- **Voice only — no SMS** in v1.
- Outbound click-to-call from contact/ticket detail (rings CRM user, then customer).
- Inbound to company line (`TWILIO_PHONE_NUMBER`) simulrings users with **Receive inbound calls**; after-hours routes to on-call mobile.
- Hours, greetings, ring group, and no-answer behaviour: **Admin → Settings** (`voice_config` in DB).
- Twilio Console: **A call comes in** → `POST https://seamvex.com/api/twilio/voice/inbound`.

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
- Invoices created as **DRAFT** for review in Xero.

See [Xero org setup](#xero-org-setup-after-oauth) below.

## Local development

```bash
docker compose up -d postgres   # optional Postgres
pnpm sync-legal-bundle
cp .env.local.example .env.local
pnpm dev
```

SQLite is used when `DATABASE_URL` is unset. Postgres when set.

Greenfield reset:

```bash
pnpm reset-crm-data
pnpm reset-crm-data --import-xero   # after export-xero-customers
```

Production smoke (automated): `pnpm go-live-smoke` — see [GET-READY.md](./GET-READY.md).

## Xero org setup (after OAuth)

1. Connect in **Admin → Settings → Connect Xero**.
2. Xero Developer app: add redirect URI for prod + localhost; scopes include contacts + transactions.
3. In Xero UI: legal name Seamvex Data Systems Ltd; verify VAT; map Items to product SKUs; DRAFT invoice policy.
4. **Sync contacts**; verify test order → send → sign → DRAFT invoice.

## Domains

| Domain | Use |
|--------|-----|
| seamvex.com | App, Google SSO, Gmail send |
| seamcor.com | Website (Cloudflare); email still M365 until migrated |

App never sends `@seamcor.com` in v1.

## Out of scope (v1)

- SMS (Twilio voice only)
- Cashflow / overdue reporting dashboard
- Invoice paid polling
