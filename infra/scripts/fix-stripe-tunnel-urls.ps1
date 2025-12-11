# Fix Stripe App to use tunnel URLs
# This ensures the Stripe app can connect to Saleor API via tunnel during installation

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Stripe App Tunnel URLs" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Tunnel URLs
$apiTunnel = "https://linking-ipod-cup-embedded.trycloudflare.com/graphql/"
$stripeTunnel = "https://currencies-head-arabic-landscapes.trycloudflare.com"

Write-Host "Configuring:" -ForegroundColor Yellow
Write-Host "  API Tunnel: $apiTunnel" -ForegroundColor White
Write-Host "  Stripe App Tunnel: $stripeTunnel" -ForegroundColor White
Write-Host ""

# Update .env file
$envFile = Join-Path $PSScriptRoot "..\.env"

if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    
    # Update or add DASHBOARD_API_URL
    if ($content -match "DASHBOARD_API_URL=") {
        $content = $content -replace "DASHBOARD_API_URL=.*", "DASHBOARD_API_URL=$apiTunnel"
    }
    else {
        $content += "`nDASHBOARD_API_URL=$apiTunnel"
    }
    
    # Update or add STRIPE_APP_URL
    if ($content -match "STRIPE_APP_URL=") {
        $content = $content -replace "STRIPE_APP_URL=.*", "STRIPE_APP_URL=$stripeTunnel"
    }
    else {
        $content += "`nSTRIPE_APP_URL=$stripeTunnel"
    }
    
    Set-Content -Path $envFile -Value $content
}
else {
    @"
# Tunnel URLs Configuration
DASHBOARD_API_URL=$apiTunnel
STRIPE_APP_URL=$stripeTunnel
"@ | Out-File -FilePath $envFile -Encoding utf8
}

Write-Host ".env file updated:" -ForegroundColor Green
Get-Content $envFile | Select-String -Pattern "DASHBOARD_API_URL|STRIPE_APP_URL"
Write-Host ""

Write-Host "Recreating Stripe app container..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-stripe-app

Write-Host ""
Write-Host "Waiting for service to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Verifying environment variables..." -ForegroundColor Cyan
$envVars = docker compose -f docker-compose.dev.yml exec -T saleor-stripe-app printenv 2>$null
$envVars | Select-String -Pattern "NEXT_PUBLIC_SALEOR_API_URL|APP_URL" | ForEach-Object {
    Write-Host "  $_" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Stripe App Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The Stripe app should now:" -ForegroundColor Yellow
Write-Host "1. Connect to Saleor API via: $apiTunnel" -ForegroundColor White
Write-Host "2. Use its own tunnel URL: $stripeTunnel" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify manifest is accessible:" -ForegroundColor White
Write-Host "   $stripeTunnel/api/manifest" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Install the app in Dashboard:" -ForegroundColor White
Write-Host "   - Go to: https://sells-juice-soldier-kids.trycloudflare.com" -ForegroundColor Cyan
Write-Host "   - Navigate to Apps → Install Stripe" -ForegroundColor White
Write-Host "   - Or use manifest URL: $stripeTunnel/api/manifest" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. If installation still fails:" -ForegroundColor Yellow
Write-Host "   - Check browser console for errors" -ForegroundColor White
Write-Host "   - Verify CORS is allowing requests (should be * in dev)" -ForegroundColor White
Write-Host "   - Check Stripe app logs: docker compose -f docker-compose.dev.yml logs saleor-stripe-app" -ForegroundColor White
Write-Host ""

