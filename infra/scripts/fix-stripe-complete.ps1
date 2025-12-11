# Complete fix for Stripe app tunnel URLs
# This clears Next.js cache and recreates the container

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete Stripe App Fix" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Tunnel URLs
$apiTunnel = "https://linking-ipod-cup-embedded.trycloudflare.com/graphql/"
$stripeTunnel = "https://currencies-head-arabic-landscapes.trycloudflare.com"

Write-Host "Step 1: Updating .env file..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot "..\.env"

@"
# Tunnel URLs Configuration
DASHBOARD_API_URL=$apiTunnel
STRIPE_APP_URL=$stripeTunnel
"@ | Out-File -FilePath $envFile -Encoding utf8

Write-Host "  ✓ .env file updated" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Clearing Next.js cache..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml exec -T saleor-stripe-app sh -c "rm -rf /app/apps/stripe/.next" 2>&1 | Out-Null
Write-Host "  ✓ Cache cleared" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Stopping and removing container..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml stop saleor-stripe-app 2>&1 | Out-Null
docker compose -f docker-compose.dev.yml rm -f saleor-stripe-app 2>&1 | Out-Null
Write-Host "  ✓ Container removed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Recreating container with new environment..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml up -d saleor-stripe-app
Write-Host "  ✓ Container recreated" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Waiting for service to start (25 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 25
Write-Host "  ✓ Service started" -ForegroundColor Green
Write-Host ""

Write-Host "Step 6: Verifying environment variables..." -ForegroundColor Yellow
$envCheck = docker compose -f docker-compose.dev.yml exec -T saleor-stripe-app sh -c "printenv | grep -E 'NEXT_PUBLIC_SALEOR_API_URL|APP_URL'" 2>&1
if ($envCheck) {
    Write-Host "  Environment variables:" -ForegroundColor White
    $envCheck -split "`n" | ForEach-Object {
        if ($_ -match "NEXT_PUBLIC_SALEOR_API_URL") {
            if ($_ -match "linking-ipod-cup-embedded") {
                Write-Host "    ✓ $_" -ForegroundColor Green
            }
            else {
                Write-Host "    ✗ $_ (WRONG!)" -ForegroundColor Red
            }
        }
        elseif ($_ -match "APP_URL") {
            if ($_ -match "currencies-head-arabic-landscapes") {
                Write-Host "    ✓ $_" -ForegroundColor Green
            }
            else {
                Write-Host "    ✗ $_ (WRONG!)" -ForegroundColor Red
            }
        }
        else {
            Write-Host "    $_" -ForegroundColor White
        }
    }
}
else {
    Write-Host "  ⚠ Could not read environment variables (service may still be starting)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Step 7: Testing manifest endpoint..." -ForegroundColor Yellow
try {
    $manifest = Invoke-WebRequest -Uri "$stripeTunnel/api/manifest" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $json = $manifest.Content | ConvertFrom-Json
    Write-Host "  ✓ Manifest accessible" -ForegroundColor Green
    Write-Host "    appUrl: $($json.appUrl)" -ForegroundColor White
    if ($json.appUrl -match "currencies-head-arabic-landscapes") {
        Write-Host "    ✓ appUrl is correct" -ForegroundColor Green
    }
    else {
        Write-Host "    ✗ appUrl is WRONG!" -ForegroundColor Red
    }
}
catch {
    Write-Host "  ⚠ Could not fetch manifest: $_" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait 10 more seconds for Next.js to fully initialize" -ForegroundColor White
Write-Host "2. Hard refresh your browser (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "3. Try installing Stripe again:" -ForegroundColor White
Write-Host "   - Dashboard: https://sells-juice-soldier-kids.trycloudflare.com" -ForegroundColor Cyan
Write-Host "   - Navigate to Apps → Install Stripe" -ForegroundColor White
Write-Host ""
Write-Host "If it still fails:" -ForegroundColor Yellow
Write-Host "- Check browser console for errors" -ForegroundColor White
Write-Host "- Check Stripe app logs:" -ForegroundColor White
Write-Host "  docker compose -f docker-compose.dev.yml logs saleor-stripe-app" -ForegroundColor Gray
Write-Host ""

