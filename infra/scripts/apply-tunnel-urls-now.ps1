# Quick script to apply tunnel URLs immediately
# This sets environment variables and restarts services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Applying Tunnel URLs Configuration" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Your current tunnel URLs
$apiTunnel = "https://linking-ipod-cup-embedded.trycloudflare.com/graphql/"
$dashboardTunnel = "https://sells-juice-soldier-kids.trycloudflare.com"
$stripeTunnel = "https://currencies-head-arabic-landscapes.trycloudflare.com"

Write-Host "Setting environment variables:" -ForegroundColor Yellow
Write-Host "  DASHBOARD_API_URL=$apiTunnel" -ForegroundColor White
Write-Host "  STRIPE_APP_URL=$stripeTunnel" -ForegroundColor White
Write-Host ""

# Set environment variables for current session
$env:DASHBOARD_API_URL = $apiTunnel
$env:STRIPE_APP_URL = $stripeTunnel

# Also create/update .env file for persistence
$envFile = Join-Path $PSScriptRoot "..\.env"
$envContent = @"
# Tunnel URLs Configuration
# Generated automatically
DASHBOARD_API_URL=$apiTunnel
STRIPE_APP_URL=$stripeTunnel
"@

if (Test-Path $envFile) {
    # Remove old tunnel config if exists
    $existingContent = Get-Content $envFile -Raw
    $lines = $existingContent -split "`n"
    $filteredLines = $lines | Where-Object { 
        $_ -notmatch "^# Tunnel URLs Configuration" -and
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

Write-Host "Configuration saved to .env file" -ForegroundColor Green
Write-Host ""
Write-Host "Restarting services..." -ForegroundColor Cyan
Write-Host ""

# Restart services with new environment variables
docker compose -f docker-compose.dev.yml restart saleor-dashboard saleor-storefront saleor-stripe-app

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Services Restarted!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait a few seconds for services to start, then:" -ForegroundColor Yellow
Write-Host "1. Open Dashboard: $dashboardTunnel" -ForegroundColor White
Write-Host "2. Check browser DevTools → Network tab" -ForegroundColor White
Write-Host "3. GraphQL requests should go to: $apiTunnel" -ForegroundColor White
Write-Host ""
Write-Host "If you still see localhost:8000, wait 10-15 seconds and refresh." -ForegroundColor Yellow
Write-Host ""
