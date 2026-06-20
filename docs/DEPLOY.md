# Deploy seamvex-website to Cloud Run

Region: **europe-west1** only · Service: **seamvex-website** · Port: **8080**

## Prerequisites

1. Run `pnpm sync-legal-bundle` and commit `deploy/legal/` + `public/logos/` before deploy.
2. Cloud SQL Postgres instance (app DB).
3. GCS bucket `seamvex-contracts-eu` (europe-west1) for signed PDFs.
4. Secret Manager: `SESSION_SECRET`, `GOOGLE_*`, `XERO_*`, `DOCUMENSO_*`, `TWILIO_*`, `DATABASE_URL`.
5. Separate Documenso service — see [e-sign.md](../e-sign.md).

## Environment (Cloud Run)

```env
DATABASE_URL=postgresql://...
GCS_BUCKET=seamvex-contracts-eu
SESSION_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://seamvex.com/api/auth/google/callback
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=
XERO_REDIRECT_URI=https://seamvex.com/api/xero/callback
DOCUMENSO_API_URL=https://sign.seamvex.com/api/v2
DOCUMENSO_API_KEY=
DOCUMENSO_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=https://seamvex.com
ADMIN_EMAIL=s.meechan@seamvex.com
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+441870470573
```

Voice routing (hours, after-hours mobile) is configured in **Admin → Settings**, not env vars.

Twilio number: set **A call comes in** webhook to `https://seamvex.com/api/twilio/voice/inbound` (HTTP POST).

Mount secrets via Secret Manager references, not plain env in source control.

## Option A — Cloud Build trigger (recommended)

1. Cloud Build → Triggers → push to `main`
2. Configuration: `/cloudbuild.yaml`
3. Region: **europe-west1**

Docker build runs `pnpm check-legal-bundle` before `next build`.

## Option B — Cloud Run Connect repository

| Setting | Value |
|---------|-------|
| Region | **europe-west1** |
| Service name | **seamvex-website** |
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

## Documenso second service

Deploy `seamvex-documenso` to `sign.seamvex.com` with its own Cloud SQL DB. See [e-sign.md](../e-sign.md).

## Do not

- Deploy without `deploy/legal/` (build fails `check-legal-bundle`)
- Use ephemeral SQLite on Cloud Run for CRM data
- Create duplicate services in other regions without intent
