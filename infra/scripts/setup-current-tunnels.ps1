# Quick setup script for current tunnel URLs
# Based on your current tunnel configuration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up Current Tunnel URLs" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Your current tunnel URLs
$apiTunnel = "https://linking-ipod-cup-embedded.trycloudflare.com"
$dashboardTunnel = "https://sells-juice-soldier-kids.trycloudflare.com"
$stripeTunnel = "https://currencies-head-arabic-landscapes.trycloudflare.com"

Write-Host "Configuring:" -ForegroundColor Yellow
Write-Host "  API: $apiTunnel" -ForegroundColor White
Write-Host "  Dashboard: $dashboardTunnel" -ForegroundColor White
Write-Host "  Stripe: $stripeTunnel" -ForegroundColor White
Write-Host ""

# Call the configure script
& "$PSScriptRoot\configure-tunnel-urls.ps1" `
    -ApiTunnelUrl $apiTunnel `
    -DashboardTunnelUrl $dashboardTunnel `
    -StripeTunnelUrl $stripeTunnel

Write-Host ""
Write-Host "Restarting services..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml restart saleor-dashboard saleor-storefront saleor-stripe-app

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your services should now work with tunnels:" -ForegroundColor Yellow
Write-Host "  Dashboard: $dashboardTunnel" -ForegroundColor White
Write-Host "  API: $apiTunnel/graphql/" -ForegroundColor White
Write-Host "  Stripe: $stripeTunnel" -ForegroundColor White
Write-Host ""
