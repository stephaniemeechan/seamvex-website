# Go-live outstanding — Seamvex CRM

**Audit date:** 2026-06-20 (audited against repo `4946376`)  
**Repo HEAD:** `4946376` on `origin/main`  
**Live service:** `seamvex-website-2` (europe-west1, public)  
**Smoke:** `pnpm go-live-smoke` — **5/6 pass** (Google OAuth 503; Documenso webhook 503 counts as PASS per script)

Repo code is complete for go-live. Everything below is **manual GCP / external console work**.

Use **Variables & secrets** or **Secret Manager references** on Cloud Run (see [`deploy/cloud-run-env.template`](deploy/cloud-run-env.template)).

---

## P0 — Blocks login and CRM

### B8 — Cloud Build

- [ ] Confirm Cloud Build trigger on `main` finishes **green** after latest push
- [ ] Verify deployed revision is **`seamvex-website-2`** in europe-west1

### C — Cloud Run env (`seamvex-website-2`)

**PROD_REQUIRED** (`lib/env.ts` — `assertProductionEnv()` runs on first DB access, including Google SSO callback):

- [ ] `SESSION_SECRET` — long random string (not `change-me-in-production`)
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_REDIRECT_URI` = `https://seamvex.com/api/auth/google/callback`
- [ ] `DATABASE_URL` — Cloud SQL Postgres (see D6)
- [ ] `GCS_BUCKET` = `seamvex-contracts-eu`
- [ ] `DOCUMENSO_API_URL` = `https://sign.seamvex.com/api/v2` *(env required for login; live service required for send/sign — P1)*
- [ ] `DOCUMENSO_API_KEY` *(env required for login; real key after Documenso deploy)*
- [ ] `DOCUMENSO_WEBHOOK_SECRET` — shared with webhook header `x-documenso-secret`
- [ ] `NEXT_PUBLIC_APP_URL` = `https://seamvex.com`

**Also required for full CRM:**

- [ ] `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REDIRECT_URI` = `https://seamvex.com/api/xero/callback`
- [ ] `ADMIN_EMAIL` = `s.meechan@seamvex.com`
- [ ] `GMAIL_REDIRECT_URI` = `https://seamvex.com/api/gmail/connect/callback` *(optional if `NEXT_PUBLIC_APP_URL` set)*

- [ ] Deploy new Cloud Run revision after vars set
- [ ] Verify: `https://seamvex.com/admin/login` → **Google sign-in completes** (not just `/api/auth/google` → 302)
- [ ] Re-run `pnpm go-live-smoke` — **6/6** once Google OAuth env set

**Do not set:** `ADMIN_PASSWORD` (password login disabled in production)

### D1–D3 — OAuth redirect URIs (external consoles)

- [ ] **Google OAuth:** `https://seamvex.com/api/auth/google/callback`
- [ ] **Google OAuth:** Gmail `https://seamvex.com/api/gmail/connect/callback`
- [ ] **Xero app:** `https://seamvex.com/api/xero/callback`

### D6–D7 — Database and storage

- [ ] Cloud SQL Postgres instance exists
- [ ] Cloud Run **`seamvex-website-2`** → **Connections** → Cloud SQL instance attached (required for `/cloudsql/…` in `DATABASE_URL`)
- [ ] Run service account has **`roles/cloudsql.client`** (if needed)
- [ ] `DATABASE_URL` per template; migrations run on first DB access
- [ ] GCS bucket `seamvex-contracts-eu` (europe-west1) exists
- [ ] Run service account has `roles/storage.objectUser` on bucket

---

## P1 — Blocks agreement send/sign

### D4–D5 — Documenso CE

- [ ] Deploy `seamvex-documenso` to **`sign.seamvex.com`** — see [`e-sign.md`](e-sign.md)
- [ ] Set real `DOCUMENSO_API_KEY` on main app (update value after deploy)
- [ ] Webhook: `https://seamvex.com/api/documenso/webhook`, header **`x-documenso-secret`**
- [ ] Prefer webhook smoke **401** once secret set *(503 still passes automated smoke)*

### E1 — Xero org setup

After P0 — [`docs/XERO-SETUP.md`](docs/XERO-SETUP.md):

- [ ] Connect Xero (Seamvex org only) → sync contacts
- [ ] Test: order → send → sign → **DRAFT** invoice in Xero

---

## P2 — Post-live / cleanup

### Twilio voice

- [ ] Twilio: **A call comes in** → POST `https://seamvex.com/api/twilio/voice/inbound`
- [ ] Admin → Settings: hours, ring group, after-hours mobile
- [ ] Env: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` = `+441870470573`

### Gmail

- [ ] Each sender: Settings → Connect Gmail (requires D2 + Google SSO)

### Optional

- [ ] `XERO_SALES_ACCOUNT_CODE` = `200` (default in code)
- [ ] Greenfield: `pnpm reset-crm-data --import-xero`
- [ ] Delete orphan **`seamvex-website`** (ew1 + ew2) after B8 green

---

## Smoke test reference

```bash
pnpm go-live-smoke
```

Script: [`scripts/go-live-smoke-test.mjs`](scripts/go-live-smoke-test.mjs)

| Check | Now | After Google OAuth env | After full P0 |
|-------|-----|------------------------|---------------|
| Marketing home | PASS 200 | PASS | PASS |
| Admin login page | PASS 200 | PASS | PASS |
| Twilio domain verify | PASS 200 | PASS | PASS |
| Legacy `/sign` blocked | PASS 404 | PASS | PASS |
| Documenso webhook unsigned | PASS 503 *(script accepts 401 or 503)* | PASS | PASS 401 preferred |
| Google OAuth configured | **FAIL 503** | **PASS 302** | PASS 302 |

- **6/6 automated smoke:** `GOOGLE_*` + D1 redirects — only check 6 must change.
- **Sign-in actually works:** all `PROD_REQUIRED` + Cloud SQL connection on Run.

Manual E2E: agreement send/sign, Gmail, Xero DRAFT, Twilio voice.

---

## Code complete (repo — no open blockers)

| Area | Status |
|------|--------|
| Deploy target | `cloudbuild.yaml` → `seamvex-website-2` |
| Signed PDF | `readOrderPdf()` for GCS |
| Gmail | Connection status, send preview = actual body |
| Xero | Paginated sync, import reads export format |
| Twilio | Voice only, domain verify live |
| Docs | [`docs/GET-READY.md`](docs/GET-READY.md) master checklist |

**Start next session here.** Work P0 top to bottom, then `pnpm go-live-smoke`.
