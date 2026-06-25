#!/usr/bin/env bash
# Read-only facts for oauth_db — paste full output back. No fixes applied.
# Cloud Shell: bash deploy/cloud-shell-diagnose-oauth-db.sh
# Or: curl -sL https://raw.githubusercontent.com/stephaniemeechan/seamvex-website/main/deploy/cloud-shell-diagnose-oauth-db.sh | bash

set -euo pipefail
PROJECT=exalted-splicer-499401-e2
REGION=europe-west1
SERVICE=seamvex-website-2

gcloud config set project "$PROJECT" >/dev/null

echo "========== 1. Active revision =========="
gcloud run revisions list --service="$SERVICE" --region="$REGION" --limit=3 \
  --format="table(name,active,createTime,image)"

echo ""
echo "========== 2. Cloud Run service account =========="
gcloud run services describe "$SERVICE" --region="$REGION" \
  --format="value(spec.template.spec.serviceAccountName)" | sed 's/^$/ (default compute SA)/'

PN=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
echo "Default compute SA would be: ${PN}-compute@developer.gserviceaccount.com"

echo ""
echo "========== 3. Cloud SQL socket on service =========="
gcloud run services describe "$SERVICE" --region="$REGION" \
  --format="value(spec.template.metadata.annotations['run.googleapis.com/cloudsql-instances'])" \
  | sed 's/^$/NOT SET/'

echo ""
echo "========== 4. Env vars present (names + redacted values) =========="
gcloud run services describe "$SERVICE" --region="$REGION" \
  --format="json(spec.template.spec.containers[0].env)" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
env = data.get("spec", {}).get("template", {}).get("spec", {}).get("containers", [{}])[0].get("env", [])
check = {"DATABASE_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI",
         "SESSION_SECRET", "NEXT_PUBLIC_APP_URL", "ADMIN_EMAIL"}
for e in env:
    n = e.get("name", "")
    if n in check:
        v = e.get("value", e.get("valueFrom", "(secret ref)"))
        if n == "DATABASE_URL" and isinstance(v, str):
            # show host/socket only, hide password
            if "host=/cloudsql/" in v:
                print(f"  {n}: set (uses Cloud SQL socket: {v.split('host=')[1].split('&')[0]})")
            else:
                print(f"  {n}: set (no /cloudsql/ in URL — check format)")
        elif n in ("GOOGLE_CLIENT_SECRET", "SESSION_SECRET"):
            print(f"  {n}: {'set' if v else 'MISSING'}")
        else:
            print(f"  {n}: {v if v else 'MISSING'}")
for n in check:
    if not any(e.get("name") == n for e in env):
        print(f"  {n}: MISSING")
PY

echo ""
echo "========== 5. Run SA IAM: cloudsql.client? =========="
RUN_SA=$(gcloud run services describe "$SERVICE" --region="$REGION" \
  --format="value(spec.template.spec.serviceAccountName)")
RUN_SA="${RUN_SA:-${PN}-compute@developer.gserviceaccount.com}"
echo "Checking: $RUN_SA"
gcloud projects get-iam-policy "$PROJECT" --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${RUN_SA}" \
  --format="table(bindings.role)" | grep -i cloud || echo "  roles/cloudsql.client: NOT FOUND on this SA"

echo ""
echo "========== 6. Actual error from Cloud Run logs (last oauth_db attempts) =========="
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="seamvex-website-2" AND (textPayload:"Google OAuth callback failed" OR jsonPayload.message:"Google OAuth callback failed")' \
  --limit=10 --freshness=3d \
  --format="value(textPayload)" 2>/dev/null || \
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=seamvex-website-2 AND textPayload:Google" \
  --limit=20 --freshness=3d \
  --format="table(timestamp,textPayload)"

echo ""
echo "========== END — paste all output above =========="
