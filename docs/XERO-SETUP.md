# Xero org setup (Section B)

Production only for go-live. Run after Cloud Run env (GET-READY §C) and Xero redirect (GET-READY §D3) are set, then Google SSO works on `seamvex-website-2`.

**Manual** — not automated by deploy.

## Recorded (go-live session 2026-06-20)

| Item | Value |
|------|-------|
| Xero org | **seamvex data systems ltd** (new — empty, setup 1/6) |
| Developer app name | **seamvex-portal** |
| App status | Created — **0 of 5 connections** (not connected yet) |
| Company URL | `https://seamvex.com` ✓ |
| OAuth redirect (prod) | `https://seamvex.com/api/xero/callback` |
| Client ID | *(set in Cloud Run C10 — do not commit)* |
| Client Secret | *(Secret Manager / Cloud Run C11 — do not commit)* |
| Sales account code | TBD — verify in Xero chart (default in code: `200`) |
| Customer migration | Pending — exported customer list; decide import path at E1 |

**Two-way sync (how code works):**

- **Xero → CRM:** Settings → **Sync contacts from Xero** (`POST /api/xero/sync`)
- **CRM → Xero:** Admin creates/edits contact → pushes to Xero Contacts API
- **Invoices:** Documenso sign webhook → **DRAFT** invoice (free-text line descriptions; **not** Xero Item codes)

## 1. Connect OAuth

1. Open **Admin → Settings → Connect Xero** (after Google login works in prod)
2. Authorise **seamvex data systems ltd** only — if Xero shows multiple orgs, pick only this one
3. Confirm redirect to `/admin/settings?xero=connected`
4. First connected tenant is **auto-locked** — no org picker in UI

## 2. Xero Developer app

At https://developer.xero.com/app/manage — app **seamvex-portal**:

| Setting | Value |
|---------|-------|
| Type | Web app |
| Company URL | `https://seamvex.com` |
| Redirect URI (prod) | `https://seamvex.com/api/xero/callback` |
| Scopes | openid, profile, email, offline_access, accounting.contacts, accounting.contacts.read, accounting.transactions, accounting.settings.read |

Scopes are requested by code (`lib/xero/client.ts` `XERO_SCOPES`) — no extra scopes needed in the portal UI for Web app.

## 3. Xero organisation settings (browser)

- **Legal name:** Seamvex Data Systems Ltd *(matches org)*
- **Trading name:** Seamcor (where supported)
- **VAT:** GB standard rate — configure in Xero setup guide
- **Chart of accounts:** Confirm sales account code exists; set `XERO_SALES_ACCOUNT_CODE` on Cloud Run (default `200`)
- **Items (optional):** CRM invoices use **description text** from the proposal catalogue, not Xero Item codes — create Items in Xero only if you want them for manual bookkeeping
- **Invoices:** CRM creates **DRAFT** for review before send
- **Invoice email:** Configure sender in Xero (not Gmail)

## 4. Sync and verify

1. **Settings → Sync contacts from Xero** (or `POST /api/xero/sync` when logged in as admin)
2. Create test order → generate contract → send
3. Customer signs via **Documenso** at `sign.seamvex.com` (prod — legacy `/sign` does **not** create Xero invoices)
4. Confirm **DRAFT** invoice in Xero with correct line descriptions

## 5. Customer list (greenfield + export)

**Ask before running** — depends on where master data lives:

| Situation | Action |
|-----------|--------|
| Export is CRM seed data, Xero empty | `pnpm reset-crm-data --import-xero` on a machine with `DATABASE_URL` pointing at prod Postgres, **or** import then push contacts to Xero via admin saves |
| Contacts already in Xero | Sync from Xero only |
| Both empty | Import export into CRM first, then push to Xero |

Import reads `xero-customers-export.json` (`organisations[].agreementSnapshots`). Sets contact status **inactive** until a signed contract exists.
