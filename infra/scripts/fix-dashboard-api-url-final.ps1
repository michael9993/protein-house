# Final fix for Dashboard API URL
# This ensures the Dashboard uses the tunnel URL and sends it to apps during installation

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Final Dashboard API URL Fix" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Current tunnel URLs
$apiTunnel = "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/"
$dashboardTunnel = "https://lately-tue-river-risks.trycloudflare.com"
$stripeTunnel = "https://indiana-decades-burn-cold.trycloudflare.com"

Write-Host "Step 1: Creating/updating .env file..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot "..\.env"

@"
# Tunnel URLs Configuration
# Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# CRITICAL: Dashboard's API_URL is embedded in HTML by Vite
# It MUST be the tunnel URL when accessing via tunnel
DASHBOARD_API_URL=$apiTunnel
STRIPE_APP_URL=$stripeTunnel
"@ | Out-File -FilePath $envFile -Encoding utf8 -Force

Write-Host "  ✓ .env file updated" -ForegroundColor Green
Write-Host "    DASHBOARD_API_URL=$apiTunnel" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 2: Stopping Dashboard..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml stop saleor-dashboard 2>&1 | Out-Null
Write-Host "  ✓ Stopped" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Removing Dashboard container..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml rm -f saleor-dashboard 2>&1 | Out-Null
Write-Host "  ✓ Removed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Setting environment variable explicitly..." -ForegroundColor Yellow
$env:DASHBOARD_API_URL = $apiTunnel
Write-Host "  ✓ Environment variable set for this session" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Recreating Dashboard with new environment..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml up -d saleor-dashboard
Write-Host "  ✓ Dashboard recreated" -ForegroundColor Green
Write-Host ""

Write-Host "Step 6: Waiting 45 seconds for Vite to fully start and generate HTML..." -ForegroundColor Yellow
Write-Host "  (Vite embeds API_URL in HTML, so we need to wait for it to regenerate)" -ForegroundColor Gray
Start-Sleep -Seconds 45
Write-Host "  ✓ Wait complete" -ForegroundColor Green
Write-Host ""

Write-Host "Step 7: Verifying Dashboard environment..." -ForegroundColor Cyan
$dashboardEnv = docker compose -f docker-compose.dev.yml exec -T saleor-dashboard printenv API_URL VITE_API_URL 2>&1
if ($dashboardEnv) {
    Write-Host "  Dashboard environment variables:" -ForegroundColor White
    $dashboardEnv -split "`n" | ForEach-Object {
        if ($_ -match "refugees-fleece-peterson-incurred") {
            Write-Host "    ✓ $_" -ForegroundColor Green
        }
        elseif ($_ -match "localhost:8000") {
            Write-Host "    ✗ $_ (STILL WRONG!)" -ForegroundColor Red
            Write-Host "      This means Docker Compose isn't reading the .env file!" -ForegroundColor Red
        }
        else {
            Write-Host "    $_" -ForegroundColor White
        }
    }
}
else {
    Write-Host "  ⚠ Could not read environment variables" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Step 8: Checking Dashboard HTML for API_URL..." -ForegroundColor Cyan
try {
    $html = Invoke-WebRequest -Uri "$dashboardTunnel" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    if ($html.Content -match "API_URL.*refugees-fleece-peterson-incurred") {
        Write-Host "  ✓ HTML contains tunnel URL" -ForegroundColor Green
    }
    elseif ($html.Content -match "API_URL.*localhost:8000") {
        Write-Host "  ✗ HTML still contains localhost:8000" -ForegroundColor Red
        Write-Host "    Vite hasn't regenerated the HTML yet - wait 30 more seconds" -ForegroundColor Yellow
    }
    else {
        Write-Host "  ⚠ Could not find API_URL in HTML" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  ⚠ Could not fetch Dashboard HTML: $_" -ForegroundColor Yellow
    Write-Host "    Dashboard may still be starting - wait 30 more seconds" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "CRITICAL NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open Dashboard in a NEW incognito/private window:" -ForegroundColor White
Write-Host "   $dashboardTunnel" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Open DevTools (F12) → Network tab" -ForegroundColor White
Write-Host ""
Write-Host "3. Look for GraphQL requests - they should go to:" -ForegroundColor White
Write-Host "   $apiTunnel" -ForegroundColor Cyan
Write-Host "   NOT localhost:8000" -ForegroundColor Red
Write-Host ""
Write-Host "4. If Dashboard is using tunnel URL, try installing Stripe:" -ForegroundColor White
Write-Host "   - Navigate to Extensions → Add Extension" -ForegroundColor White
Write-Host "   - Enter: $stripeTunnel/api/manifest" -ForegroundColor Cyan
Write-Host "   - Click Install" -ForegroundColor White
Write-Host ""
Write-Host "If Dashboard is STILL using localhost:8000:" -ForegroundColor Red
Write-Host "- The .env file might not be in the right location" -ForegroundColor White
Write-Host "- Docker Compose reads .env from the same directory as docker-compose.dev.yml" -ForegroundColor White
Write-Host "- Check: Get-Content infra\.env" -ForegroundColor Gray
Write-Host "- Try setting it explicitly: `$env:DASHBOARD_API_URL='$apiTunnel'; docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-dashboard" -ForegroundColor Gray
Write-Host ""
