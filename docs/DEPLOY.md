# Deploy seamvex-website-2 to Cloud Run

Region: **europe-west1** only · Service: **`seamvex-website-2`** · Port: **8080**

GCP console may show project name **My First Project** — project ID is **`exalted-splicer-499401-e2`**.

Live service with all four domain mappings (`seamvex.com`, `www.seamvex.com`, `seamcor.com`, `www.seamcor.com`).

## Cloud Run services (2026-06-21)

| Service | Region | Auth | Role |
|---------|--------|------|------|
| **`seamvex-website-2`** | europe-west1 | Public | **Live** — only service |

Orphan **`seamvex-website` (ew2) + its Cloud Build trigger deleted 2026-06-21.** A prior `git push` had redeployed the orphan because the trigger still existed.

**No Cloud Build triggers remain** — create ew1 trigger from `/cloudbuild.yaml` (below).

**Live snapshot:** [`outstanding.md`](../outstanding.md) — rev, commit, smoke, env count.

## Current production status

| Check | Status |
|-------|--------|
| Service `seamvex-website-2` (ew1, public) | **Live** — revision `00020-crd` (OAuth redirect fix) |
| Cloud Run env (12 vars) | **Applied** — rev `00019-nbr`, preserved on `00020-crd` |
| `pnpm go-live-smoke` | **6/6 pass** (HTTP only — not login E2E or DB) |
| Google OAuth | **307** → Google; callback → `seamvex.com` (not `0.0.0.0:8080`) |
| Admin login E2E | **Verify in browser** — [https://seamvex.com/admin/login](https://seamvex.com/admin/login) |
| `sign.seamvex.com` (Documenso) | **Not deployed** |
| Cloud Build trigger | **None** — create ew1 trigger from `cloudbuild.yaml` |

## Deploy gap (important)

**`git push origin main` does not deploy** (no triggers as of 2026-06-21).

### Create deploy trigger (required now)

1. Cloud Build → **Create trigger** → GitHub `stephaniemeechan/seamvex-website` → branch `^main$`
2. Configuration: **Cloud Build configuration file** → `/cloudbuild.yaml`
3. Region: **europe-west1** (substitution `_SERVICE: seamvex-website-2` is in the file)
4. Push once to verify; run `pnpm go-live-smoke`

One-time: ensure Cloud SQL attached via `deploy/apply-prod-env.ps1` if not already.

Repo [`cloudbuild.yaml`](../cloudbuild.yaml) is correct. **`deploy-live.ps1` was a workaround** when only the ew2 orphan trigger existed — do not use after ew1 trigger is live.

[`cloudbuild.yaml`](../cloudbuild.yaml) deploy step does **not** attach Cloud SQL. First-time setup (or if socket missing):

```powershell
node deploy/generate-prod-env.mjs
.\deploy\apply-prod-env.ps1   # adds --add-cloudsql-instances + env file
```

Connection name: `exalted-splicer-499401-e2:europe-west1:free-trial-first-project`

## Apply environment variables

Env vars are **not** set by `git push` or `deploy-live.ps1`.

When vars change:

```powershell
node deploy/generate-prod-env.mjs   # reads .secrets/ + .env.local → cloud-run-env.prod.yaml
.\deploy\apply-prod-env.ps1
```

| Script | Purpose |
|--------|---------|
| [`deploy/generate-prod-env.mjs`](../deploy/generate-prod-env.mjs) | Build gitignored YAML (12 vars) |
| [`deploy/apply-prod-env.ps1`](../deploy/apply-prod-env.ps1) | Apply YAML + Cloud SQL (Windows) |
| [`deploy/apply-prod-env.sh`](../deploy/apply-prod-env.sh) | Same (bash / Cloud Shell) |
| [`deploy/deploy-live.ps1`](../deploy/deploy-live.ps1) | Deploy ew2-built image to live (workaround) |
| [`deploy/deploy-live.sh`](../deploy/deploy-live.sh) | Same (bash) |

**Do not use** `--update-env-vars=ADMIN_EMAIL=a@x.com,j@y.com` — gcloud splits on commas. Use `--env-vars-file`.

Template: [`deploy/cloud-run-env.template`](../deploy/cloud-run-env.template)

## Prerequisites

1. `pnpm sync-legal-bundle` — commit `deploy/legal/` + `public/logos/` before deploy.
2. Cloud SQL Postgres (`seamvex_crm`).
3. GCS bucket `seamvex-contracts-eu` (europe-west1).
4. Google OAuth JSON in `.secrets/client_secret_*.json`.
5. Documenso — separate service; see [e-sign.md](../e-sign.md).

## GCS IAM

Cloud Run service account needs **`roles/storage.objectUser`** on `seamvex-contracts-eu` (not verified 2026-06-21).

```bash
gcloud storage buckets add-iam-policy-binding gs://seamvex-contracts-eu \
  --member="serviceAccount:YOUR_RUN_SA@exalted-splicer-499401-e2.iam.gserviceaccount.com" \
  --role="roles/storage.objectUser"
```

## Environment (Cloud Run)

**`PROD_REQUIRED`** (`lib/env.ts` — 10 vars; app throws on first DB access if missing):

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

**Also applied in prod** (12 total via `generate-prod-env.mjs`; not in `PROD_REQUIRED`):

```env
GMAIL_REDIRECT_URI=https://seamvex.com/api/gmail/connect/callback
ADMIN_EMAIL=s.meechan@seamvex.com,j.cyprus@seamvex.com
```

**For full CRM** (not on Run yet):

```env
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=
XERO_REDIRECT_URI=https://seamvex.com/api/xero/callback
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+441870470573
```

**Do not set on Cloud Run:** `ADMIN_PASSWORD`.

Register Gmail redirect on the same Google OAuth client as SSO.

## Options

### A — Cloud Build trigger (recommended; not wired)

Trigger on `main` → `/cloudbuild.yaml` → **`seamvex-website-2`** · **europe-west1**.

### B — Manual deploy after push (current workaround)

```powershell
git push origin main
.\deploy\deploy-live.ps1
```

### C — Connect repository (avoid duplicate)

If reconnecting GitHub: **europe-west1**, **`seamvex-website-2`**, port **8080**, public, ingress all. **Do not** create a second service in europe-west2.

## After deploy

1. `pnpm go-live-smoke` — expect 6/6
2. Browser: [https://seamvex.com/admin/login](https://seamvex.com/admin/login)
3. Fix trigger; delete ew2 orphan

## Documenso (manual)

Deploy `seamvex-documenso` to `sign.seamvex.com`. See [e-sign.md](../e-sign.md).

## Do not

- Deploy without `deploy/legal/` (build fails `check-legal-bundle`)
- Use SQLite on Cloud Run
- Assume `git push` updates production without `deploy-live.ps1` (until trigger fixed)
- Run `deploy-live.ps1` after ew1 `cloudbuild.yaml` trigger is fixed (wrong image registry)
