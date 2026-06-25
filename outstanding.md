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
3. Selective import + push (see below)

Xero app: **seamvex-portal** (or replacement web app) · redirect `https://seamvex.com/api/xero/callback` only — no localhost.

Scopes needed: `accounting.contacts`, `accounting.contacts.read`, `accounting.settings.read`, `accounting.invoices`, `accounting.invoices.read` (+ `offline_access` if offered). **Do not** use deprecated `accounting.transactions.read` on new Xero apps (March 2026+).

### Xero contacts — two-way sync (code facts)

| Direction | How | Status |
|-----------|-----|--------|
| **Xero → CRM** | Settings → **Sync contacts from Xero** (`POST /api/xero/sync`) | Implemented |
| **CRM → Xero (create)** | Admin **New contact** or `POST /api/contacts` | Implemented |
| **CRM → Xero (update)** | Admin contact **Save** or `PATCH /api/contacts/[id]` | Implemented |
| **Export** | `pnpm export-xero-customers` | Read-only |
| **Import to CRM** | `pnpm reset-crm-data --import-xero …` | Does **not** push to Xero |
| **Bulk push** | `pnpm push-contacts-to-xero` | Creates contacts in new Xero org |

**Deploy path:** local dev → `git push main` → Cloud Build → **`seamvex-website-2`**. Import/push run against **prod Cloud SQL**, not local SQLite — no local DB as acceptance test.

**Contact persons (Xero parity):** One CRM contact = one Xero company. Primary person on header fields; up to 5 additional people in `ContactPersons[]`. Tickets and orders can link a person ref. Admin-only create/edit; standard users read-only.

**Invoice visibility:** Portal reads invoice status from Xero (`accounting.invoices.read`) on order detail and contact detail (AR + recent invoices).

**Manual sign:** Admin can upload signed PDF on order detail (alternative to Documenso) with optional DRAFT invoice creation.

---

## Do next — customer contacts (selective import)

- Export on disk: `xero-customers-export.json` / `.csv` — **131 customers**, two old orgs (not the new Xero org).
- Import **43 unique contacts** from [`list-of-companies.csv`](list-of-companies.csv) via [`xero-import-selected.csv`](xero-import-selected.csv).
- **12 excluded** — see [`excluded-companies.md`](excluded-companies.md) (10 absent from export + Puratos Liverpool skipped + Gressingham Foods).
- Westland Driffield + Ellesmere → one Xero contact (`Westland Horticulture Limited`).
- Duplicate org rule: prefer **Seamcor Limited** when the same company appears in both old orgs — **except** Adlam, Afrigrit, and Smart Office Connexion, which use **Seamcor External Profit Company**.
- Old `xeroContactId` values are invalid in the new org; strip on import.

**Preflight (no DB):**

```bash
pnpm reset-crm-data --import-xero --include-csv=xero-import-selected.csv --strip-xero-ids --dry-run
```

**Prod import** (Cloud SQL `DATABASE_URL` + Xero connected):

```bash
pnpm reset-crm-data --import-xero --include-csv=xero-import-selected.csv --strip-xero-ids
pnpm push-contacts-to-xero --include-csv=xero-import-selected.csv
```

Regenerate manifest after list/export changes: `pnpm build-import-manifest`

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
| [`excluded-companies.md`](excluded-companies.md) | 12 companies not imported |
| [`e-sign.md`](e-sign.md) | Documenso when ready |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Cloud Run deploy |
| [`deploy/apply-xero-env.ps1`](deploy/apply-xero-env.ps1) | Apply Xero vars via `gcloud` (after `gcloud auth login`) |
