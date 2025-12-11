# Quick setup script for Stripe environment variables
# This script helps you set up your Stripe keys

Write-Host "Stripe App Environment Setup" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
$envFile = Join-Path (Get-Location) ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    New-Item -Path $envFile -ItemType File | Out-Null
}

Write-Host "Your Stripe keys have been saved to: infra/env-stripe-template.txt" -ForegroundColor Cyan
Write-Host ""
Write-Host "To add them to docker-compose, you can:" -ForegroundColor Yellow
Write-Host "1. Add them to a .env file in the project root" -ForegroundColor White
Write-Host "2. Or add them directly to docker-compose.dev.yml" -ForegroundColor White
Write-Host ""
Write-Host "For the webhook secret:" -ForegroundColor Yellow
Write-Host "1. Install Stripe CLI: https://stripe.com/docs/stripe-cli" -ForegroundColor White
Write-Host "2. Run: stripe login" -ForegroundColor White
Write-Host "3. Run: stripe listen --forward-to http://localhost:3001/api/webhooks/stripe" -ForegroundColor White
Write-Host "4. Copy the 'whsec_...' value that appears" -ForegroundColor White
Write-Host "5. Add it to STRIPE_WEBHOOK_SECRET" -ForegroundColor White
Write-Host ""
Write-Host "See docs/STRIPE_WEBHOOK_SETUP.md for detailed instructions" -ForegroundColor Cyan

