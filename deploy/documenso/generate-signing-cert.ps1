# Generate Documenso signing certificate (.p12) for Cloud Run.
# Uses OpenSSL -legacy (Documenso-compatible). Windows Export-PfxCertificate often fails at seal time.
# Output: .secrets/documenso/cert.p12 + cert.b64.txt + signing-passphrase.txt (gitignored)

$ErrorActionPreference = "Stop"
$OutDir = Join-Path $PSScriptRoot "..\..\.secrets\documenso"
$PassphraseFile = Join-Path $OutDir "signing-passphrase.txt"
$CertPath = Join-Path $OutDir "cert.p12"
$B64Path = Join-Path $OutDir "cert.b64.txt"
$KeyPem = Join-Path $OutDir "key.pem"
$CertPem = Join-Path $OutDir "cert.pem"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

if (Test-Path $PassphraseFile) {
    $Passphrase = (Get-Content $PassphraseFile -Raw).Trim()
} else {
    $Passphrase = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
    Set-Content $PassphraseFile $Passphrase -NoNewline
}

$openssl = Get-Command openssl -ErrorAction SilentlyContinue
if ($openssl) {
    & openssl req -x509 -newkey rsa:2048 -keyout $KeyPem -out $CertPem -days 3650 -nodes -subj "/CN=Seamvex Signing"
    & openssl pkcs12 -export -out $CertPath -inkey $KeyPem -in $CertPem -legacy -passout "pass:$Passphrase"
} else {
    $mount = (Resolve-Path $OutDir).Path
    docker run --rm -e "PASS=$Passphrase" -v "${mount}:/out" alpine:3.20 sh -c @"
apk add --no-cache openssl >/dev/null
openssl req -x509 -newkey rsa:2048 -keyout /out/key.pem -out /out/cert.pem -days 3650 -nodes -subj '/CN=Seamvex Signing'
openssl pkcs12 -export -out /out/cert.p12 -inkey /out/key.pem -in /out/cert.pem -legacy -passout pass:`$PASS
"@
}

[Convert]::ToBase64String([IO.File]::ReadAllBytes($CertPath)) | Set-Content $B64Path -NoNewline

Write-Host "Created $CertPath"
Write-Host "Passphrase saved to $PassphraseFile"
Write-Host "Base64 written to $B64Path"
Write-Host "Paste file CONTENTS into Cloud Run (not file paths)."
