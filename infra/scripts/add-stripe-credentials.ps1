# Script to add Stripe credentials to docker-compose.dev.yml
# Usage: .\add-stripe-credentials.ps1 -AppToken "your_token" -WebhookSecret "whsec_..."

param(
    [Parameter(Mandatory = $false)]
    [string]$AppToken,
    
    [Parameter(Mandatory = $false)]
    [string]$WebhookSecret
)

$composeFile = "infra/docker-compose.dev.yml"

if (-not (Test-Path $composeFile)) {
    Write-Host "Error: docker-compose.dev.yml not found!" -ForegroundColor Red
    exit 1
}

$content = Get-Content $composeFile -Raw

# Update App Token
if ($AppToken) {
    $content = $content -replace 'SALEOR_APP_TOKEN: \$\{STRIPE_APP_TOKEN:-\}', "SALEOR_APP_TOKEN: `${STRIPE_APP_TOKEN:-$AppToken}"
    Write-Host "✓ App Token added" -ForegroundColor Green
}
else {
    Write-Host "⚠ App Token not provided (skipping)" -ForegroundColor Yellow
}

# Update Webhook Secret
if ($WebhookSecret) {
    $content = $content -replace 'STRIPE_WEBHOOK_SECRET: \$\{STRIPE_WEBHOOK_SECRET:-\}', "STRIPE_WEBHOOK_SECRET: `${STRIPE_WEBHOOK_SECRET:-$WebhookSecret}"
    Write-Host "✓ Webhook Secret added" -ForegroundColor Green
}
else {
    Write-Host "⚠ Webhook Secret not provided (skipping)" -ForegroundColor Yellow
}

# Save file
Set-Content -Path $composeFile -Value $content -NoNewline

Write-Host ""
Write-Host "Configuration updated!" -ForegroundColor Green
Write-Host "You can now start the Stripe app:" -ForegroundColor Yellow
Write-Host "  docker compose -f infra/docker-compose.dev.yml up -d saleor-stripe-app" -ForegroundColor Cyan

