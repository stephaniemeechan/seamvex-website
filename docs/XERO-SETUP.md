# Xero org setup (Section B)

Complete after app code is running locally and Google SSO works.

## 1. Connect OAuth

1. Open **Admin → Settings → Connect Xero**
2. Sign in to the **Seamvex** organisation only (disconnect test orgs in Xero if needed)
3. Confirm redirect to `/admin/settings?xero=connected`

## 2. Xero Developer app

At https://developer.xero.com/app/manage:

| Setting | Value |
|---------|-------|
| Redirect URI (prod) | `https://seamvex.com/api/xero/callback` |
| Redirect URI (dev) | `http://localhost:3000/api/xero/callback` |
| Scopes | openid, profile, email, offline_access, accounting.contacts, accounting.contacts.read, accounting.transactions, accounting.settings.read |

## 3. Xero organisation settings (browser)

- **Legal name:** Seamvex Data Systems Ltd
- **Trading name:** Seamcor (where supported)
- **VAT:** GB standard rate configured
- **Items:** Map Seamcor SKUs to Xero Items (match `lib/proposals/catalogue.ts`)
- **Account code:** Set `XERO_SALES_ACCOUNT_CODE` in env (default `200`)
- **Invoices:** Create as **DRAFT** for Stephanie review before send
- **Invoice email:** Configure sender in Xero (not Gmail)

## 4. Sync and verify

```bash
# Or use Settings → Sync contacts from Xero
curl -X POST -b cookies http://localhost:3000/api/xero/sync
```

1. Contacts list matches prior Xero export
2. Create test order → generate contract → send
3. Sign via Documenso (or legacy `/sign/[token]` in development without Documenso)
4. Confirm **DRAFT** invoice in Xero with correct lines

## 5. Import customers (greenfield)

```bash
pnpm reset-crm-data --import-xero
```

Sets contact status: **inactive** until a signed contract exists.
