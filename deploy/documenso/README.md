# Documenso Cloud Run — signing cert + Playwright image

Fixes **"Processing document"** after signing (`internal.seal-document`). CRM webhook fix is separate — [`app/api/documenso/webhook/route.ts`](../../app/api/documenso/webhook/route.ts).

## Important — not the website trigger

**Do not change** Cloud Build trigger **`deploy-seamvex-website-2-main`**. That trigger only deploys **`seamvex-website-2`**.

**`seamvex-documenso` is manual** — separate service, separate deploy.

---

## Generate signing cert (OpenSSL -legacy)

```powershell
.\deploy\documenso\generate-signing-cert.ps1
```

Output in `.secrets/documenso/` (gitignored): `signing-passphrase.txt`, `cert.b64.txt`, `cert.p12`.

**Cloud Run:** paste **file contents** into env vars — **not** paths like `.secrets\documenso\cert.b64.txt`.

| Variable | Paste from |
|----------|------------|
| `NEXT_PRIVATE_SIGNING_PASSPHRASE` | `signing-passphrase.txt` (entire line) |
| `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` | `cert.b64.txt` (entire base64 line) |

---

## Cloud Run settings (production)

| Setting | Value |
|---------|-------|
| Memory | **1 GiB** minimum (512 MiB OOMs during seal) |
| CPU | **Always allocated** (background seal jobs) |
| Max instances | **2** |
| Max concurrent requests | **10** |
| Image (after Playwright fix) | `europe-west1-docker.pkg.dev/exalted-splicer-499401-e2/seamvex/documenso:latest` |

DB URLs: append `&connection_limit=5&pool_timeout=30&connect_timeout=15` to both `NEXT_PRIVATE_*_DATABASE_URL` vars.

---

## Apply signing env only (keeps current image)

```powershell
gcloud auth login
.\deploy\documenso\apply-signing-env.ps1
```

Uses `--env-vars-file` (safe for long base64). Does not touch `seamvex-website-2`.

---

## Full fix (custom image with Playwright/Chromium)

```powershell
gcloud auth login
.\deploy\documenso\generate-signing-cert.ps1
.\deploy\documenso\deploy.ps1
```

Cloud Shell (Alpine base — do **not** use `apt-get`):

```bash
gcloud config set project exalted-splicer-499401-e2
gcloud artifacts repositories create seamvex \
  --repository-format=docker --location=europe-west1 2>/dev/null || true
gcloud builds submit deploy/documenso --config=deploy/documenso/cloudbuild.yaml
```

Then set image to `europe-west1-docker.pkg.dev/exalted-splicer-499401-e2/seamvex/documenso:latest` and paste cert env vars (or run `apply-signing-env.ps1` from a machine with `.secrets/`).

---

## Verify

- Startup logs: **no** `Certificate not found or not readable`
- `https://sign.seamvex.com/api/health` — `checks.certificate.status` = ok
- Sign completes → **Everyone has signed** (not Processing)
- Documenso webhook → `https://seamvex.com/api/documenso/webhook` returns **200**
- seamvex.com order → **signed**; GCS PDF; Xero DRAFT

## Logs (if still stuck)

```
("seal-document" OR "playwright" OR "chromium" OR "BackgroundTask" OR "Memory limit")
```

See [documenso/documenso#2060](https://github.com/documenso/documenso/issues/2060).
