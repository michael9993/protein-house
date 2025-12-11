# Final comprehensive fix for Stripe app installation
# This ensures ALL services are configured correctly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Final Stripe Installation Fix" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Tunnel URLs
$apiTunnel = "https://linking-ipod-cup-embedded.trycloudflare.com/graphql/"
$dashboardTunnel = "https://sells-juice-soldier-kids.trycloudflare.com"
$stripeTunnel = "https://currencies-head-arabic-landscapes.trycloudflare.com"

Write-Host "Step 1: Creating/updating .env file..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot "..\.env"

@"
# Tunnel URLs Configuration
# API Tunnel URL (used by Dashboard, Storefront, and Stripe app)
DASHBOARD_API_URL=$apiTunnel
# Stripe App Tunnel URL
STRIPE_APP_URL=$stripeTunnel
"@ | Out-File -FilePath $envFile -Encoding utf8 -Force

Write-Host "  ✓ .env file created/updated" -ForegroundColor Green
Get-Content $envFile
Write-Host ""

Write-Host "Step 2: Fixing Dashboard first (it might be sending wrong URL to Stripe)..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml stop saleor-dashboard 2>&1 | Out-Null
docker compose -f docker-compose.dev.yml rm -f saleor-dashboard 2>&1 | Out-Null
docker compose -f docker-compose.dev.yml up -d saleor-dashboard
Write-Host "  ✓ Dashboard recreated" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Nuclear fix for Stripe app..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml stop saleor-stripe-app 2>&1 | Out-Null
docker compose -f docker-compose.dev.yml rm -f saleor-stripe-app 2>&1 | Out-Null
docker volume rm saleor-platform_stripe-app-next-cache -f 2>&1 | Out-Null
Write-Host "  ✓ Stripe app stopped, removed, cache cleared" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Recreating Stripe app..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml up -d saleor-stripe-app
Write-Host "  ✓ Stripe app recreated" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Waiting for services to start (35 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 35
Write-Host "  ✓ Wait complete" -ForegroundColor Green
Write-Host ""

Write-Host "Step 6: Verifying Dashboard environment..." -ForegroundColor Cyan
$dashboardEnv = docker compose -f docker-compose.dev.yml exec -T saleor-dashboard printenv API_URL VITE_API_URL 2>&1
if ($dashboardEnv) {
    $dashboardEnv -split "`n" | ForEach-Object {
        if ($_ -match "linking-ipod-cup-embedded") {
            Write-Host "  ✓ $_" -ForegroundColor Green
        }
        elseif ($_ -match "localhost:8000") {
            Write-Host "  ✗ $_ (WRONG - Dashboard still using localhost!)" -ForegroundColor Red
        }
        else {
            Write-Host "  $_" -ForegroundColor White
        }
    }
}
Write-Host ""

Write-Host "Step 7: Verifying Stripe app environment..." -ForegroundColor Cyan
$stripeEnv = docker compose -f docker-compose.dev.yml exec -T saleor-stripe-app sh -c "printenv NEXT_PUBLIC_SALEOR_API_URL APP_URL" 2>&1
if ($stripeEnv) {
    $stripeEnv -split "`n" | ForEach-Object {
        if ($_ -match "NEXT_PUBLIC_SALEOR_API_URL") {
            if ($_ -match "linking-ipod-cup-embedded") {
                Write-Host "  ✓ $_" -ForegroundColor Green
            }
            else {
                Write-Host "  ✗ $_ (WRONG!)" -ForegroundColor Red
            }
        }
        elseif ($_ -match "APP_URL") {
            if ($_ -match "currencies-head-arabic-landscapes") {
                Write-Host "  ✓ $_" -ForegroundColor Green
            }
            else {
                Write-Host "  ✗ $_ (WRONG!)" -ForegroundColor Red
            }
        }
        else {
            Write-Host "  $_" -ForegroundColor White
        }
    }
}
else {
    Write-Host "  ⚠ Could not read (service may still be starting)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "CRITICAL NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Wait 15 more seconds" -ForegroundColor White
Write-Host "2. Open Dashboard in a NEW incognito/private window:" -ForegroundColor White
Write-Host "   $dashboardTunnel" -ForegroundColor Cyan
Write-Host "3. Check browser DevTools (F12) → Network tab" -ForegroundColor White
Write-Host "   - GraphQL requests should go to: $apiTunnel" -ForegroundColor Cyan
Write-Host "   - NOT localhost:8000" -ForegroundColor Red
Write-Host "4. If Dashboard is using tunnel URL, try installing Stripe" -ForegroundColor White
Write-Host ""
Write-Host "If Dashboard is still using localhost:8000:" -ForegroundColor Red
Write-Host "- The .env file might not be in the right location" -ForegroundColor White
Write-Host "- Check: docker compose -f docker-compose.dev.yml config | Select-String DASHBOARD_API_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "If Stripe app environment is wrong:" -ForegroundColor Red
Write-Host "- The Stripe app code might be hardcoding the URL" -ForegroundColor White
Write-Host "- You may need to modify the Stripe app code directly" -ForegroundColor White
Write-Host ""

