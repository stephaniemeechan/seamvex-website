# Add signing certificate env vars to seamvex-documenso ONLY.
# Does NOT touch Cloud Build triggers or seamvex-website-2.
#
# Prerequisites: gcloud auth login
#   .\deploy\documenso\generate-signing-cert.ps1   # first time
#   .\deploy\documenso\apply-signing-env.ps1

$ErrorActionPreference = "Stop"

$Project = "exalted-splicer-499401-e2"
$Region = "europe-west1"
$Service = "seamvex-documenso"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$SecretsDir = Join-Path $RepoRoot ".secrets\documenso"
$CertB64Path = Join-Path $SecretsDir "cert.b64.txt"
$PassphrasePath = Join-Path $SecretsDir "signing-passphrase.txt"

if (-not (Test-Path $CertB64Path) -or -not (Test-Path $PassphrasePath)) {
    Write-Host "Run .\deploy\documenso\generate-signing-cert.ps1 first."
    exit 1
}

$Passphrase = (Get-Content $PassphrasePath -Raw).Trim()
$CertB64 = (Get-Content $CertB64Path -Raw).Trim()

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

$envFile = Join-Path $SecretsDir "cloud-run-env.yaml"
$lines = @()
foreach ($key in $envMap.Keys | Sort-Object) {
    $val = $envMap[$key] -replace '"', '\"'
    $lines += "${key}: `"$val`""
}
Set-Content $envFile ($lines -join "`n")

Write-Host "Updating signing env vars on $Service (keeps current image + other vars)..."
gcloud run services update $Service `
    --region=$Region `
    --project=$Project `
    --env-vars-file=$envFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "gcloud failed (auth expired?). Use Cloud Run console instead — see deploy/documenso/README.md"
    exit $LASTEXITCODE
}

Write-Host "Done. Check:"
Write-Host "  https://sign.seamvex.com/api/certificate-status"
Write-Host "Startup logs must NOT show 'Certificate not found or not readable'."
