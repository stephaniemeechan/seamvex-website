# Go-live — remaining actions only

**Phase 1 nearly complete.** Documenso sealing works; **webhook → CRM fix** must deploy via `git push main` then **Resend** webhook in Documenso admin.

**Workflow:** Code → `git push main` → Cloud Build → `seamvex-website-2`. Documenso env → **Cloud Run console** or [`deploy/documenso/`](../deploy/documenso/). Tests → **https://seamvex.com** in browser.

**Do not touch:** CRM contacts import (43 in prod — do not re-import).

---

## Phase 1 — Electronic signature

Ref: [`e-sign.md`](../e-sign.md), [`DNS-SETUP.md`](./DNS-SETUP.md) §5, [`deploy/documenso/README.md`](../deploy/documenso/README.md)

| # | Action | Where | Pass |
|---|--------|-------|------|
| 1 | Cloud Run `seamvex-documenso` + mapping `sign.seamvex.com` | GCP | **[x]** |
| 2 | Cloud SQL database `documenso` + user + grants | GCP Cloud SQL | **[x]** |
| 3 | Deploy `seamvex-documenso` (custom image, cert, 1 GiB RAM) | GCP Cloud Run | **[x]** |
| 4 | `sign.seamvex.com` Active + Squarespace CNAME | GCP + Squarespace | **[x]** |
| 5 | `https://sign.seamvex.com/api/v2` responds | Browser | **[x]** JSON 404 = OK |
| 6 | Documenso admin, API key, webhook `DOCUMENT_COMPLETED` | sign.seamvex.com | **[x]** |
| 7 | `DOCUMENSO_API_KEY` on `seamvex-website-2` (not `pending`) | GCP Cloud Run | **[x]** |
| 8 | GCS bucket + IAM for Run SA | GCP Storage | **[x]** `582518890553-compute@...` |
| 9a | Send test order + Gmail cover note | seamvex.com | **[x]** |
| 9b | Customer signs — not stuck Processing | sign.seamvex.com | **[x]** SO-1000128 |
| 9c | Order **signed**; ticket activity | seamvex.com | **[ ]** after webhook fix deploy + Resend |
| 9d | Download signed PDF | seamvex.com | **[ ]** |
| 9e | GCS `pdfs/{orderId}/` | GCP Storage | **[ ]** |
| 9f | Contact **Active** | seamvex.com | **[ ]** |
| 9g | Xero **DRAFT** | Xero | **[ ]** |
| 9h | PDF signature alignment page 1 | PDF | **[ ]** |

### After webhook code deploy

1. `git push main` → wait for `seamvex-website-2` deploy
2. **sign.seamvex.com → Settings → Webhooks** → failed delivery → **Resend** (SO-1000128)
3. Confirm **200** response; refresh order on seamvex.com → **signed**
4. Complete 9d–9h

**Webhook 500 cause (fixed in repo):** handler used numeric `payload.id` for PDF download; API v2 needs **envelope ID** (`order.documensoDocumentId`).

### Documenso admin bootstrap (one-time)

1. Temporarily `NEXT_PUBLIC_DISABLE_SIGNUP=false` → deploy
2. Sign up at `https://sign.seamvex.com/signup`
3. Cloud SQL Studio as user **`documenso`** on DB **`documenso`**:
   ```sql
   UPDATE "User"
   SET "emailVerified" = NOW(), roles = '{ADMIN}'
   WHERE email = 's.meechan@seamvex.com';
   ```
4. Set `NEXT_PUBLIC_DISABLE_SIGNUP=true` → deploy
5. Settings → API key; Webhooks → URL + secret + `DOCUMENT_COMPLETED`

SMTP not required — CRM sends links via Gmail.

### P1-3 env vars (`seamvex-documenso`)

**12 items** in Cloud Run (10 env vars + resource settings). **No `PORT` env var.**

| Variable / setting | Value |
|--------------------|-------|
| `NEXTAUTH_SECRET` | set at deploy |
| `NEXT_PRIVATE_ENCRYPTION_KEY` | min 32 chars |
| `NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY` | min 32 chars |
| `NEXT_PRIVATE_DATABASE_URL` | `postgresql://documenso:PASSWORD@localhost/documenso?host=/cloudsql/exalted-splicer-499401-e2:europe-west1:free-trial-first-project&connection_limit=5&pool_timeout=30&connect_timeout=15` |
| `NEXT_PRIVATE_DIRECT_DATABASE_URL` | same |
| `NEXT_PUBLIC_WEBAPP_URL` | `https://sign.seamvex.com` |
| `NEXT_PRIVATE_INTERNAL_WEBAPP_URL` | `http://127.0.0.1:8080` |
| `NEXT_PUBLIC_DISABLE_SIGNUP` | `true` |
| `NEXT_PRIVATE_SIGNING_PASSPHRASE` | **contents** of `.secrets/documenso/signing-passphrase.txt` — [`generate-signing-cert.ps1`](../deploy/documenso/generate-signing-cert.ps1) |
| `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` | **contents** of `.secrets/documenso/cert.b64.txt` — **not file paths** |
| Memory | **1 GiB** |
| CPU | **Always allocated** |

Image: `europe-west1-docker.pkg.dev/exalted-splicer-499401-e2/seamvex/documenso:latest` (Alpine + Chromium — see [`deploy/documenso/Dockerfile`](../deploy/documenso/Dockerfile)).

**Troubleshooting sealing:** `/api/certificate-status` · logs `seal-document` · OOM → increase memory · [documenso#2060](https://github.com/documenso/documenso/issues/2060).

**Do not** change trigger `deploy-seamvex-website-2-main`.

### P1-8 GCS IAM

```bash
gcloud storage buckets add-iam-policy-binding gs://seamvex-contracts-eu \
  --member="serviceAccount:582518890553-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectUser"
```

---

## Phase 2 — Resend + amendment (after 9 passes)

| # | Action | Pass |
|---|--------|------|
| 10 | Resend + customer signs | **[ ]** |
| 11 | Amendment full flow | **[ ]** |

---

## Phase 3 — Voice (after Phase 1)

| # | Action | Pass |
|---|--------|------|
| 12–19 | Twilio verify + E2E | **[ ]** — see table in prior sessions |

---

## Reference

| Item | Value |
|------|-------|
| GCP project | `exalted-splicer-499401-e2` |
| Cloud Run (CRM) | `seamvex-website-2` · `europe-west1` |
| Cloud Run (Documenso) | `seamvex-documenso` · custom Artifact Registry image |
| Cloud SQL | `free-trial-first-project` — DBs `seamvex_crm`, `documenso` |
| GCS | `seamvex-contracts-eu` |
| Documenso | `https://sign.seamvex.com` · API `.../api/v2` |
| Run SA (GCS) | `582518890553-compute@developer.gserviceaccount.com` |
| Twilio | `+441870470573` |

### Cloud Run env — `seamvex-website-2` (19 vars)

Keep **all 19** when editing one. `DOCUMENSO_API_KEY` is set (not `pending`).

Do **not** set `ADMIN_PASSWORD` on Cloud Run.
