# Customer agreements admin

CRM and agreement tool at `/admin` for Seamvex customer rollout.

See **[CRM.md](./CRM.md)** for full CRM workflows (contacts, tickets, Gmail, Documenso, Twilio).

**Prod status:** [`outstanding.md`](../outstanding.md) — login E2E pending; Documenso/Xero not live.

## Legal source

Agreement text is read from **`deploy/legal/`** in production (synced from gitignored `branding/legal/`):

```bash
pnpm sync-legal-bundle
```

PDF layout: `lib/proposals/pdf-theme.ts`, `pricing-tables.tsx`, `proposal-document.tsx`, `pdf-document.tsx`

## Access

**https://seamvex.com/admin/login** — Google SSO (`@seamvex.com` only). `/api/auth/google` returns **307** to Google when env is configured.

Dev fallback: password login when `GOOGLE_CLIENT_ID` is unset locally.

## Workflow

1. **Connect Xero** (Settings) → pick customer from Xero contacts. *(Not connected in prod yet.)*
2. **New agreement** → order type, term, payment, line items → save **proposal**.
3. **Download proposal** → pricing PDF (ex VAT).
4. **Generate contract** → status `contract`.
5. **Send for signature** → Documenso envelope + Gmail cover note; CRM ticket created. *(Blocked: `sign.seamvex.com` not deployed.)*
6. Customer signs via Documenso → webhook → signed PDF in GCS → **DRAFT invoice in Xero**.

Legacy `/sign/[token]` — development only when Documenso is not configured.

## PDF types

| PDF | Route | When |
|-----|-------|------|
| Proposal | `GET /api/orders/[id]/proposal-pdf` | Draft proposal |
| Contract | `GET /api/orders/[id]/pdf` | After generate contract |
| Signed | `GET /api/orders/[id]/signed-pdf` | After signing (GCS via `readOrderPdf` in prod) |
| DPA | `GET /api/orders/[id]/dpa` | Fully Managed |
| Privacy | `GET /api/orders/[id]/privacy` | Fully Managed |

## Order statuses

`proposal` → `contract` → `sent` → `signed` (or `void`)

Only **proposal** is editable. Standard users cannot create/send/void.

## Xero

Redirect URI: `https://seamvex.com/api/xero/callback` (and localhost for dev)

Scopes include contacts + invoices. Single Seamvex org only. See [XERO-SETUP.md](./XERO-SETUP.md).

## Data

- **Local:** SQLite `data/proposals.db` or Postgres via `DATABASE_URL`
- **Production:** Cloud SQL `seamvex_crm` + GCS `seamvex-contracts-eu`

Greenfield reset: `pnpm reset-crm-data [--import-xero]`

## Deploy

After code changes: `git push` → wait for ew2 build → `deploy/deploy-live.ps1`. See [DEPLOY.md](./DEPLOY.md).
