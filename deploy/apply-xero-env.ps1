# Apply Xero env vars to Cloud Run (prod only). Run after: gcloud auth login
#
#   .\deploy\apply-xero-env.ps1

$ErrorActionPreference = "Stop"
$Project = "exalted-splicer-499401-e2"
$Service = "seamvex-website-2"
$Region = "europe-west1"
$EnvFile = Join-Path $PSScriptRoot "xero-run-env.yaml"

if (-not (Test-Path $EnvFile)) {
  Write-Error "Missing xero-run-env.yaml - copy xero-run-env.yaml.example and fill Xero app creds."
}

$pairs = @()
foreach ($line in Get-Content $EnvFile) {
  if ($line -match '^([A-Z_]+):\s*"(.*)"\s*$') {
    $pairs += "$($matches[1])=$($matches[2])"
  }
}
if ($pairs.Count -eq 0) {
  Write-Error "No vars parsed from $EnvFile"
}
$UpdateEnv = $pairs -join ","

$Gcloud = Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (-not (Test-Path $Gcloud)) { $Gcloud = "gcloud" }

& $Gcloud config set project $Project
& $Gcloud run services update $Service --region=$Region --update-env-vars=$UpdateEnv

Write-Host "Done. Open https://seamvex.com/admin/settings and click Connect Xero."
