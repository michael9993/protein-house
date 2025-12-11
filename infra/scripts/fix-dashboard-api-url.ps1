# Fix Dashboard API URL to use tunnel
# This script recreates the Dashboard container to pick up the new API URL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Dashboard API URL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ensure .env file exists with tunnel URL
$envFile = Join-Path $PSScriptRoot "..\.env"
$apiTunnel = "https://linking-ipod-cup-embedded.trycloudflare.com/graphql/"

if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
# Tunnel URLs Configuration
DASHBOARD_API_URL=$apiTunnel
STRIPE_APP_URL=https://currencies-head-arabic-landscapes.trycloudflare.com
"@ | Out-File -FilePath $envFile -Encoding utf8
} else {
    # Update existing .env file
    $content = Get-Content $envFile -Raw
    if ($content -notmatch "DASHBOARD_API_URL") {
        Add-Content -Path $envFile -Value "`nDASHBOARD_API_URL=$apiTunnel"
    } else {
        $content = $content -replace "DASHBOARD_API_URL=.*", "DASHBOARD_API_URL=$apiTunnel"
        Set-Content -Path $envFile -Value $content
    }
}

Write-Host "Current .env configuration:" -ForegroundColor Cyan
Get-Content $envFile | Select-String -Pattern "DASHBOARD_API_URL|STRIPE_APP_URL"
Write-Host ""

Write-Host "Recreating Dashboard container to apply new API URL..." -ForegroundColor Yellow
Write-Host ""

# Recreate the container (not just restart) to pick up new env vars
docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-dashboard

Write-Host ""
Write-Host "Waiting for Dashboard to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Checking Dashboard environment variables..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml exec -T saleor-dashboard printenv API_URL VITE_API_URL 2>$null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dashboard should now use tunnel URL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open Dashboard: https://sells-juice-soldier-kids.trycloudflare.com" -ForegroundColor White
Write-Host "2. Open browser DevTools (F12) → Network tab" -ForegroundColor White
Write-Host "3. Look for GraphQL requests - they should go to:" -ForegroundColor White
Write-Host "   $apiTunnel" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you still see localhost:8000:" -ForegroundColor Yellow
Write-Host "- Hard refresh the page (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "- Clear browser cache" -ForegroundColor White
Write-Host "- Wait 10-15 seconds and try again" -ForegroundColor White
Write-Host ""
