# Stripe App Setup - Step by Step Guide
# Run this script and follow the instructions for each step

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STRIPE APP SETUP - STEP BY STEP" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stripe CLI
Write-Host "[STEP 1/5] Install Stripe CLI" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
$stripePath = Get-Command stripe -ErrorAction SilentlyContinue
if ($stripePath) {
    Write-Host "✓ Stripe CLI is installed!" -ForegroundColor Green
    Write-Host "  Location: $($stripePath.Source)" -ForegroundColor Gray
    & stripe --version
} else {
    Write-Host "✗ Stripe CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/stripe/stripe-cli/releases/latest" -ForegroundColor White
    Write-Host "2. Download: stripe_X.X.X_windows_x86_64.zip" -ForegroundColor White
    Write-Host "3. Extract to a folder (e.g., C:\tools\stripe)" -ForegroundColor White
    Write-Host "4. Add to PATH or use full path" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use Scoop (if installed):" -ForegroundColor Yellow
    Write-Host "  scoop install stripe" -ForegroundColor Cyan
}
Write-Host ""

# Step 2: App Token
Write-Host "[STEP 2/5] Get Saleor App Token" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "Follow these steps:" -ForegroundColor White
Write-Host "1. Open: http://localhost:9000" -ForegroundColor Cyan
Write-Host "2. Go to: Apps -> Create App" -ForegroundColor White
Write-Host "3. Name: 'Stripe'" -ForegroundColor White
Write-Host "4. Copy the App Token (starts with 'eyJ...')" -ForegroundColor White
Write-Host ""
Write-Host "Once you have the token, we'll add it to the config." -ForegroundColor Gray
Write-Host ""

# Step 3: Webhook Secret
Write-Host "[STEP 3/5] Get Webhook Secret" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
if ($stripePath) {
    Write-Host "After Stripe CLI is installed, run:" -ForegroundColor White
    Write-Host "  1. stripe login" -ForegroundColor Cyan
    Write-Host "  2. stripe listen --forward-to http://localhost:3001/api/webhooks/stripe" -ForegroundColor Cyan
    Write-Host "  3. Copy the 'whsec_...' value that appears" -ForegroundColor White
} else {
    Write-Host "First install Stripe CLI (Step 1)" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Update Config
Write-Host "[STEP 4/5] Update Configuration" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "We'll update docker-compose.dev.yml with:" -ForegroundColor White
Write-Host "  - STRIPE_APP_TOKEN" -ForegroundColor Gray
Write-Host "  - STRIPE_WEBHOOK_SECRET" -ForegroundColor Gray
Write-Host ""

# Step 5: Start App
Write-Host "[STEP 5/5] Start Stripe App" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "Once configured, run:" -ForegroundColor White
Write-Host "  docker compose -f infra/docker-compose.dev.yml up -d saleor-stripe-app" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ready to proceed? Let's start!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

