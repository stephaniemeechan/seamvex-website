# One-time: GCP service account + GitHub secret GCP_SA_KEY for Actions deploy (Option A)
#
#   gcloud auth login
#   .\deploy\setup-github-actions-deploy.ps1
#
# Requires: gcloud, gh (GitHub CLI) logged in as repo admin

$ErrorActionPreference = "Stop"
$Project = "exalted-splicer-499401-e2"
$SaName = "github-deploy"
$SaEmail = "$SaName@$Project.iam.gserviceaccount.com"
$KeyFile = Join-Path $PSScriptRoot "github-deploy-key.json"

$Gcloud = Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (-not (Test-Path $Gcloud)) { $Gcloud = "gcloud" }

& $Gcloud config set project $Project

Write-Host "Creating service account $SaName (skip if exists)..."
& $Gcloud iam service-accounts create $SaName `
  --display-name="GitHub Actions deploy seamvex-website-2" `
  2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "  (already exists or created)" }

$ProjectNumber = (& $Gcloud projects describe $Project --format="value(projectNumber)").Trim()
$CloudBuildSa = "$ProjectNumber@cloudbuild.gserviceaccount.com"

function Grant($Member, $Role) {
  Write-Host "  $Role -> $Member"
  & $Gcloud projects add-iam-policy-binding $Project `
    --member=$Member `
    --role=$Role `
    --quiet | Out-Null
}

Write-Host "IAM for GitHub submit SA..."
Grant "serviceAccount:$SaEmail" "roles/cloudbuild.builds.editor"
Grant "serviceAccount:$SaEmail" "roles/storage.admin"
Grant "serviceAccount:$SaEmail" "roles/serviceusage.serviceUsageConsumer"

Write-Host "IAM for Cloud Build deploy step..."
Grant "serviceAccount:$CloudBuildSa" "roles/run.admin"
Grant "serviceAccount:$CloudBuildSa" "roles/iam.serviceAccountUser"
Grant "serviceAccount:$CloudBuildSa" "roles/artifactregistry.writer"
Grant "serviceAccount:$CloudBuildSa" "roles/cloudsql.client"

Write-Host "Creating key -> $KeyFile"
if (Test-Path $KeyFile) { Remove-Item $KeyFile -Force }
& $Gcloud iam service-accounts keys create $KeyFile --iam-account=$SaEmail

Write-Host "Setting GitHub secret GCP_SA_KEY..."
$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
  Write-Host ""
  Write-Host "gh CLI not found. Add secret manually:"
  Write-Host "  GitHub -> Settings -> Secrets -> Actions -> GCP_SA_KEY"
  Write-Host "  Paste contents of: $KeyFile"
  Write-Host "Then delete $KeyFile"
  exit 0
}

Get-Content $KeyFile -Raw | gh secret set GCP_SA_KEY --repo stephaniemeechan/seamvex-website

Remove-Item $KeyFile -Force
Write-Host "Done. Push to main or run workflow manually in GitHub Actions."
