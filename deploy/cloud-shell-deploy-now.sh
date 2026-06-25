#!/usr/bin/env bash
# Deploy seamvex-website-2 NOW from Cloud Shell (no trigger needed).
# Run: curl -sL .../deploy/cloud-shell-deploy-now.sh | bash

set -euo pipefail
PROJECT=exalted-splicer-499401-e2
OWNER=stephaniemeechan
REPO=seamvex-website
DIR=seamvex-website

gcloud config set project "$PROJECT"

PN=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
CB="${PN}@cloudbuild.gserviceaccount.com"
RUN_SA="${PN}-compute@developer.gserviceaccount.com"
for M in "serviceAccount:${CB}" "serviceAccount:${RUN_SA}"; do
  for R in roles/run.admin roles/iam.serviceAccountUser roles/artifactregistry.writer roles/cloudsql.client; do
    gcloud projects add-iam-policy-binding "$PROJECT" \
      --member="$M" --role="$R" --quiet >/dev/null 2>&1 || true
  done
done

rm -rf "$DIR"
git clone "https://github.com/${OWNER}/${REPO}.git" "$DIR"
cd "$DIR"
SHA=$(git rev-parse HEAD)

echo "Building and deploying commit $SHA ..."
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=COMMIT_SHA="$SHA"

echo ""
echo "Done. Test login: https://seamvex.com/admin/login"
