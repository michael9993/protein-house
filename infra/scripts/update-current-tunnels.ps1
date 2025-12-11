# Quick update script for your current tunnel URLs
# Run this whenever your tunnel URLs change

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Updating Current Tunnel URLs" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Your current tunnel URLs (update these when tunnels change)
$apiTunnel = "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/"
$dashboardTunnel = "https://lately-tue-river-risks.trycloudflare.com"
$stripeTunnel = "https://indiana-decades-burn-cold.trycloudflare.com"

Write-Host "Updating .env file with current tunnel URLs..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot "..\.env"

@"
# Tunnel URLs Configuration
# Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Update these URLs whenever you restart your tunnels
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

Write-Host "Recreating services to pick up new URLs..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-dashboard saleor-stripe-app saleor-storefront

Write-Host ""
Write-Host "  ✓ Services recreated" -ForegroundColor Green
Write-Host ""
Write-Host "Waiting 30 seconds for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "Verifying configuration..." -ForegroundColor Cyan
$dashboardEnv = docker compose -f docker-compose.dev.yml exec -T saleor-dashboard printenv API_URL 2>&1
$stripeEnv = docker compose -f docker-compose.dev.yml exec -T saleor-stripe-app sh -c "printenv NEXT_PUBLIC_SALEOR_API_URL" 2>&1

Write-Host ""
Write-Host "Dashboard API_URL:" -ForegroundColor Yellow
if ($dashboardEnv -match "refugees-fleece-peterson-incurred") {
    Write-Host "  ✓ $dashboardEnv" -ForegroundColor Green
}
else {
    Write-Host "  ✗ $dashboardEnv (WRONG!)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Stripe NEXT_PUBLIC_SALEOR_API_URL:" -ForegroundColor Yellow
if ($stripeEnv -match "refugees-fleece-peterson-incurred") {
    Write-Host "  ✓ $stripeEnv" -ForegroundColor Green
}
else {
    Write-Host "  ✗ $stripeEnv (WRONG!)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Update Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test your services:" -ForegroundColor Yellow
Write-Host "  Dashboard: $dashboardTunnel" -ForegroundColor Cyan
Write-Host "  API: $apiTunnel" -ForegroundColor Cyan
Write-Host "  Stripe: $stripeTunnel" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: CORS is configured to accept all origins, so you don't need to" -ForegroundColor Gray
Write-Host "update CORS settings when tunnel URLs change - just update the .env file!" -ForegroundColor Gray
Write-Host ""
