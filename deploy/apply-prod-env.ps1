# Apply prod env to Cloud Run (Windows). No secrets in this file.
# Prerequisites: gcloud installed, gcloud auth login completed
#
#   node deploy/generate-prod-env.mjs
#   .\deploy\apply-prod-env.ps1

$ErrorActionPreference = "Stop"
$EnvFile = Join-Path $PSScriptRoot "cloud-run-env.prod.yaml"

if (-not (Test-Path $EnvFile)) {
  Write-Error "Missing $EnvFile - run: node deploy/generate-prod-env.mjs"
}

$Gcloud = Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (-not (Test-Path $Gcloud)) {
  $Gcloud = "gcloud"
}

& $Gcloud config set project exalted-splicer-499401-e2
& $Gcloud run services update seamvex-website-2 `
  --region=europe-west1 `
  --add-cloudsql-instances=exalted-splicer-499401-e2:europe-west1:free-trial-first-project `
  --env-vars-file=$EnvFile

Write-Host "Done."
Write-Host "Test OAuth: curl.exe -I https://seamvex.com/api/auth/google"
Write-Host "Then open admin login in browser."
