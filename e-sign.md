# Documenso CE — e-sign

Separate AGPL service for contract signing. CRM app integrates via API + webhook.

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

Disable Documenso customer invite emails — CRM sends the link via Gmail.

## Production (Cloud Run)

Second service **`seamvex-documenso`** on `sign.seamvex.com` — **manual deploy** (not in `cloudbuild.yaml`):

- Own Cloud SQL Postgres instance
- Env: `NEXTAUTH_SECRET`, database URLs, `NEXT_PUBLIC_WEBAPP_URL=https://sign.seamvex.com`
- Webhook URL: `https://seamvex.com/api/documenso/webhook`
- Webhook header: **`x-documenso-secret`** = same value as main app `DOCUMENSO_WEBHOOK_SECRET`

Main app env on Cloud Run (`seamvex-website-2`):

```env
DOCUMENSO_API_URL=https://sign.seamvex.com/api/v2
DOCUMENSO_API_KEY=
DOCUMENSO_WEBHOOK_SECRET=
```

## Flow

1. Admin sends agreement → app uploads contract PDF to Documenso API.
2. Recipient signs in browser (no Documenso account needed).
3. `DOCUMENT_COMPLETED` webhook (header `x-documenso-secret`) → download sealed PDF → GCS → order `signed` → Xero DRAFT invoice.

Signed PDF download (`GET /api/orders/[id]/signed-pdf`) reads from GCS via `readOrderPdf()` when path is `gcs://…`.

## Admin access

One Documenso admin (Stephanie). CRM users do not log into Documenso.

## Fallback

If `DOCUMENSO_API_KEY` is unset and `NODE_ENV=development`, send flow uses legacy `/sign/[token]`. Production always requires Documenso.
