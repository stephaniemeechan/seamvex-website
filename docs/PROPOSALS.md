# Customer agreements admin

CRM and agreement tool at `/admin` for Seamvex customer rollout.

See **[CRM.md](./CRM.md)** for full CRM workflows (contacts, tickets, Gmail, Documenso, Twilio).

## Legal source

Agreement text is read from **`deploy/legal/`** in production (synced from gitignored `branding/legal/`):

```bash
pnpm sync-legal-bundle
```

PDF layout: `lib/proposals/pdf-theme.ts`, `pricing-tables.tsx`, `proposal-document.tsx`, `pdf-document.tsx`

## Access

**https://seamvex.com/admin/login** — Google SSO (`@seamvex.com` only).

Dev fallback: password login when `GOOGLE_CLIENT_ID` is unset.

## Workflow

1. **Connect Xero** (Settings) → pick customer from Xero contacts.
2. **New agreement** → order type, term, payment, line items → save **proposal**.
3. **Download proposal** → pricing PDF (ex VAT).
4. **Generate contract** → status `contract`.
5. **Send for signature** → Documenso envelope + Gmail cover note to customer; CRM ticket created.
6. Customer signs via Documenso link → webhook (`x-documenso-secret`) → signed PDF stored (GCS in prod) → **DRAFT invoice in Xero**.

Legacy `/sign/[token]` used only in development when Documenso is not configured (`NODE_ENV=development`).

## PDF types

| PDF | Route | When |
|-----|-------|------|
| Proposal | `GET /api/orders/[id]/proposal-pdf` | Draft proposal |
| Contract | `GET /api/orders/[id]/pdf` | After generate contract |
| Signed | `GET /api/orders/[id]/signed-pdf` | After signing (reads GCS via `readOrderPdf` in prod) |
| DPA | `GET /api/orders/[id]/dpa` | Fully Managed |
| Privacy | `GET /api/orders/[id]/privacy` | Fully Managed |

## Order statuses

`proposal` → `contract` → `sent` → `signed` (or `void`)

Only **proposal** is editable. Standard users cannot create/send/void.

## Xero

Redirect URI: `https://seamvex.com/api/xero/callback` (and localhost for dev)

Scopes include contacts + transactions. Single Seamvex org only.

## Data

- **Local:** SQLite `data/proposals.db` or Postgres via `DATABASE_URL`
- **Production:** Cloud SQL Postgres + GCS `seamvex-contracts-eu` for PDFs

Greenfield reset: `pnpm reset-crm-data [--import-xero]`
