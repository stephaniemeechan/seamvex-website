# Documenso CE — e-sign

Separate AGPL Cloud Run service for contract signing. CRM app integrates via API + webhook.

> **Production status (2026-07):** `sign.seamvex.com` **live**. Documenso sealing works. CRM webhook fix deploys via `git push main` — then **Resend** webhook in Documenso admin. See [`docs/GO-LIVE.md`](docs/GO-LIVE.md).

## Local (Docker Compose)

```bash
docker compose --profile documenso up -d
```

Documenso UI: http://localhost:3001

Set in `.env.local`:

```env
DOCUMENSO_API_URL=http://localhost:3001/api/v2
DOCUMENSO_API_KEY=<from Documenso admin>
DOCUMENSO_WEBHOOK_SECRET=<shared secret>
```

Webhook URL (for Documenso admin): `http://localhost:3000/api/documenso/webhook`

Webhook authentication: HTTP header **`x-documenso-secret`** must equal `DOCUMENSO_WEBHOOK_SECRET` (verified timing-safe in `app/api/documenso/webhook/route.ts`).

Disable Documenso customer invite emails — CRM sends the link via Gmail (`distributionMethod: "NONE"` in `lib/documenso/client.ts`).

## Production (Cloud Run)

Second service **`seamvex-documenso`** on `sign.seamvex.com` — **manual deploy** (not in [`cloudbuild.yaml`](cloudbuild.yaml); **do not** use trigger `deploy-seamvex-website-2-main`).

### Database — same Cloud SQL instance, separate database

| | CRM (`seamvex-website-2`) | Documenso (`seamvex-documenso`) |
|--|--|--|
| Cloud SQL **instance** | `exalted-splicer-499401-e2:europe-west1:free-trial-first-project` | **same instance** |
| **Database** | `seamvex_crm` | `documenso` |

Matches local dev: one Postgres container, [`docker/init-databases.sql`](docker/init-databases.sql) creates `documenso`. **Never** point Documenso at `seamvex_crm`.

In Cloud SQL console: create database `documenso`, create user `documenso`, grant access to that database only.

Connection string (socket form):

```text
postgresql://documenso:PASSWORD@localhost/documenso?host=/cloudsql/exalted-splicer-499401-e2:europe-west1:free-trial-first-project&connection_limit=5&pool_timeout=30&connect_timeout=15
```

Set as both `NEXT_PRIVATE_DATABASE_URL` and `NEXT_PRIVATE_DIRECT_DATABASE_URL` on `seamvex-documenso`.

### Deploy `seamvex-documenso`

Image: `documenso/documenso:latest` (same as [`docker-compose.yml`](docker-compose.yml)). For **"Processing document"** spinner after sign, use custom image with Playwright — [`deploy/documenso/README.md`](deploy/documenso/README.md).

Region: **europe-west1** · Port: **8080** · Public · Attach same Cloud SQL instance. **Do not** set env var `PORT` (Cloud Run reserves it).

**Required env vars:**

| Variable | Value |
|----------|-------|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PRIVATE_ENCRYPTION_KEY` | min 32 chars |
| `NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY` | min 32 chars |
| `NEXT_PRIVATE_DATABASE_URL` | `@localhost` socket URL — see GO-LIVE |
| `NEXT_PRIVATE_DIRECT_DATABASE_URL` | same |
| `NEXT_PUBLIC_WEBAPP_URL` | `https://sign.seamvex.com` |
| `NEXT_PRIVATE_INTERNAL_WEBAPP_URL` | `http://127.0.0.1:8080` |
| `NEXT_PUBLIC_DISABLE_SIGNUP` | `true` |
| `NEXT_PRIVATE_SIGNING_PASSPHRASE` | `.p12` password — [`deploy/documenso/generate-signing-cert.ps1`](deploy/documenso/generate-signing-cert.ps1) |
| `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` | base64 `.p12` from same script |

Generate cert: `.\deploy\documenso\generate-signing-cert.ps1` (OpenSSL `-legacy`) → paste **contents** of `.secrets/documenso/` files into Cloud Run — **not file paths**.

**Cloud Run resources:** memory **1 GiB**, CPU **always allocated**, max instances **2**.

**Troubleshooting sealing:** `/api/certificate-status` · logs `seal-document` · OOM → 1 GiB · [Playwright issue #2060](https://github.com/documenso/documenso/issues/2060).

**Webhook troubleshooting:** Documenso admin → Webhooks → delivery log. **500** on `document.completed` → ensure latest CRM code uses `order.documensoDocumentId` for PDF download.

**Build-time caveat:** Documenso is Next.js. If `NEXT_PUBLIC_WEBAPP_URL` is wrong after deploy, rebuild image with `--build-arg NEXT_PUBLIC_WEBAPP_URL=https://sign.seamvex.com`.

SMTP **not required** — CRM sends signing links via Gmail.

### DNS

See [`docs/DNS-SETUP.md`](docs/DNS-SETUP.md) §5 — Cloud Run domain mapping + Squarespace CNAME `sign` → `ghs.googlehosted.com`.

### Webhook (configure in Documenso admin after deploy)

| Setting | Value |
|---------|-------|
| URL | `https://seamvex.com/api/documenso/webhook` |
| Header | `x-documenso-secret` = same as `DOCUMENSO_WEBHOOK_SECRET` on main app |
| Event | `DOCUMENT_COMPLETED` |

### Main app env (`seamvex-website-2`)

Set via **Cloud Run console** (not git push). Full list: [`docs/GO-LIVE.md`](docs/GO-LIVE.md).

```env
DOCUMENSO_API_URL=https://sign.seamvex.com/api/v2
DOCUMENSO_API_KEY=          # from Documenso admin Settings → API
DOCUMENSO_WEBHOOK_SECRET=
```

## Flow

1. Admin sends agreement → app uploads contract PDF to Documenso API.
2. Recipient signs in browser (no Documenso account needed).
3. `DOCUMENT_COMPLETED` webhook (header `x-documenso-secret`) → download sealed PDF via **envelope ID** → GCS → order `signed` → Xero DRAFT invoice.

Signed PDF download (`GET /api/orders/[id]/signed-pdf`) reads from GCS via `readOrderPdf()` when path is `gcs://…`.

## Admin access

One Documenso admin (Stephanie). CRM users do not log into Documenso.

## Fallback

If `DOCUMENSO_API_KEY` is unset and `NODE_ENV=development`, send flow uses legacy `/sign/[token]`. Production always requires Documenso. Note: `"pending"` passes the prod env gate but **fails** Documenso API auth until replaced.
