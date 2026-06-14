# Deploy seamvex-website to Cloud Run

Region: **europe-west1** only · Service: **seamvex-website** · Port: **8080**

## Option A — Cloud Build trigger (recommended; uses `cloudbuild.yaml`)

1. Cloud Build → Triggers → Create trigger
2. Event: push to branch `main`
3. Configuration: **Cloud Build configuration file** → `/cloudbuild.yaml`
4. Region: **europe-west1**
5. Push to GitHub → build runs → deploys with public auth + ingress

`cloudbuild.yaml` already sets `--allow-unauthenticated` and `--ingress all`.

## Option B — Cloud Run Connect repository

Cloud Run → Create service → Connect repository:

| Setting | Value |
|---------|-------|
| Region | **europe-west1** |
| Service name | **seamvex-website** |
| Build | **Dockerfile** at `/Dockerfile` |
| Port | **8080** |
| Authentication | **Allow unauthenticated invocations** |
| Ingress | **All** |

This path does **not** read `cloudbuild.yaml`. Wizard settings above are required.

## After deploy

1. Test `https://….run.app` — homepage loads (not 404/403)
2. Cloud Run → Domain mappings → add `seamvex.com` and `www.seamvex.com`
3. DNS: see [DNS-SETUP.md](./DNS-SETUP.md)

## Do not

- Create a second service in **europe-west2**
- Use Buildpacks (repo uses Dockerfile + Next.js standalone)
