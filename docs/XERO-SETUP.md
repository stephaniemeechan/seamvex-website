# Xero org setup

**Manual** — not automated by deploy. Go-live: [`GO-LIVE.md`](./GO-LIVE.md).

## Current status (2026-06-29)

| Item | Value |
|------|-------|
| Xero org | **seamvex data systems ltd** |
| Developer app | **seamvex-portal** |
| OAuth in prod | **Connected** (tokens in DB; Settings shows connected) |
| `XERO_*` on Cloud Run | **Set** |
| `XERO_SALES_ACCOUNT_CODE` | `200` |
| CRM contacts | **43 imported** — **do not re-run** bulk import |
| Sign → DRAFT invoice | **Blocked** until Documenso live (webhook creates invoice) |

**Two-way sync (how code works):**

- **Xero → CRM:** Settings → **Sync contacts from Xero** (`POST /api/xero/sync`)
- **CRM → Xero:** Admin **New contact** / contact **Save** (`POST` / `PATCH /api/contacts/[id]`)
- **Invoices:** Documenso sign webhook → **DRAFT** invoice (free-text line descriptions; **not** Xero Item codes). Portal reads invoice status/amount due (`accounting.invoices.read`).
- **Contact persons:** Primary on Xero header; up to 5 additional in `ContactPersons[]`.

## 1. Connect OAuth (done in prod)

If reconnecting:

1. Confirm `XERO_*` on Cloud Run (console)
2. **Admin → Settings → Connect Xero**
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
| Scopes | openid, profile, email, offline_access, accounting.contacts, accounting.contacts.read, accounting.invoices, accounting.invoices.read, accounting.settings.read |

**New Xero apps (March 2026+):** do not request deprecated `accounting.transactions` or `accounting.transactions.read` — OAuth returns `invalid_scope`.

Scopes are requested by code (`lib/xero/client.ts` `XERO_SCOPES`).

Verify `XERO_CLIENT_SECRET` in Cloud Run console — typo `KVlt` vs `KVIt` breaks OAuth.

## 3. Xero organisation settings (browser)

- **Legal name:** Seamvex Data Systems Ltd
- **Trading name:** Seamcor (where supported)
- **VAT:** GB standard rate
- **Chart of accounts:** Confirm sales account; `XERO_SALES_ACCOUNT_CODE=200` on Run
- **Items (optional):** CRM uses description text from proposal catalogue, not Xero Item codes
- **Invoices:** CRM creates **DRAFT** for review
- **Invoice email:** Configure sender in Xero (not Gmail)

## 4. Verify sign → DRAFT invoice (after Documenso live)

1. Create test order → generate contract → send
2. Customer signs via **Documenso** at `sign.seamvex.com` (legacy `/sign` does **not** create Xero invoices in prod)
3. Confirm **DRAFT** invoice in Xero

**Blocked until:** Documenso live + real `DOCUMENSO_API_KEY`.

## 5. Customer import (done — do not re-run)

**43 contacts** imported to prod CRM. Source: selective list from old Xero export. **12 excluded:** [`excluded-companies.md`](../excluded-companies.md).

**Do not re-run** bulk import against prod unless intentionally resetting CRM.

Import scripts were removed from repo; ongoing contact edits via Admin → Contacts.

Import sets contact status **inactive** until a signed contract exists.

**Deploy path:** `git push main` → Cloud Build → **`seamvex-website-2`**.
