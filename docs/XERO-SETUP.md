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
- **CRM → Xero:** Admin **New contact** / contact **Save** (`POST` / `PATCH /api/contacts/[id]`), or `pnpm push-contacts-to-xero` after import
- **Invoices:** Documenso sign webhook → **DRAFT** invoice (free-text line descriptions; **not** Xero Item codes). Portal **reads** invoice status/amount due on order and contact pages (`accounting.transactions.read`).
- **Contact persons:** Primary on Xero header; up to 5 additional in `ContactPersons[]`. Import preserves full person lists from export JSON.

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
| Scopes | openid, profile, email, offline_access, accounting.contacts, accounting.contacts.read, accounting.invoices, accounting.settings.read, accounting.transactions.read |

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

## 5. Customer list (selective import)

Import **43 unique contacts** from the old Xero export — not all 131. Source list: [`list-of-companies.csv`](../list-of-companies.csv). Manifest: [`xero-import-selected.csv`](../xero-import-selected.csv). **12 excluded:** [`excluded-companies.md`](../excluded-companies.md).

| Step | Command / action |
|------|------------------|
| Regenerate manifest | `pnpm build-import-manifest` |
| Preflight (no DB) | `pnpm reset-crm-data --import-xero --include-csv=xero-import-selected.csv --strip-xero-ids --dry-run` |
| Prod CRM import | `pnpm reset-crm-data --import-xero --include-csv=xero-import-selected.csv --strip-xero-ids` (prod `DATABASE_URL`) |
| Push to new Xero org | `pnpm push-contacts-to-xero --include-csv=xero-import-selected.csv` (after OAuth connect) |
| Ongoing edits | Admin → Contacts → **New contact** or open contact → **Save contact** |

**Export files:** import reads **`xero-customers-export.json` only**. CSV is for validation; MD is human reference.

**Rules:**

- Westland Driffield + Ellesmere → one contact (`Westland Horticulture Limited`).
- Puratos (Liverpool) skipped — export has Puratos (Buckingham) only.
- When the same company appears in both old orgs, prefer **Seamcor Limited**.
- Strip old `xeroContactId` on import (`--strip-xero-ids`) — IDs from old orgs are invalid in **seamvex data systems ltd**.

**Deploy path:** develop locally → `git push main` → Cloud Build → **`seamvex-website-2`**. Run import/push against prod Cloud SQL, not local SQLite.

Import sets contact status **inactive** until a signed contract exists.
