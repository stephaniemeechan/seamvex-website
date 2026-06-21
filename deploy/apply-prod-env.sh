#!/usr/bin/env bash
# Apply prod env vars to live Cloud Run (no secrets in this script).
#
#   node deploy/generate-prod-env.mjs
#   bash deploy/apply-prod-env.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/deploy/cloud-run-env.prod.yaml"
PROJECT="exalted-splicer-499401-e2"
SQL="exalted-splicer-499401-e2:europe-west1:free-trial-first-project"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — run: node deploy/generate-prod-env.mjs" >&2
  exit 1
fi

gcloud config set project "$PROJECT"
gcloud run services update seamvex-website-2 \
  --region=europe-west1 \
  --add-cloudsql-instances="$SQL" \
  --env-vars-file="$ENV_FILE"

echo "Done."
echo "Test: curl -I https://seamvex.com/api/auth/google"
echo "Then open https://seamvex.com/admin/login"
