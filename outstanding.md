# Outstanding — production facts

**Updated:** 2026-06-25  
**Live:** `seamvex-website-2` · `europe-west1` · https://seamvex.com  
**GCP project:** `exalted-splicer-499401-e2`

---

## Working now

| Item | Fact |
|------|------|
| Site + admin | Live; Google SSO login works |
| Cloud SQL | `seamvex_crm` on `free-trial-first-project` |
| Gmail | Connected in Settings (send uses your @seamvex.com mailbox) |
| Domains | `seamvex.com`, `www`, `seamcor.com`, `www` → `seamvex-website-2` |
| Legacy `/sign` | Blocked in prod (404) — by design |

---

## Do next — Xero (in progress)

Cloud Run needs these vars (then **Deploy**):

| Name | Value |
|------|--------|
| `XERO_CLIENT_ID` | From Xero app Connection tab |
| `XERO_CLIENT_SECRET` | From Xero app (copy exactly) |
| `XERO_REDIRECT_URI` | `https://seamvex.com/api/xero/callback` |
| `XERO_SALES_ACCOUNT_CODE` | `200` |

Also fix on Run if wrong: `ADMIN_EMAIL=s.meechan@seamvex.com,j.cyprus@seamvex.com`

Then:

1. https://seamvex.com/admin/settings → **Connect Xero**
2. Authorise **seamvex data systems ltd** only (new empty org)
3. **Sync contacts** or selective import (see below)

Xero app: **seamvex-portal** (or replacement web app) · redirect `https://seamvex.com/api/xero/callback` only — no localhost.

Scopes needed: `accounting.contacts`, `accounting.contacts.read`, `accounting.settings.read`, `accounting.invoices` (+ `offline_access` if offered).

---

## Do next — customer contacts

- Export on disk: `xero-customers-export.json` / `.csv` — **131 customers**, two old orgs (not the new Xero org).
- Import **selected** only — do not import all 131.
- Old `xeroContactId` values are invalid in the new org; strip on import.

```bash
pnpm reset-crm-data --import-xero --include-csv=xero-import-selected.csv --strip-xero-ids
```

Run against prod Postgres only when ready. Build shortlist CSV from `xero-customers-export.csv` (`companyName` column).

---

## Deferred — agreement sign (Documenso)

**Skipped for now.** Prod cannot send/sign agreements until this is done:

| Need | Detail |
|------|--------|
| Documenso service | Deploy to `sign.seamvex.com` (separate Cloud Run + Postgres) — [`e-sign.md`](e-sign.md) |
| Main app env | Replace `DOCUMENSO_API_KEY=pending` with real key from Documenso |
| Webhook in Documenso | `https://seamvex.com/api/documenso/webhook` · header `x-documenso-secret` = same as `DOCUMENSO_WEBHOOK_SECRET` on Run |
| GCS IAM | Run SA needs `storage.objectUser` on `seamvex-contracts-eu` (for signed PDFs after webhook) |

Until then: proposals + contract PDFs work; **Send for signature** fails in prod.

---

## Deferred — later

| Item | Notes |
|------|--------|
| Twilio voice | `TWILIO_*` on Run + webhook on `+441870470573` |
| Deploy code on `main` | Prod UI still shows old “`.env.local`” Xero message until next deploy; fix is in repo |
| Cloud Build trigger | `git push` → `cloudbuild.yaml` → `seamvex-website-2` — create if push does not deploy |
| GCS IAM | Verify before first signed PDF (Documenso path) |

---

## IDs (non-secret)

| What | Value |
|------|--------|
| Cloud SQL | `exalted-splicer-499401-e2:europe-west1:free-trial-first-project` |
| GCS bucket | `seamvex-contracts-eu` |
| Xero redirect | `https://seamvex.com/api/xero/callback` |
| Documenso API URL | `https://sign.seamvex.com/api/v2` |
| Twilio number | `+441870470573` |

Secrets stay in Cloud Run / `.env.local` — not in git.

---

## Docs

| File | Use |
|------|-----|
| [`docs/XERO-SETUP.md`](docs/XERO-SETUP.md) | Xero org + connect |
| [`e-sign.md`](e-sign.md) | Documenso when ready |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Cloud Run deploy |
| [`deploy/apply-xero-env.ps1`](deploy/apply-xero-env.ps1) | Apply Xero vars via `gcloud` (after `gcloud auth login`) |
