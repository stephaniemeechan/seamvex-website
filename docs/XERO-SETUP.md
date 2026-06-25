# Xero org setup (Section B)

Production only for go-live. Run after Google login E2E works and Xero vars are on Cloud Run (GET-READY §C-C, §D3).

**Manual** — not automated by deploy.

## Recorded (2026-06-21)

| Item | Value |
|------|-------|
| Xero org | **seamvex data systems ltd** (new — empty) |
| Developer app name | **seamvex-portal** |
| App status | Created — **0 of 5 connections** (not connected in prod) |
| Company URL | `https://seamvex.com` |
| OAuth redirect (prod) | `https://seamvex.com/api/xero/callback` |
| Client ID / Secret on Run | **Not set yet** (GET-READY C13–C15) |
| Sales account code | TBD — default in code: `200` |
| Customer migration | Pending — decide import path before `reset-crm-data` |

**Two-way sync (how code works):**

- **Xero → CRM:** Settings → **Sync contacts from Xero** (`POST /api/xero/sync`)
- **CRM → Xero:** Admin creates/edits contact → pushes to Xero Contacts API
- **Invoices:** Documenso sign webhook → **DRAFT** invoice (free-text line descriptions; **not** Xero Item codes)

## 1. Connect OAuth

1. Add `XERO_*` to Cloud Run (regenerate env YAML or console)
2. Open **Admin → Settings → Connect Xero** (after Google login works in prod)
3. Authorise **seamvex data systems ltd** only
4. Confirm redirect to `/admin/settings?xero=connected`
5. First connected tenant is **auto-locked**

## 2. Xero Developer app

At https://developer.xero.com/app/manage — app **seamvex-portal**:

| Setting | Value |
|---------|-------|
| Type | Web app |
| Company URL | `https://seamvex.com` |
| Redirect URI (prod) | `https://seamvex.com/api/xero/callback` |
| Scopes | openid, profile, email, offline_access, accounting.contacts, accounting.contacts.read, accounting.invoices, accounting.settings.read |

Scopes are requested by code (`lib/xero/client.ts` `XERO_SCOPES`).

## 3. Xero organisation settings (browser)

- **Legal name:** Seamvex Data Systems Ltd
- **Trading name:** Seamcor (where supported)
- **VAT:** GB standard rate
- **Chart of accounts:** Confirm sales account; set `XERO_SALES_ACCOUNT_CODE` on Run (default `200`)
- **Items (optional):** CRM uses description text from proposal catalogue, not Xero Item codes
- **Invoices:** CRM creates **DRAFT** for review
- **Invoice email:** Configure sender in Xero (not Gmail)

## 4. Sync and verify

1. **Settings → Sync contacts from Xero**
2. Create test order → generate contract → send
3. Customer signs via **Documenso** at `sign.seamvex.com` (legacy `/sign` does **not** create Xero invoices in prod)
4. Confirm **DRAFT** invoice in Xero

**Blocked until:** Documenso live, Xero connected, login E2E done.

## 5. Customer list (greenfield + export)

**Ask before running** — depends on where master data lives:

| Situation | Action |
|-----------|--------|
| Export is CRM seed data, Xero empty | `pnpm reset-crm-data --import-xero` against prod Postgres, **or** import then push via admin saves |
| Contacts already in Xero | Sync from Xero only |
| Both empty | Import export into CRM first, then push to Xero |

Import reads `xero-customers-export.json` (`organisations[].agreementSnapshots`). Sets contact status **inactive** until a signed contract exists.
