#!/usr/bin/env bash
# Run in GCP Cloud Shell: https://console.cloud.google.com/cloudshell/open?project=exalted-splicer-499401-e2
# Creates deploy-seamvex-website-2-main trigger (push main → cloudbuild.yaml → seamvex-website-2 ew1).

set -euo pipefail
PROJECT=exalted-splicer-499401-e2
TRIGGER=deploy-seamvex-website-2-main

gcloud config set project "$PROJECT"

if gcloud builds triggers describe "$TRIGGER" --region=global &>/dev/null; then
  echo "Trigger $TRIGGER already exists."
  gcloud builds triggers describe "$TRIGGER" --region=global
  exit 0
fi

gcloud builds triggers create github \
  --name="$TRIGGER" \
  --repo-owner="stephaniemeechan" \
  --repo-name="seamvex-website" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --description="Deploy seamvex-website-2 (ew1) on push to main"

PN=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
CB="${PN}@cloudbuild.gserviceaccount.com"
for R in roles/run.admin roles/iam.serviceAccountUser roles/artifactregistry.writer roles/cloudsql.client; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:${CB}" --role="$R" --quiet >/dev/null || true
done

echo ""
echo "Done. Push to main or run:"
echo "  gcloud builds triggers run $TRIGGER --branch=main --region=global"
