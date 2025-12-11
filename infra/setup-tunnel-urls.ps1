# ========================================
# Saleor Platform - Tunnel URL Setup
# ========================================
# This script helps you configure tunnel URLs for your Saleor platform
# It creates/updates the .env file with your tunnel URLs

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Saleor Platform - Tunnel URL Setup" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

$envFile = Join-Path $PSScriptRoot ".env"
$envExampleFile = Join-Path $PSScriptRoot ".env.example"

# Check if .env already exists
if (Test-Path $envFile) {
    Write-Host "⚠️  .env file already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "`nExiting without changes." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "`nThis script will help you configure tunnel URLs for:" -ForegroundColor White
Write-Host "  1. Saleor API (GraphQL endpoint)" -ForegroundColor Gray
Write-Host "  2. Dashboard" -ForegroundColor Gray
Write-Host "  3. Storefront" -ForegroundColor Gray
Write-Host "  4. Stripe App" -ForegroundColor Gray
Write-Host "`nYou can:" -ForegroundColor White
Write-Host "  - Use localhost URLs for local development (default)" -ForegroundColor Gray
Write-Host "  - Use tunnel URLs (Cloudflare, ngrok, etc.) for external access" -ForegroundColor Gray
Write-Host ""

# Prompt for setup type
Write-Host "Choose setup type:" -ForegroundColor Yellow
Write-Host "  1. Local development (localhost URLs)" -ForegroundColor White
Write-Host "  2. Tunnel URLs (Cloudflare, ngrok, etc.)" -ForegroundColor White
$setupType = Read-Host "`nEnter choice (1 or 2)"

if ($setupType -eq "1") {
    Write-Host "`nUsing localhost URLs for local development..." -ForegroundColor Green
    
    # Copy from .env.example
    if (Test-Path $envExampleFile) {
        Copy-Item $envExampleFile $envFile
        Write-Host "✓ Created .env from .env.example" -ForegroundColor Green
    }
    else {
        # Create minimal .env with localhost defaults
        @"
# Saleor Platform - Local Development Configuration
SALEOR_API_URL=http://localhost:8000/graphql/
PUBLIC_URL=http://localhost:8000
DASHBOARD_API_URL=http://localhost:8000/graphql/
DASHBOARD_URL=http://localhost:9000
STOREFRONT_URL=http://localhost:3000
STRIPE_APP_URL=http://localhost:3002
"@ | Out-File -FilePath $envFile -Encoding utf8
        Write-Host "✓ Created .env with localhost URLs" -ForegroundColor Green
    }
    
    Write-Host "`n✅ Setup complete!" -ForegroundColor Green
    Write-Host "`nYour services will use localhost URLs." -ForegroundColor White
    Write-Host "To start: docker compose -f docker-compose.dev.yml up -d" -ForegroundColor Cyan
}
elseif ($setupType -eq "2") {
    Write-Host "`nEnter your tunnel URLs:" -ForegroundColor Yellow
    Write-Host "(Press Enter to keep localhost as fallback)" -ForegroundColor Gray
    Write-Host ""
    
    # Prompt for each URL
    Write-Host "Saleor API tunnel URL (base URL):" -ForegroundColor Cyan
    Write-Host "  Example: https://your-api.trycloudflare.com" -ForegroundColor Gray
    $apiUrl = Read-Host "URL"
    if (-not $apiUrl) {
        $apiUrl = "http://localhost:8000"
    }
    # Ensure no /graphql/ suffix for PUBLIC_URL
    $apiUrl = $apiUrl.TrimEnd('/')
    $apiUrl = $apiUrl -replace '/graphql/?$', ''
    $publicUrl = $apiUrl
    $apiGraphqlUrl = "$apiUrl/graphql/"
    
    Write-Host "`nDashboard tunnel URL:" -ForegroundColor Cyan
    Write-Host "  Example: https://your-dashboard.trycloudflare.com" -ForegroundColor Gray
    $dashboardUrl = Read-Host "URL"
    if (-not $dashboardUrl) {
        $dashboardUrl = "http://localhost:9000"
    }
    $dashboardUrl = $dashboardUrl.TrimEnd('/')
    
    Write-Host "`nStorefront tunnel URL:" -ForegroundColor Cyan
    Write-Host "  Example: https://your-storefront.trycloudflare.com" -ForegroundColor Gray
    $storefrontUrl = Read-Host "URL"
    if (-not $storefrontUrl) {
        $storefrontUrl = "http://localhost:3000"
    }
    $storefrontUrl = $storefrontUrl.TrimEnd('/')
    
    Write-Host "`nStripe App tunnel URL:" -ForegroundColor Cyan
    Write-Host "  Example: https://your-stripe-app.trycloudflare.com" -ForegroundColor Gray
    $stripeAppUrl = Read-Host "URL"
    if (-not $stripeAppUrl) {
        $stripeAppUrl = "http://localhost:3002"
    }
    $stripeAppUrl = $stripeAppUrl.TrimEnd('/')
    
    # Optional: Stripe API keys
    Write-Host "`n[Optional] Stripe API Keys:" -ForegroundColor Yellow
    Write-Host "Get from: https://dashboard.stripe.com/test/apikeys" -ForegroundColor Gray
    $stripePublishable = Read-Host "Stripe Publishable Key (or press Enter to skip)"
    $stripeSecret = Read-Host "Stripe Secret Key (or press Enter to skip)"
    $stripeWebhookSecret = Read-Host "Stripe Webhook Secret (or press Enter to skip)"
    
    # Create .env file
    $envContent = @"
# ========================================
# Saleor Platform - Tunnel Configuration
# ========================================
# Generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Saleor API Configuration
SALEOR_API_URL=$apiGraphqlUrl
PUBLIC_URL=$publicUrl
DASHBOARD_API_URL=$apiGraphqlUrl

# Dashboard Configuration
DASHBOARD_URL=$dashboardUrl

# Storefront Configuration
STOREFRONT_URL=$storefrontUrl

# Stripe App Configuration
STRIPE_APP_URL=$stripeAppUrl
"@

    if ($stripePublishable) {
        $envContent += "`n`n# Stripe API Keys"
        $envContent += "`nSTRIPE_PUBLISHABLE_KEY=$stripePublishable"
    }
    if ($stripeSecret) {
        $envContent += "`nSTRIPE_SECRET_KEY=$stripeSecret"
    }
    if ($stripeWebhookSecret) {
        $envContent += "`nSTRIPE_WEBHOOK_SECRET=$stripeWebhookSecret"
    }
    
    $envContent | Out-File -FilePath $envFile -Encoding utf8
    
    Write-Host "`n✅ Configuration saved to .env" -ForegroundColor Green
    Write-Host "`nYour tunnel URLs:" -ForegroundColor White
    Write-Host "  Saleor API:  $apiGraphqlUrl" -ForegroundColor Cyan
    Write-Host "  Dashboard:   $dashboardUrl" -ForegroundColor Cyan
    Write-Host "  Storefront:  $storefrontUrl" -ForegroundColor Cyan
    Write-Host "  Stripe App:  $stripeAppUrl" -ForegroundColor Cyan
    
    Write-Host "`n⚠️  IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Start your tunnel services (cloudflared, ngrok, etc.)" -ForegroundColor White
    Write-Host "2. Restart Docker containers: docker compose -f docker-compose.dev.yml up -d --force-recreate" -ForegroundColor White
    Write-Host "3. Reinstall the Stripe app in Saleor Dashboard" -ForegroundColor White
    Write-Host "4. Run webhook migration: docker compose -f docker-compose.dev.yml exec saleor-stripe-app pnpm run migrate" -ForegroundColor White
}
else {
    Write-Host "`n❌ Invalid choice. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

