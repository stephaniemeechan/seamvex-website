# Go-live outstanding — START HERE (new chat)

**Updated:** 2026-06-23  
**Repo:** `main` @ `8c3777b` (OAuth fix — **NOT on Cloud Run yet**)  
**GCP project:** `exalted-splicer-499401-e2`  
**Live service:** `seamvex-website-2` · still on old revision (Gmail scopes at login = not deployed)

---

## NEXT ACTION — Cloud Build trigger + deploy

**Why push didn't deploy:** orphan ew2 trigger was deleted 2026-06-21; ew1 trigger not created yet.

**One-time setup** (GCP Cloud Shell or local `gcloud auth login`):

```powershell
.\deploy\setup-cloud-build-trigger.ps1
```

Or deploy **right now** without a trigger (Cloud Shell):

```bash
curl -sL https://raw.githubusercontent.com/stephaniemeechan/seamvex-website/main/deploy/cloud-shell-deploy-now.sh | bash
```

Or create trigger (connect GitHub first if this fails — script prints the link):

```bash
curl -sL https://raw.githubusercontent.com/stephaniemeechan/seamvex-website/main/deploy/cloud-shell-setup-cloud-build-trigger.sh | bash
```

Then `git push origin main` (or run trigger manually in Cloud Build console).

After green build, retry https://seamvex.com/admin/login — OAuth scopes should be `openid email profile` only (not Gmail).

**Do not use** Cloud Run "Connect repository" — it ignores `cloudbuild.yaml` and may deploy to the wrong service/region.

---

## Cloud Run services (console)

| Service | Region | Auth | Role |
|---------|--------|------|------|
| **`seamvex-website-2`** | europe-west1 | Public | **Live** — only service (orphan deleted 2026-06-21) |

---

## Deploy workflow (read this)

| Step | What happens |
|------|----------------|
| `git push origin main` | Cloud Build trigger → `cloudbuild.yaml` → `seamvex-website-2` ew1 |
| `.\deploy\deploy-live.ps1` | **Obsolete** — do not use (ew2 image path) |
| `node deploy/generate-prod-env.mjs` + `.\deploy\apply-prod-env.ps1` | Apply env vars (only when vars change; image deploy preserves them) |

**Do not use** `--update-env-vars=...ADMIN_EMAIL=a@x.com,j@y.com` — gcloud splits on commas. Use `--env-vars-file` (scripts above).

---

## DONE (verified 2026-06-21)

| Item | Status |
|------|--------|
| Cloud Run env (12 vars) | Applied — rev `00019-nbr`, preserved on `00020-crd` |
| Google OAuth `/api/auth/google` | **307** redirect to Google |
| OAuth callback redirects | Fixed — uses `https://seamvex.com` not `0.0.0.0:8080` (`lib/request-url.ts`) |
| `pnpm go-live-smoke` | **6/6 pass** |
| Cloud SQL | `free-trial-first-project` / `seamvex_crm` |
| Xero app | `seamvex-portal` (0/5 connections) |
| Domain mappings | `seamvex.com`, `www`, `seamcor.com`, `www` → `seamvex-website-2` |

---

## NOT DONE — checklist

### P0 — login

- [x] Cloud Run env applied (12 vars)
- [x] Google OAuth client + redirect URIs in GCP Credentials
- [ ] **Login E2E** — Google sign-in → `/admin` (you verify in browser)
- [ ] **GCS bucket** `seamvex-contracts-eu` + Run SA `storage.objectUser` (verify)

### P1 — agreements + CRM

- [x] **Delete orphan** `seamvex-website` (ew2) + trigger — done 2026-06-21
- [ ] **Create ew1 Cloud Build trigger** from `/cloudbuild.yaml` → `seamvex-website-2`
- [ ] **Documenso** at `sign.seamvex.com` — see [`e-sign.md`](e-sign.md)
- [ ] Real `DOCUMENSO_API_KEY` on Run (currently `pending`)
- [ ] **Xero** — connect org, sync contacts — [`docs/XERO-SETUP.md`](docs/XERO-SETUP.md)
- [ ] **Customer data** — decide source before `reset-crm-data`

### P2 — after live

- [ ] Twilio voice webhook + `TWILIO_*` on Run
- [ ] Gmail connect per admin in Settings
- [ ] Xero E2E: order → send → sign → DRAFT invoice

---

## Recorded IDs (non-secret)

| What | Value |
|------|--------|
| GCP project | `exalted-splicer-499401-e2` |
| Cloud SQL connection | `exalted-splicer-499401-e2:europe-west1:free-trial-first-project` |
| DB name | `seamvex_crm` |
| Xero app | `seamvex-portal` |
| Xero redirect | `https://seamvex.com/api/xero/callback` |
| Admin emails | `s.meechan@seamvex.com`, `j.cyprus@seamvex.com` |
| Twilio number | `+441870470573` |

Passwords, tokens, `SESSION_SECRET` → **`.env.local` only**.

---

## Important facts

- **Login:** Google `@seamvex.com` only in prod. No `ADMIN_PASSWORD` on Run.
- **`data/proposals.db`:** local dev only. Prod uses Cloud SQL.
- **Git push does NOT wipe env vars** — image-only deploy preserves them.
- **Git push deploys** once Cloud Build trigger `deploy-seamvex-website-2-main` exists.

---

## Doc index

| File | Purpose |
|------|---------|
| [`docs/GET-READY.md`](docs/GET-READY.md) | Full checklist |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Cloud Run deploy + trigger |
| [`deploy/setup-cloud-build-trigger.ps1`](deploy/setup-cloud-build-trigger.ps1) | One-time Cloud Build trigger |
| [`deploy/apply-prod-env.ps1`](deploy/apply-prod-env.ps1) | Apply env vars from generated YAML |
