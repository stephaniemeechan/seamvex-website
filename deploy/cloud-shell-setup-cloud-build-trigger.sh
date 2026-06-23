#!/usr/bin/env bash
# Run in GCP Cloud Shell: https://console.cloud.google.com/cloudshell/open?project=exalted-splicer-499401-e2
# Creates deploy-seamvex-website-2-main trigger OR prints exact fix if GitHub is not connected.

set -euo pipefail
PROJECT=exalted-splicer-499401-e2
REGION=europe-west1
TRIGGER=deploy-seamvex-website-2-main
OWNER=stephaniemeechan
REPO=seamvex-website

gcloud config set project "$PROJECT"

PN=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
CB="${PN}@cloudbuild.gserviceaccount.com"
SA="projects/${PROJECT}/serviceAccounts/${CB}"

for R in roles/run.admin roles/iam.serviceAccountUser roles/artifactregistry.writer roles/cloudsql.client; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:${CB}" --role="$R" --quiet >/dev/null 2>&1 || true
done

if gcloud builds triggers describe "$TRIGGER" --region="$REGION" &>/dev/null; then
  echo "Trigger $TRIGGER already exists in $REGION."
  gcloud builds triggers describe "$TRIGGER" --region="$REGION"
  exit 0
fi

echo "=== Checking GitHub repository connections ==="
REPO_RESOURCE=""
if gcloud builds repositories list --region="$REGION" --format="value(name)" 2>/dev/null | grep -qi seamvex; then
  REPO_RESOURCE=$(gcloud builds repositories list --region="$REGION" --format="value(name)" | grep -i seamvex | head -1)
  echo "Found 2nd-gen repo: $REPO_RESOURCE"
fi

create_trigger() {
  if [[ -n "$REPO_RESOURCE" ]]; then
    gcloud builds triggers create github \
      --name="$TRIGGER" \
      --region="$REGION" \
      --repository="$REPO_RESOURCE" \
      --branch-pattern="^main$" \
      --build-config="cloudbuild.yaml" \
      --service-account="$SA" \
      --description="Deploy seamvex-website-2 (ew1) on push to main"
  else
    gcloud builds triggers create github \
      --name="$TRIGGER" \
      --region="$REGION" \
      --repo-owner="$OWNER" \
      --repo-name="$REPO" \
      --branch-pattern="^main$" \
      --build-config="cloudbuild.yaml" \
      --service-account="$SA" \
      --description="Deploy seamvex-website-2 (ew1) on push to main"
  fi
}

if create_trigger 2>/tmp/trigger-err.txt; then
  echo ""
  echo "Done. Push to main or run:"
  echo "  gcloud builds triggers run $TRIGGER --branch=main --region=$REGION"
  exit 0
fi

echo ""
echo "Trigger create failed:"
cat /tmp/trigger-err.txt
echo ""
echo "=== FIX: connect GitHub to Cloud Build (one-time, browser) ==="
echo "  https://console.cloud.google.com/cloud-build/repositories/manage?project=${PROJECT}"
echo "  → Connect repository → GitHub → stephaniemeechan/seamvex-website → region ${REGION}"
echo "Then re-run this script."
echo ""
echo "=== OR deploy NOW without a trigger (from Cloud Shell) ==="
echo "  git clone https://github.com/${OWNER}/${REPO}.git && cd ${REPO}"
echo "  gcloud builds submit --config=cloudbuild.yaml --substitutions=COMMIT_SHA=\$(git rev-parse HEAD)"
exit 1
