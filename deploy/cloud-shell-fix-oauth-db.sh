#!/usr/bin/env bash
# Fix oauth_db: Cloud Run runtime SA needs cloudsql.client + Cloud SQL socket on service.
# Run in Cloud Shell: curl -sL .../deploy/cloud-shell-fix-oauth-db.sh | bash

set -euo pipefail
PROJECT=exalted-splicer-499401-e2
REGION=europe-west1
SERVICE=seamvex-website-2
SQL=exalted-splicer-499401-e2:europe-west1:free-trial-first-project

gcloud config set project "$PROJECT"

PN=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
DEFAULT_RUN_SA="${PN}-compute@developer.gserviceaccount.com"
RUN_SA=$(gcloud run services describe "$SERVICE" --region="$REGION" \
  --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || true)
RUN_SA="${RUN_SA:-$DEFAULT_RUN_SA}"

echo "Cloud Run service account: $RUN_SA"

gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${RUN_SA}" \
  --role="roles/cloudsql.client" \
  --quiet >/dev/null

echo "Ensuring Cloud SQL instance attached to $SERVICE ..."
gcloud run services update "$SERVICE" \
  --region="$REGION" \
  --add-cloudsql-instances="$SQL" \
  --quiet

echo ""
echo "=== Cloud SQL annotation ==="
gcloud run services describe "$SERVICE" --region="$REGION" \
  --format='value(spec.template.metadata.annotations[run.googleapis.com/cloudsql-instances])'

echo ""
echo "=== DATABASE_URL set? (name only) ==="
gcloud run services describe "$SERVICE" --region="$REGION" \
  --format='yaml(spec.template.spec.containers[0].env)' | grep -A1 DATABASE_URL || echo "DATABASE_URL not found — run apply-prod-env"

echo ""
echo "Done. Retry: https://seamvex.com/admin/login"
