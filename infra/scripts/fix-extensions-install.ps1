# Fix Stripe app installation via Extensions page
# This ensures Dashboard sends the correct tunnel URL to the Stripe app

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Extensions Installation" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Current tunnel URLs (update these when tunnels change)
$apiTunnel = "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/"
$dashboardTunnel = "https://lately-tue-river-risks.trycloudflare.com"
$stripeTunnel = "https://indiana-decades-burn-cold.trycloudflare.com"

Write-Host "Step 1: Updating .env file..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot "..\.env"

@"
# Tunnel URLs Configuration
# Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# CRITICAL: Dashboard's API_URL is sent to apps during installation
# It MUST be the tunnel URL when accessing via tunnel
DASHBOARD_API_URL=$apiTunnel
STRIPE_APP_URL=$stripeTunnel
"@ | Out-File -FilePath $envFile -Encoding utf8 -Force

Write-Host "  ✓ .env file updated" -ForegroundColor Green
Write-Host ""
Write-Host "Current URLs:" -ForegroundColor Yellow
Write-Host "  API: $apiTunnel" -ForegroundColor White
Write-Host "  Dashboard: $dashboardTunnel" -ForegroundColor White
Write-Host "  Stripe: $stripeTunnel" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Recreating Dashboard (CRITICAL - it sends API_URL to apps)..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml stop saleor-dashboard 2>&1 | Out-Null
docker compose -f docker-compose.dev.yml rm -f saleor-dashboard 2>&1 | Out-Null
docker compose -f docker-compose.dev.yml up -d saleor-dashboard

Write-Host "  ✓ Dashboard recreated" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Recreating Stripe app..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml stop saleor-stripe-app 2>&1 | Out-Null
docker compose -f docker-compose.dev.yml rm -f saleor-stripe-app 2>&1 | Out-Null
docker volume rm saleor-platform_stripe-app-next-cache -f 2>&1 | Out-Null
docker compose -f docker-compose.dev.yml up -d saleor-stripe-app

Write-Host "  ✓ Stripe app recreated" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Waiting for services to start (35 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 35

Write-Host ""
Write-Host "Step 5: Verifying configuration..." -ForegroundColor Cyan
Write-Host ""

# Check Dashboard
Write-Host "Dashboard API_URL (this is sent to apps during installation):" -ForegroundColor Yellow
$dashboardApiUrl = docker compose -f docker-compose.dev.yml exec -T saleor-dashboard printenv API_URL 2>&1
if ($dashboardApiUrl -match "refugees-fleece-peterson-incurred") {
    Write-Host "  ✓ $dashboardApiUrl" -ForegroundColor Green
    Write-Host "    Dashboard will send this URL to Stripe app during installation" -ForegroundColor Gray
}
elseif ($dashboardApiUrl -match "localhost:8000") {
    Write-Host "  ✗ $dashboardApiUrl (WRONG!)" -ForegroundColor Red
    Write-Host "    Dashboard is still using localhost - this will cause installation to fail!" -ForegroundColor Red
    Write-Host "    Check that .env file exists and has DASHBOARD_API_URL set" -ForegroundColor Yellow
}
else {
    Write-Host "  ⚠ $dashboardApiUrl" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Stripe app NEXT_PUBLIC_SALEOR_API_URL:" -ForegroundColor Yellow
$stripeApiUrl = docker compose -f docker-compose.dev.yml exec -T saleor-stripe-app sh -c "printenv NEXT_PUBLIC_SALEOR_API_URL" 2>&1
if ($stripeApiUrl -match "refugees-fleece-peterson-incurred") {
    Write-Host "  ✓ $stripeApiUrl" -ForegroundColor Green
}
elseif ($stripeApiUrl -match "localhost:8000") {
    Write-Host "  ✗ $stripeApiUrl (WRONG!)" -ForegroundColor Red
}
else {
    Write-Host "  ⚠ $stripeApiUrl" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "CRITICAL: The Dashboard's API_URL is what gets sent to apps during installation." -ForegroundColor Yellow
Write-Host "If Dashboard shows localhost:8000 above, installation will fail!" -ForegroundColor Red
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait 10 more seconds for services to fully start" -ForegroundColor White
Write-Host "2. Open Dashboard in a NEW incognito window:" -ForegroundColor White
Write-Host "   $dashboardTunnel" -ForegroundColor Cyan
Write-Host "3. Verify Dashboard is using tunnel URL:" -ForegroundColor White
Write-Host "   - Open DevTools (F12) → Network tab" -ForegroundColor White
Write-Host "   - Look for GraphQL requests" -ForegroundColor White
Write-Host "   - They should go to: $apiTunnel" -ForegroundColor Cyan
Write-Host "   - NOT localhost:8000" -ForegroundColor Red
Write-Host "4. If Dashboard is using tunnel URL, try installing Stripe:" -ForegroundColor White
Write-Host "   - Navigate to Extensions → Add Extension" -ForegroundColor White
Write-Host "   - Enter: $stripeTunnel/api/manifest" -ForegroundColor Cyan
Write-Host "   - Click Install" -ForegroundColor White
Write-Host ""
Write-Host "If Dashboard is still using localhost:8000:" -ForegroundColor Red
Write-Host "- Check .env file exists in infra/ directory" -ForegroundColor White
Write-Host "- Verify DASHBOARD_API_URL is set correctly" -ForegroundColor White
Write-Host "- Restart Dashboard: docker compose -f docker-compose.dev.yml restart saleor-dashboard" -ForegroundColor White
Write-Host ""
