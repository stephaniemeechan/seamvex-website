# Deploy seamvex-website-2 to Cloud Run

Region: **europe-west1** only · Service: **seamvex-website-2** · Port: **8080**

Live service with all four domain mappings (`seamvex.com`, `www.seamvex.com`, `seamcor.com`, `www.seamcor.com`). `cloudbuild.yaml` deploys to **seamvex-website-2**.

## Current production status (2026-06-20)

| Check | Status |
|-------|--------|
| Service `seamvex-website-2` public + ingress all | **Live** (GCP confirmed) |
| HTTPS on mapped domains | **200** on `seamvex.com`, `www.seamcor.com` |
| `pnpm go-live-smoke` | **5/6 pass** — Google OAuth **503** (env not set); Documenso webhook **503** (secret not set) |
| `sign.seamvex.com` (Documenso) | **Not deployed** — separate manual service |
| Cloud Run env vars | **Not configured** — see [GET-READY.md](./GET-READY.md) §C |

**Orphan services to delete** after confirming Cloud Build deploy is green (GET-READY B8):

- `seamvex-website` (europe-west1, auth required)
- `seamvex-website` (europe-west2)

## Prerequisites

1. Run `pnpm sync-legal-bundle` and commit `deploy/legal/` + `public/logos/` before deploy.
2. Cloud SQL Postgres instance (app DB).
3. GCS bucket `seamvex-contracts-eu` (europe-west1) for signed PDFs.
4. Secret Manager: `SESSION_SECRET`, `GOOGLE_*`, `XERO_*`, `DOCUMENSO_*`, `TWILIO_*`, `DATABASE_URL`.
5. Separate Documenso service — see [e-sign.md](../e-sign.md).

Copy [`deploy/cloud-run-env.template`](../deploy/cloud-run-env.template) when filling Cloud Run variables (do not commit real secrets).

After deploy, run `pnpm go-live-smoke` against production to verify routes and webhooks. Expect **503** on Google OAuth and Documenso webhook until env vars in §C of [GET-READY.md](./GET-READY.md) are set.

## GCS IAM

The Cloud Run **service account** (default compute SA or the one attached to `seamvex-website-2`) needs **`roles/storage.objectUser`** on bucket `seamvex-contracts-eu` so the app can upload and download signed PDFs (`saveOrderPdf` / `readOrderPdf`).

Grant in Cloud Console → Cloud Storage → bucket → Permissions, or:

```bash
gcloud storage buckets add-iam-policy-binding gs://seamvex-contracts-eu \
  --member="serviceAccount:YOUR_RUN_SA@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectUser"
```

## Environment (Cloud Run)

**Required in production** (`lib/env.ts` `PROD_REQUIRED` — app throws on first DB access if missing):

```env
DATABASE_URL=postgresql://...
GCS_BUCKET=seamvex-contracts-eu
SESSION_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://seamvex.com/api/auth/google/callback
DOCUMENSO_API_URL=https://sign.seamvex.com/api/v2
DOCUMENSO_API_KEY=
DOCUMENSO_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=https://seamvex.com
```

**Also set for full CRM functionality** (not in `PROD_REQUIRED` but needed in practice):

```env
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=
XERO_REDIRECT_URI=https://seamvex.com/api/xero/callback
ADMIN_EMAIL=s.meechan@seamvex.com
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+441870470573
```

Voice routing (hours, after-hours mobile) is configured in **Admin → Settings**, not env vars.

Twilio number: set **A call comes in** webhook to `https://seamvex.com/api/twilio/voice/inbound` (HTTP POST).

Gmail send uses per-user OAuth (Settings → Connect Gmail). Add these redirect URIs to the **same Google OAuth client** as SSO (or a dedicated client):

| Environment | Gmail redirect URI |
|-------------|-------------------|
| Production | `https://seamvex.com/api/gmail/connect/callback` |
| Local dev | `http://localhost:3000/api/gmail/connect/callback` |

Mount secrets via Secret Manager references, not plain env in source control.

## Option A — Cloud Build trigger (recommended)

1. Cloud Build → Triggers → push to `main`
2. Configuration: `/cloudbuild.yaml` (substitution `_SERVICE: seamvex-website-2`)
3. Region: **europe-west1**

Docker build runs `pnpm check-legal-bundle` before `next build`.

## Option B — Cloud Run Connect repository

| Setting | Value |
|---------|-------|
| Region | **europe-west1** |
| Service name | **seamvex-website-2** |
| Build | **Dockerfile** at `/Dockerfile` |
| Port | **8080** |
| Authentication | Allow unauthenticated (app-level Google SSO) |
| Ingress | All |

## Dockerfile notes

- Copies `deploy/legal/` into image for PDF generation
- Copies `public/logos/` for UI and PDFs
- `branding/` remains gitignored — never required at runtime

## After deploy

1. Test `https://seamvex.com/admin/login`
2. Domain mappings: `seamvex.com`, `seamcor.com` — see [DNS-SETUP.md](./DNS-SETUP.md)
3. Cloud Scheduler: optional daily `POST /api/xero/sync` (admin session or service account — configure as needed)
4. Delete orphan `seamvex-website` services in europe-west1 and europe-west2 once verified

## Documenso second service (manual)

Deploy `seamvex-documenso` to `sign.seamvex.com` with its own Cloud SQL DB. See [e-sign.md](../e-sign.md). Not deployed by `cloudbuild.yaml`.

## Remaining manual steps (not in repo deploy)

| Step | Where |
|------|-------|
| Documenso CE on `sign.seamvex.com` | [e-sign.md](../e-sign.md) |
| Twilio voice webhook + Admin → Settings routing | Twilio Console + app |
| Xero OAuth connect + org setup | [XERO-SETUP.md](./XERO-SETUP.md) |
| Gmail per admin user | Admin → Settings → Connect Gmail |

## Do not

- Deploy without `deploy/legal/` (build fails `check-legal-bundle`)
- Use ephemeral SQLite on Cloud Run for CRM data
- Create duplicate services in other regions without intent
