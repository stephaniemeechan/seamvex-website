# Deploy seamvex-website-2 to Cloud Run

Region: **europe-west1** only · Service: **`seamvex-website-2`** · Port: **8080**

GCP console may show project name **My First Project** — project ID is **`exalted-splicer-499401-e2`**.

**Live snapshot:** [`GO-LIVE.md`](./GO-LIVE.md) — remaining actions, env vars, reference IDs.

## Services

| Service | Region | Auth | Role |
|---------|--------|------|------|
| **`seamvex-website-2`** | europe-west1 | Public | **Live** — CRM + marketing site |
| **`seamvex-documenso`** | europe-west1 | Public | **Live** — `sign.seamvex.com`; manual deploy via [`deploy/documenso/`](../deploy/documenso/) |

Domain mappings on **`seamvex-website-2`**: `seamvex.com`, `www.seamvex.com`, `seamcor.com`, `www.seamcor.com` (all Active).

Orphan **`seamvex-website` (ew2)** and its trigger were deleted 2026-06-21.

## Deploy code (default path)

```
git push main  →  Cloud Build trigger deploy-seamvex-website-2-main  →  cloudbuild.yaml  →  seamvex-website-2
```

[`cloudbuild.yaml`](../cloudbuild.yaml) builds the Docker image and deploys with:

- `--add-cloudsql-instances=exalted-splicer-499401-e2:europe-west1:free-trial-first-project`
- Port 8080, europe-west1, public

**Env vars are not deployed by git push.** Set them in **Cloud Run console** → **Variables & secrets**. When editing, keep **all** vars — a revision deploy replaces the full list.

## Cloud Build trigger (one-time, if missing)

Cloud Shell:

```bash
gcloud config set project exalted-splicer-499401-e2
gcloud builds triggers create github \
  --name="deploy-seamvex-website-2-main" \
  --repo-owner="stephaniemeechan" \
  --repo-name="seamvex-website" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml"
```

Then `git push main` and `pnpm go-live-smoke`.

## Environment variables (Cloud Run console)

**19 vars on Run** — full table in [`GO-LIVE.md`](./GO-LIVE.md).

**`PROD_REQUIRED`** (`lib/env.ts` — app throws on first DB access if missing):

```env
SESSION_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://seamvex.com/api/auth/google/callback
DATABASE_URL=postgresql://...@/seamvex_crm?host=/cloudsql/exalted-splicer-499401-e2:europe-west1:free-trial-first-project
GCS_BUCKET=seamvex-contracts-eu
DOCUMENSO_API_URL=https://sign.seamvex.com/api/v2
DOCUMENSO_API_KEY=          # "pending" passes gate; real key needed for signing
DOCUMENSO_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=https://seamvex.com
```

**Also on Run** (not in `PROD_REQUIRED`):

```env
GMAIL_REDIRECT_URI=https://seamvex.com/api/gmail/connect/callback
ADMIN_EMAIL=s.meechan@seamvex.com,j.cyprus@seamvex.com
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=
XERO_REDIRECT_URI=https://seamvex.com/api/xero/callback
XERO_SALES_ACCOUNT_CODE=200
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+441870470573
```

**Do not set on Cloud Run:** `ADMIN_PASSWORD` (password login disabled in production).

Register Gmail redirect on the same Google OAuth client as SSO.

**Do not use** `--update-env-vars=ADMIN_EMAIL=a@x.com,j@y.com` — gcloud splits on commas. Use the Cloud Run console or `--env-vars-file`.

Local master copy: `.env.local` / `.secrets/` (gitignored) — paste into console manually.

## Prerequisites

1. `deploy/legal/` + `public/logos/` committed (build runs `check-legal-bundle`).
2. Cloud SQL Postgres — database `seamvex_crm` on instance `free-trial-first-project`.
3. GCS bucket `seamvex-contracts-eu` (europe-west1).
4. Google OAuth client with prod redirect URIs.
5. Documenso — separate Cloud Run service; see [e-sign.md](../e-sign.md).

## GCS IAM

Cloud Run **`seamvex-website-2`** service account needs **`roles/storage.objectUser`** on `seamvex-contracts-eu`.

```bash
gcloud storage buckets add-iam-policy-binding gs://seamvex-contracts-eu \
  --member="serviceAccount:582518890553-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectUser"
```

## After deploy

1. `pnpm go-live-smoke` — expect 6/6
2. Browser: [https://seamvex.com/admin/login](https://seamvex.com/admin/login)

## Documenso (manual)

Deploy `seamvex-documenso` to `sign.seamvex.com`. Database `documenso` on **same Cloud SQL instance** as CRM. See [e-sign.md](../e-sign.md) and [DNS-SETUP.md](./DNS-SETUP.md) §5.

## Do not

- Deploy without `deploy/legal/` (build fails `check-legal-bundle`)
- Use SQLite on Cloud Run
- Use Cloud Run "Connect repository" instead of Cloud Build trigger + `cloudbuild.yaml` (may create wrong region/service)

## Removed deploy scripts

Root `deploy-live.ps1`, `apply-prod-env.ps1`, etc. were removed. **Documenso** scripts live in [`deploy/documenso/`](../deploy/documenso/). CRM env → Cloud Run console; CRM code → **`git push main`**.
