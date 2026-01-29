# Generate RSA private key for Saleor webhook JWS signing.
# Append the output line to infra/.env (RSA_PRIVATE_KEY=...) so API and Worker use the same key.
# This fixes 401 SIGNATURE_VERIFICATION_FAILED when RSA_PRIVATE_KEY was not set (each container used a different key).

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Security
$rsa = [System.Security.Cryptography.RSA]::Create(2048)
$privateKeyBytes = $rsa.ExportRSAPrivateKey()
$b64 = [Convert]::ToBase64String($privateKeyBytes)
$pem = "-----BEGIN RSA PRIVATE KEY-----`n"
$offset = 0
while ($offset -lt $b64.Length) {
    $lineEnd = [Math]::Min($offset + 64, $b64.Length)
    $pem += $b64.Substring($offset, $lineEnd - $offset) + "`n"
    $offset = $lineEnd
}
$pem += "-----END RSA PRIVATE KEY-----"
$oneLine = $pem -replace "`r?`n", "\n"
Write-Host "Add this line to infra/.env (or replace existing RSA_PRIVATE_KEY=):"
Write-Host ""
Write-Host "RSA_PRIVATE_KEY=$oneLine"
Write-Host ""
