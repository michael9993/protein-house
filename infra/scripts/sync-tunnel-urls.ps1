# Script to sync tunnel URLs across all services
# Ensures consistent URLs for Saleor API, Dashboard, Storefront, and Stripe App

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Syncing Tunnel URLs Across All Services" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get tunnel URLs from environment or prompt
$apiTunnel = $env:DASHBOARD_API_URL
$stripeTunnel = $env:STRIPE_APP_URL

if (-not $apiTunnel) {
    Write-Host "DASHBOARD_API_URL not set. Please provide your Saleor API tunnel URL." -ForegroundColor Yellow
    Write-Host "Example: https://your-api.trycloudflare.com/graphql/" -ForegroundColor Yellow
    $apiTunnel = Read-Host "Enter Saleor API tunnel URL (with /graphql/ suffix)"
}

if (-not $stripeTunnel) {
    Write-Host "STRIPE_APP_URL not set. Please provide your Stripe app tunnel URL." -ForegroundColor Yellow
    Write-Host "Example: https://your-app.trycloudflare.com" -ForegroundColor Yellow
    $stripeTunnel = Read-Host "Enter Stripe app tunnel URL"
}

if (-not $apiTunnel -or -not $stripeTunnel) {
    Write-Host "Error: Both API and Stripe tunnel URLs are required" -ForegroundColor Red
    exit 1
}

# Normalize URLs
$apiTunnel = $apiTunnel.TrimEnd('/')
if (-not $apiTunnel.EndsWith("/graphql/")) {
    if ($apiTunnel.EndsWith("/graphql")) {
        $apiTunnel = $apiTunnel + "/"
    }
    else {
        $apiTunnel = $apiTunnel + "/graphql/"
    }
}

$stripeTunnel = $stripeTunnel.TrimEnd('/')

Write-Host "Using URLs:" -ForegroundColor Green
Write-Host "  Saleor API: $apiTunnel" -ForegroundColor Gray
Write-Host "  Stripe App: $stripeTunnel" -ForegroundColor Gray
Write-Host ""

# Update .env file
Write-Host "Step 1: Updating .env file..." -ForegroundColor Cyan
$envFile = Join-Path $PSScriptRoot "..\.env"

# Read existing .env or create new
$envContent = @"
# Tunnel URLs Configuration
# These URLs are used across all services for consistent communication
DASHBOARD_API_URL=$apiTunnel
STRIPE_APP_URL=$stripeTunnel
"@

$envContent | Out-File -FilePath $envFile -Encoding utf8 -Force
Write-Host "  ✓ .env file updated" -ForegroundColor Green
Write-Host ""

# Set environment variables for current session
$env:DASHBOARD_API_URL = $apiTunnel
$env:STRIPE_APP_URL = $stripeTunnel
$env:NEXT_PUBLIC_SALEOR_API_URL = $apiTunnel
$env:APP_API_BASE_URL = $stripeTunnel

Write-Host "Step 2: Restarting services to pick up new URLs..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-stripe-app saleor-dashboard saleor-storefront

Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

Write-Host "Step 3: Verifying environment variables in containers..." -ForegroundColor Cyan

# Check Stripe app
Write-Host "`n  Stripe App:" -ForegroundColor White
$stripeEnv = docker compose -f docker-compose.dev.yml exec -T saleor-stripe-app sh -c "printenv NEXT_PUBLIC_SALEOR_API_URL APP_API_BASE_URL" 2>&1
if ($stripeEnv) {
    $stripeEnv -split "`n" | ForEach-Object {
        if ($_ -match "NEXT_PUBLIC_SALEOR_API_URL") {
            if ($_ -match "trycloudflare.com") {
                Write-Host "    ✓ NEXT_PUBLIC_SALEOR_API_URL: $_" -ForegroundColor Green
            }
            else {
                Write-Host "    ⚠ NEXT_PUBLIC_SALEOR_API_URL: $_ (still localhost)" -ForegroundColor Yellow
            }
        }
        elseif ($_ -match "APP_API_BASE_URL") {
            if ($_ -match "trycloudflare.com") {
                Write-Host "    ✓ APP_API_BASE_URL: $_" -ForegroundColor Green
            }
            else {
                Write-Host "    ⚠ APP_API_BASE_URL: $_ (still localhost)" -ForegroundColor Yellow
            }
        }
    }
}

# Check Dashboard
Write-Host "`n  Dashboard:" -ForegroundColor White
$dashboardEnv = docker compose -f docker-compose.dev.yml exec -T saleor-dashboard sh -c "printenv NEXT_PUBLIC_SALEOR_API_URL" 2>&1
if ($dashboardEnv) {
    $dashboardEnv -split "`n" | ForEach-Object {
        if ($_ -match "NEXT_PUBLIC_SALEOR_API_URL") {
            if ($_ -match "trycloudflare.com") {
                Write-Host "    ✓ NEXT_PUBLIC_SALEOR_API_URL: $_" -ForegroundColor Green
            }
            else {
                Write-Host "    ⚠ NEXT_PUBLIC_SALEOR_API_URL: $_ (still localhost)" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host "`nStep 4: Testing Stripe app manifest..." -ForegroundColor Cyan
try {
    $manifestUrl = "$stripeTunnel/api/manifest"
    $response = Invoke-WebRequest -Uri $manifestUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $manifest = $response.Content | ConvertFrom-Json
    
    Write-Host "  ✓ Manifest accessible" -ForegroundColor Green
    Write-Host "    appUrl: $($manifest.appUrl)" -ForegroundColor Gray
    
    if ($manifest.appUrl -match "trycloudflare.com") {
        Write-Host "    ✓ appUrl uses tunnel URL" -ForegroundColor Green
    }
    else {
        Write-Host "    ⚠ appUrl still uses localhost: $($manifest.appUrl)" -ForegroundColor Yellow
    }
    
    if ($manifest.webhooks) {
        Write-Host "`n    Webhook URLs:" -ForegroundColor Cyan
        foreach ($webhook in $manifest.webhooks) {
            $webhookUrl = $webhook.targetUrl
            if ($webhookUrl -match "trycloudflare.com") {
                Write-Host "      ✓ $($webhook.name): $webhookUrl" -ForegroundColor Green
            }
            else {
                Write-Host "      ⚠ $($webhook.name): $webhookUrl (still localhost)" -ForegroundColor Yellow
            }
        }
    }
}
catch {
    Write-Host "  ⚠ Could not fetch manifest: $_" -ForegroundColor Yellow
    Write-Host "    Wait 10 more seconds and try again" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "URL Sync Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Reinstall the Stripe app in Saleor Dashboard to update JWKS" -ForegroundColor White
Write-Host "2. Run webhook migration: docker compose -f docker-compose.dev.yml exec saleor-stripe-app pnpm run migrate" -ForegroundColor White
Write-Host "3. Test a payment to verify everything works" -ForegroundColor White
Write-Host ""
Write-Host "To verify JWKS is stored correctly:" -ForegroundColor Yellow
Write-Host '  docker compose -f docker-compose.dev.yml exec postgres psql -U saleor -d stripe_app -c "SELECT saleor_api_url, LEFT(jwks, 50) as jwks_preview FROM auth_data;"' -ForegroundColor Cyan
Write-Host ""
