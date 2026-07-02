# Seamvex-website

Next.js marketing site + internal CRM/agreement admin for **Seamvex Data Systems Ltd** (trading as **Seamcor**).

**Go-live:** [`docs/GO-LIVE.md`](docs/GO-LIVE.md) — Phase 1 nearly complete; webhook fix deploy + Resend pending for 9c–9h.

---

## Quick start (local)

```bash
pnpm install
cp .env.local.example .env.local   # fill for local dev
pnpm dev                           # http://localhost:3000/admin/login
```

Legal PDFs in prod use committed **`deploy/legal/`**. Optional: `pnpm sync-legal-bundle` if you have gitignored `branding/legal/`.

Optional Postgres: `docker compose up -d postgres` + `DATABASE_URL=postgresql://seamvex:seamvex@localhost:5432/seamvex_crm`

---

## Deploy (production code)

```
git push main  →  Cloud Build (deploy-seamvex-website-2-main)  →  cloudbuild.yaml  →  seamvex-website-2
```

**Env vars are not deployed by git push.** Set them in **Cloud Run console** → **Variables & secrets**. See [`docs/GO-LIVE.md`](docs/GO-LIVE.md).

---

## Local vs production (`NODE_ENV`)

| Local (`pnpm dev`) | Production |
|--------------------|------------|
| SQLite OK | **Requires** `DATABASE_URL` (Postgres) |
| Local PDFs in `data/pdfs/` | **Requires** `GCS_BUCKET` |
| Password login if no Google OAuth | Google OAuth only |
| Legacy `/sign/[token]` if no Documenso | Legacy sign **404**; Documenso required |
| Documenso optional on send | `DOCUMENSO_*` required |

Implementation: [`lib/env.ts`](lib/env.ts)

---

## What the CRM does

| Feature | Admin | Standard user |
|---------|-------|---------------|
| Google SSO `@seamvex.com` | Yes | Yes |
| Create/send/resend/void agreements | Yes | No |
| Voice (click-to-call; inbound simulring) | Yes | Yes (My phone + Receive inbound calls) |
| Settings (voice routing, Xero sync) | Yes | Own phone only |

**Signing (production):** Documenso → webhook → GCS PDF → Xero DRAFT. Sealing live on `sign.seamvex.com`; complete Action 9c–9h after webhook deploy.

**Email:** Gmail per user in Settings.

**Voice:** Company line **`+441870470573`** (caller ID + inbound). **My phone** in Settings = your **personal mobile**, not the company line.

---

## Xero contacts

| Topic | Fact |
|-------|------|
| **Import** | **Done** — 43 contacts in prod. **Do not re-run.** |
| **Xero OAuth** | Connected — **seamvex data systems ltd** (verify in prod Settings) |
| **Sync** | Settings → Sync contacts (admin) |

---

## Production snapshot

| Item | Value |
|------|-------|
| Service | `seamvex-website-2` (europe-west1) |
| Code | `main` @ **`6ffc3e8`** |
| Trigger | `deploy-seamvex-website-2-main` |
| Documenso | **Live** — `sign.seamvex.com` |

Full checklist + env: [`docs/GO-LIVE.md`](docs/GO-LIVE.md)

---

## Legal assets

- Committed: **`deploy/legal/`**, `public/logos/`
- Build runs `check-legal-bundle` before `next build`

---

## Documentation

| File | Contents |
|------|----------|
| [`docs/GO-LIVE.md`](docs/GO-LIVE.md) | **Start here** — remaining actions + reference |
| [`docs/CRM.md`](docs/CRM.md) | Workflows, agreements, voice |
| [`e-sign.md`](e-sign.md) | Documenso deploy |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Cloud Run deploy |
| [`docs/DNS-SETUP.md`](docs/DNS-SETUP.md) | Domain DNS |
| [`docs/XERO-SETUP.md`](docs/XERO-SETUP.md) | Xero |

---

## Known limitations

- **Not live** — see GO-LIVE.md
- **Documenso** — electronic send/sign/resend blocked until Phase 1 actions complete
- **Manual sign** — works; electronic sign required for go-live
