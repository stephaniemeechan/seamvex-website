# Build Documenso image with Playwright/Chromium via Cloud Build (no local Docker required).
# Then redeploy seamvex-documenso with signing cert env vars.
#
# Prerequisites: gcloud auth login
#
# Usage (from repo root):
#   .\deploy\documenso\generate-signing-cert.ps1
#   .\deploy\documenso\deploy.ps1

$ErrorActionPreference = "Stop"

$Project = "exalted-splicer-499401-e2"
$Region = "europe-west1"
$Service = "seamvex-documenso"
$Image = "$Region-docker.pkg.dev/$Project/seamvex/documenso:latest"
$CloudSql = "$Project`:$Region`:free-trial-first-project"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$SecretsDir = Join-Path $RepoRoot ".secrets\documenso"
$CertB64Path = Join-Path $SecretsDir "cert.b64.txt"
$PassphrasePath = Join-Path $SecretsDir "signing-passphrase.txt"

if (-not (Test-Path $CertB64Path) -or -not (Test-Path $PassphrasePath)) {
    Write-Host "Run generate-signing-cert.ps1 first."
    exit 1
}

$CertB64 = (Get-Content $CertB64Path -Raw).Trim()
$Passphrase = (Get-Content $PassphrasePath -Raw).Trim()

Write-Host "Ensuring Artifact Registry repo exists..."
gcloud artifacts repositories describe seamvex --location=$Region --project=$Project 2>$null
if ($LASTEXITCODE -ne 0) {
    gcloud artifacts repositories create seamvex `
        --repository-format=docker `
        --location=$Region `
        --project=$Project `
        --description="Seamvex container images"
}

Write-Host "Building image via Cloud Build (Playwright + Chromium)..."
gcloud builds submit $PSScriptRoot `
    --project=$Project `
    --config=(Join-Path $PSScriptRoot "cloudbuild.yaml") `
    --timeout=3600s

Write-Host "Reading current Cloud Run env vars..."
$current = gcloud run services describe $Service `
    --region=$Region `
    --project=$Project `
    --format="json" | ConvertFrom-Json

$envMap = @{}
foreach ($item in $current.spec.template.spec.containers[0].env) {
    if ($item.value) { $envMap[$item.name] = $item.value }
}

$envMap["NEXT_PRIVATE_SIGNING_PASSPHRASE"] = $Passphrase
$envMap["NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS"] = $CertB64

# Cloud Run --set-env-vars cannot handle commas in values; use env file instead.
$envFile = Join-Path $SecretsDir "cloud-run-env.yaml"
$lines = @()
foreach ($key in $envMap.Keys | Sort-Object) {
    $val = $envMap[$key] -replace '"', '\"'
    $lines += "${key}: `"$val`""
}
Set-Content $envFile ($lines -join "`n")

Write-Host "Deploying $Service..."
gcloud run deploy $Service `
    --image=$Image `
    --region=$Region `
    --project=$Project `
    --platform=managed `
    --allow-unauthenticated `
    --port=8080 `
    --add-cloudsql-instances=$CloudSql `
    --env-vars-file=$envFile

Write-Host "Done. Verify:"
Write-Host "  https://sign.seamvex.com/api/health"
Write-Host "  https://sign.seamvex.com/api/certificate-status"
