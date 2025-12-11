# Setup script for Stripe App
# This script clones the Saleor apps repository and sets up the Stripe app

Write-Host "Setting up Stripe App for Saleor..." -ForegroundColor Green

# Get the saleor-platform directory (where this script is located)
$platformDir = Split-Path -Parent (Split-Path -Parent (Get-Location))
$appsDir = Join-Path $platformDir "apps"

# Check if apps directory exists
if (Test-Path $appsDir) {
    Write-Host "Apps repository already exists at: $appsDir" -ForegroundColor Yellow
}
else {
    Write-Host "Cloning Saleor apps repository into saleor-platform..." -ForegroundColor Cyan
    Set-Location $platformDir
    git clone https://github.com/saleor/apps.git
    Write-Host "Apps repository cloned successfully!" -ForegroundColor Green
}

# Verify Stripe app exists
$stripeAppPath = Join-Path $appsDir "apps\stripe"
if (Test-Path $stripeAppPath) {
    Write-Host "Stripe app found at: $stripeAppPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Create a Saleor App in your Dashboard (http://localhost:9000)" -ForegroundColor White
    Write-Host "   - Go to Apps -> Create App" -ForegroundColor White
    Write-Host "   - Name: 'Stripe'" -ForegroundColor White
    Write-Host "   - Copy the App Token" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Get Stripe API keys from https://dashboard.stripe.com/test/apikeys" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Add environment variables to your .env file or docker-compose.dev.yml:" -ForegroundColor White
    Write-Host "   STRIPE_APP_TOKEN=your_token_from_dashboard" -ForegroundColor Gray
    Write-Host "   STRIPE_PUBLISHABLE_KEY=pk_test_..." -ForegroundColor Gray
    Write-Host "   STRIPE_SECRET_KEY=sk_test_..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Uncomment the saleor-stripe-app service in infra/docker-compose.dev.yml" -ForegroundColor White
    Write-Host ""
    Write-Host "5. Start the Stripe app:" -ForegroundColor White
    Write-Host "   docker compose -f infra/docker-compose.dev.yml up -d saleor-stripe-app" -ForegroundColor Gray
}
else {
    Write-Host "ERROR: Stripe app not found at: $stripeAppPath" -ForegroundColor Red
    Write-Host "Please check the apps repository structure." -ForegroundColor Yellow
}

Set-Location $platformDir

