#!/usr/bin/env bash
# Deploy current HEAD image to live seamvex-website-2 (europe-west1).
#
# Git push builds the ew2 orphan only — run this after push to update seamvex.com.
#
#   git push origin main
#   bash deploy/deploy-live.sh [COMMIT_SHA]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="exalted-splicer-499401-e2"
SERVICE="seamvex-website-2"
REGION="europe-west1"
COMMIT_SHA="${1:-$(cd "$ROOT" && git rev-parse HEAD)}"
IMAGE="europe-west2-docker.pkg.dev/$PROJECT/cloud-run-source-deploy/seamvex-website/seamvex-website:$COMMIT_SHA"

echo "Deploying $IMAGE -> $SERVICE ($REGION)"
gcloud config set project "$PROJECT"
gcloud run deploy "$SERVICE" \
  --image="$IMAGE" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --ingress=all \
  --port=8080 \
  --min-instances=0 \
  --max-instances=10 \
  --quiet

echo "Done. Run: pnpm go-live-smoke"
