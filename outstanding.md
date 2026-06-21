# Go-live outstanding — START HERE (new chat)

**Updated:** 2026-06-21  
**Repo:** `main` @ `9419bc9` (uncommitted doc/deploy script updates pending commit)  
**GCP project:** `exalted-splicer-499401-e2` (console: **My First Project**)  
**Live service:** `seamvex-website-2` · `europe-west1` · revision **`00020-crd`**  
**Secrets:** `.env.local` + `.secrets/client_secret_*.json` → `deploy/cloud-run-env.prod.yaml` (gitignored)

**Smoke last run:** `pnpm go-live-smoke` → **6/6 pass**

---

## NEXT ACTION

**Confirm admin login E2E:** [https://seamvex.com/admin/login](https://seamvex.com/admin/login) → Google as **`s.meechan@seamvex.com`** or **`j.cyprus@seamvex.com`** → both are admin (`ADMIN_EMAIL` on Run has both; code default matches).

If login fails, note the exact URL/error.

---

## Cloud Run services (console)

| Service | Region | Auth | Role |
|---------|--------|------|------|
| **`seamvex-website-2`** | europe-west1 | Public | **Live** — only service (orphan deleted 2026-06-21) |

**Orphan `seamvex-website` (ew2) was redeployed by `git push` @ `9419bc9`** because the Connect-repo trigger still existed. **Deleted:** trigger + service + **no triggers remain**. Next push will **not** auto-deploy until you create an ew1 trigger from `/cloudbuild.yaml` (see DEPLOY.md).

---

## Deploy workflow (read this)

| Step | What happens |
|------|----------------|
| `git push origin main` | **No auto-deploy** (orphan trigger deleted 2026-06-21) |
| Create ew1 trigger from `/cloudbuild.yaml` | **Required** for push → live deploy — see DEPLOY.md |
| `.\deploy\deploy-live.ps1` | **Obsolete** once ew1 trigger exists; was workaround pulling ew2 image |
| `node deploy/generate-prod-env.mjs` + `.\deploy\apply-prod-env.ps1` | Apply env vars (only when vars change; image deploy preserves them) |

**Fix long-term:** create Cloud Build trigger using `/cloudbuild.yaml` → `seamvex-website-2` ew1; delete ew2 orphan trigger + service. See [`docs/DEPLOY.md`](docs/DEPLOY.md).

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
- **Git push does NOT update live service today** — run `deploy-live.ps1` after push.

---

## Doc index

| File | Purpose |
|------|---------|
| [`docs/GET-READY.md`](docs/GET-READY.md) | Full checklist |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Cloud Run deploy + trigger fix |
| [`deploy/deploy-live.ps1`](deploy/deploy-live.ps1) | Push image to live after git push |
| [`deploy/apply-prod-env.ps1`](deploy/apply-prod-env.ps1) | Apply env vars from generated YAML |
