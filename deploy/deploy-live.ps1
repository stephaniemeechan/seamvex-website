# Deploy current HEAD image to live seamvex-website-2 (europe-west1).
#
# Git push to main currently builds only the ew2 orphan (seamvex-website).
# After push, run this to update production (seamvex.com).
#
#   git push origin main
#   # wait for Cloud Build on ew2 to finish (~5 min)
#   .\deploy\deploy-live.ps1
#
# Optional: .\deploy\deploy-live.ps1 -CommitSha abc123

param(
  [string]$CommitSha = ""
)

$ErrorActionPreference = "Stop"
$Project = "exalted-splicer-499401-e2"
$Service = "seamvex-website-2"
$Region = "europe-west1"

if (-not $CommitSha) {
  Push-Location (Join-Path $PSScriptRoot "..")
  $CommitSha = (git rev-parse HEAD).Trim()
  Pop-Location
}

$Image = "europe-west2-docker.pkg.dev/$Project/cloud-run-source-deploy/seamvex-website/seamvex-website:$CommitSha"

$Gcloud = Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (-not (Test-Path $Gcloud)) { $Gcloud = "gcloud" }

Write-Host "Deploying $Image -> $Service ($Region)"
& $Gcloud config set project $Project
& $Gcloud run deploy $Service `
  --image=$Image `
  --region=$Region `
  --platform=managed `
  --allow-unauthenticated `
  --ingress=all `
  --port=8080 `
  --min-instances=0 `
  --max-instances=10 `
  --quiet

Write-Host "Done. Run: pnpm go-live-smoke"
