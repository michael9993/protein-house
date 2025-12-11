# Complete Stripe App Setup Script
# This script automates the setup process for the Stripe app

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Stripe App Complete Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$projectRoot = Get-Location
$parentDir = Split-Path -Parent $projectRoot

# Step 1: Clone Apps Repository
Write-Host "[1/5] Checking Apps Repository..." -ForegroundColor Yellow
$appsDir = Join-Path $parentDir "apps"
if (-not (Test-Path $appsDir)) {
    Write-Host "  Cloning apps repository..." -ForegroundColor Cyan
    Set-Location $parentDir
    git clone https://github.com/saleor/apps.git
    Set-Location $projectRoot
    Write-Host "  ✓ Apps repository cloned" -ForegroundColor Green
} else {
    Write-Host "  ✓ Apps repository already exists" -ForegroundColor Green
}

# Step 2: Verify Stripe App
Write-Host "[2/5] Verifying Stripe App..." -ForegroundColor Yellow
$stripeAppPath = Join-Path $appsDir "apps\stripe"
if (Test-Path $stripeAppPath) {
    Write-Host "  ✓ Stripe app found at: $stripeAppPath" -ForegroundColor Green
} else {
    Write-Host "  ✗ Stripe app not found!" -ForegroundColor Red
    Write-Host "  Please check the apps repository structure" -ForegroundColor Yellow
    exit 1
}

# Step 3: Check Stripe CLI
Write-Host "[3/5] Checking Stripe CLI..." -ForegroundColor Yellow
$stripeCli = Get-Command stripe -ErrorAction SilentlyContinue
if ($stripeCli) {
    Write-Host "  ✓ Stripe CLI is installed" -ForegroundColor Green
    $stripeVersion = stripe --version 2>&1
    Write-Host "  Version: $stripeVersion" -ForegroundColor Gray
} else {
    Write-Host "  ✗ Stripe CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "  To install Stripe CLI:" -ForegroundColor Yellow
    Write-Host "  Option 1 (Chocolatey): choco install stripe" -ForegroundColor White
    Write-Host "  Option 2 (Scoop): scoop install stripe" -ForegroundColor White
    Write-Host "  Option 3 (Manual): https://github.com/stripe/stripe-cli/releases" -ForegroundColor White
    Write-Host ""
    Write-Host "  After installing, run this script again" -ForegroundColor Yellow
    exit 1
}

# Step 4: Check Docker Services
Write-Host "[4/5] Checking Docker Services..." -ForegroundColor Yellow
$apiRunning = docker compose -f infra/docker-compose.dev.yml ps saleor-api --format json 2>$null | ConvertFrom-Json | Select-Object -ExpandProperty State -ErrorAction SilentlyContinue
if ($apiRunning -eq "running") {
    Write-Host "  ✓ Saleor API is running" -ForegroundColor Green
} else {
    Write-Host "  ✗ Saleor API is not running" -ForegroundColor Red
    Write-Host "  Starting Saleor services..." -ForegroundColor Yellow
    docker compose -f infra/docker-compose.dev.yml up -d saleor-api
    Start-Sleep -Seconds 5
}

# Step 5: Instructions for Manual Steps
Write-Host "[5/5] Manual Steps Required" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps (Manual):" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. CREATE SALEOR APP TOKEN:" -ForegroundColor Yellow
Write-Host "   - Open: http://localhost:9000" -ForegroundColor White
Write-Host "   - Go to: Apps -> Create App" -ForegroundColor White
Write-Host "   - Name: 'Stripe'" -ForegroundColor White
Write-Host "   - Copy the App Token" -ForegroundColor White
Write-Host ""
Write-Host "2. GET WEBHOOK SECRET:" -ForegroundColor Yellow
Write-Host "   Run this command in a new terminal:" -ForegroundColor White
Write-Host "   stripe listen --forward-to http://localhost:3001/api/webhooks/stripe" -ForegroundColor Cyan
Write-Host "   Copy the 'whsec_...' value that appears" -ForegroundColor White
Write-Host ""
Write-Host "3. ADD TOKEN AND SECRET:" -ForegroundColor Yellow
Write-Host "   Add these to infra/docker-compose.dev.yml:" -ForegroundColor White
Write-Host "   STRIPE_APP_TOKEN: your_token_here" -ForegroundColor Gray
Write-Host "   STRIPE_WEBHOOK_SECRET: whsec_your_secret_here" -ForegroundColor Gray
Write-Host ""
Write-Host "   Or create a .env file in project root with:" -ForegroundColor White
Write-Host "   STRIPE_APP_TOKEN=your_token_here" -ForegroundColor Gray
Write-Host "   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here" -ForegroundColor Gray
Write-Host ""
Write-Host "4. START STRIPE APP:" -ForegroundColor Yellow
Write-Host "   docker compose -f infra/docker-compose.dev.yml up -d saleor-stripe-app" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. CONFIGURE IN DASHBOARD:" -ForegroundColor Yellow
Write-Host "   - Go to: http://localhost:9000 -> Apps -> Stripe" -ForegroundColor White
Write-Host "   - Add Configuration with your Stripe keys" -ForegroundColor White
Write-Host "   - Assign to your channel" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete (Automated Parts)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

