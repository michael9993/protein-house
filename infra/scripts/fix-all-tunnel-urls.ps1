# Comprehensive fix for all tunnel URL issues
# Fixes Dashboard, Storefront, and Stripe App to use tunnel URLs

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing All Tunnel URLs" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Your current tunnel URLs
$apiTunnel = "https://linking-ipod-cup-embedded.trycloudflare.com/graphql/"
$dashboardTunnel = "https://sells-juice-soldier-kids.trycloudflare.com"
$stripeTunnel = "https://currencies-head-arabic-landscapes.trycloudflare.com"

Write-Host "Configuring tunnel URLs:" -ForegroundColor Yellow
Write-Host "  API: $apiTunnel" -ForegroundColor White
Write-Host "  Dashboard: $dashboardTunnel" -ForegroundColor White
Write-Host "  Stripe: $stripeTunnel" -ForegroundColor White
Write-Host ""

# Create/update .env file
$envFile = Join-Path $PSScriptRoot "..\.env"

$envContent = @"
# Tunnel URLs Configuration
# Generated automatically - DO NOT EDIT MANUALLY
# API Tunnel URL (used by Dashboard, Storefront, and Stripe app)
DASHBOARD_API_URL=$apiTunnel
# Stripe App Tunnel URL (used for callbacks during installation)
STRIPE_APP_URL=$stripeTunnel
"@

if (Test-Path $envFile) {
    # Remove old tunnel config
    $content = Get-Content $envFile -Raw
    $lines = $content -split "`n"
    $filteredLines = $lines | Where-Object { 
        $_ -notmatch "^# Tunnel URLs Configuration" -and
        $_ -notmatch "^# Generated automatically" -and
        $_ -notmatch "^# DO NOT EDIT" -and
        $_ -notmatch "^DASHBOARD_API_URL=" -and
        $_ -notmatch "^STRIPE_APP_URL=" -and
        ($_.Trim() -ne "" -or ($prevLine -notmatch "^# Tunnel"))
    }
    $prevLine = ""
    $newContent = ($filteredLines | Where-Object { $_.Trim() -ne "" }) -join "`n"
    $newContent += "`n`n$envContent"
    Set-Content -Path $envFile -Value $newContent
}
else {
    Set-Content -Path $envFile -Value $envContent
}

Write-Host ".env file updated:" -ForegroundColor Green
Get-Content $envFile | Select-String -Pattern "DASHBOARD_API_URL|STRIPE_APP_URL"
Write-Host ""

Write-Host "Recreating all services to apply new URLs..." -ForegroundColor Yellow
Write-Host ""

# Recreate services (not just restart) to pick up new env vars
Write-Host "1. Recreating Dashboard..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-dashboard

Write-Host "2. Recreating Storefront..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-storefront

Write-Host "3. Recreating Stripe App..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-stripe-app

Write-Host ""
Write-Host "Waiting for services to start (20 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

Write-Host ""
Write-Host "Verifying configuration..." -ForegroundColor Cyan
Write-Host ""

# Check Dashboard
Write-Host "Dashboard environment:" -ForegroundColor Yellow
$dashboardEnv = docker compose -f docker-compose.dev.yml exec -T saleor-dashboard printenv API_URL VITE_API_URL 2>$null
if ($dashboardEnv) {
    $dashboardEnv | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
}
else {
    Write-Host "  (Could not read - service may still be starting)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Stripe App environment:" -ForegroundColor Yellow
$stripeEnv = docker compose -f docker-compose.dev.yml exec -T saleor-stripe-app sh -c "echo NEXT_PUBLIC_SALEOR_API_URL=\$NEXT_PUBLIC_SALEOR_API_URL && echo APP_URL=\$APP_URL" 2>$null
if ($stripeEnv) {
    $stripeEnv | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
}
else {
    Write-Host "  (Could not read - service may still be starting)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Wait 10-15 seconds for services to fully start" -ForegroundColor White
Write-Host ""
Write-Host "2. Test Dashboard:" -ForegroundColor White
Write-Host "   - Open: $dashboardTunnel" -ForegroundColor Cyan
Write-Host "   - Open DevTools (F12) → Network tab" -ForegroundColor White
Write-Host "   - GraphQL requests should go to: $apiTunnel" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Test Stripe App Installation:" -ForegroundColor White
Write-Host "   - Open Dashboard: $dashboardTunnel" -ForegroundColor Cyan
Write-Host "   - Navigate to Apps → Install Stripe" -ForegroundColor White
Write-Host "   - Or use manifest: $stripeTunnel/api/manifest" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. If you still see localhost:8000:" -ForegroundColor Yellow
Write-Host "   - Hard refresh browser (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "   - Clear browser cache" -ForegroundColor White
Write-Host "   - Wait 30 seconds and try again" -ForegroundColor White
Write-Host "   - Check service logs:" -ForegroundColor White
Write-Host "     docker compose -f docker-compose.dev.yml logs saleor-dashboard" -ForegroundColor Gray
Write-Host "     docker compose -f docker-compose.dev.yml logs saleor-stripe-app" -ForegroundColor Gray
Write-Host ""

