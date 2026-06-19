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

Disable Documenso customer invite emails — CRM sends the link via Gmail.

## Production (Cloud Run)

Second service **`seamvex-documenso`** on `sign.seamvex.com`:

- Own Cloud SQL Postgres instance
- Env: `NEXTAUTH_SECRET`, database URLs, `NEXT_PUBLIC_WEBAPP_URL=https://sign.seamvex.com`
- Webhook: `https://seamvex.com/api/documenso/webhook`

Main app env on Cloud Run:

```env
DOCUMENSO_API_URL=https://sign.seamvex.com/api/v2
DOCUMENSO_API_KEY=
DOCUMENSO_WEBHOOK_SECRET=
```

## Flow

1. Admin sends agreement → app uploads contract PDF to Documenso API.
2. Recipient signs in browser (no Documenso account needed).
3. `DOCUMENT_COMPLETED` webhook → download sealed PDF → GCS → order `signed` → Xero DRAFT invoice.

## Admin access

One Documenso admin (Stephanie). CRM users do not log into Documenso.

## Fallback

If `DOCUMENSO_API_KEY` is unset and `NODE_ENV=development`, send flow uses legacy `/sign/[token]`. Production always requires Documenso.
