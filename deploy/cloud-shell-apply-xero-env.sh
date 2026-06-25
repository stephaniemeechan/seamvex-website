#!/usr/bin/env bash
# Apply Xero env to seamvex-website-2 from Cloud Shell (already authenticated).
# Set these in the shell before running — do not commit values:
#   export XERO_CLIENT_ID=...
#   export XERO_CLIENT_SECRET=...
#
#   bash deploy/cloud-shell-apply-xero-env.sh

set -euo pipefail
PROJECT=exalted-splicer-499401-e2
REGION=europe-west1
SERVICE=seamvex-website-2

: "${XERO_CLIENT_ID:?Set XERO_CLIENT_ID}"
: "${XERO_CLIENT_SECRET:?Set XERO_CLIENT_SECRET}"

gcloud config set project "$PROJECT"
gcloud run services update "$SERVICE" \
  --region="$REGION" \
  --update-env-vars="XERO_CLIENT_ID=${XERO_CLIENT_ID},XERO_CLIENT_SECRET=${XERO_CLIENT_SECRET},XERO_REDIRECT_URI=https://seamvex.com/api/xero/callback,XERO_SALES_ACCOUNT_CODE=200"

echo ""
echo "Done. https://seamvex.com/admin/settings -> Connect Xero"
