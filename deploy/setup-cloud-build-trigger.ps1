# ONE-TIME: create Cloud Build trigger so git push deploys seamvex-website-2 via cloudbuild.yaml
# Prerequisites: gcloud auth login, GitHub already connected to Cloud Build in this project
#
#   .\deploy\setup-cloud-build-trigger.ps1

$ErrorActionPreference = "Stop"
$Project = "exalted-splicer-499401-e2"

$Gcloud = Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (-not (Test-Path $Gcloud)) { $Gcloud = "gcloud" }

& $Gcloud config set project $Project

Write-Host "Creating trigger deploy-seamvex-website-2-main ..."
$Region = "europe-west1"
$Pn = (& $Gcloud projects describe $Project --format="value(projectNumber)").Trim()
$Cb = "$Pn@cloudbuild.gserviceaccount.com"
$Sa = "projects/$Project/serviceAccounts/$Cb"

& $Gcloud builds triggers create github `
  --name="deploy-seamvex-website-2-main" `
  --region=$Region `
  --repo-owner="stephaniemeechan" `
  --repo-name="seamvex-website" `
  --branch-pattern="^main$" `
  --build-config="cloudbuild.yaml" `
  --service-account=$Sa `
  --description="Deploy seamvex-website-2 (ew1) on push to main"

Write-Host "Done. Push to main will run cloudbuild.yaml automatically."
