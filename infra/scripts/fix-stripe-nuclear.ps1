# Nuclear option: Complete reset of Stripe app
# This removes ALL caches and recreates everything from scratch

Write-Host "========================================" -ForegroundColor Red
Write-Host "NUCLEAR FIX: Complete Stripe App Reset" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Update .env file" -ForegroundColor White
Write-Host "  2. Stop and remove Stripe app container" -ForegroundColor White
Write-Host "  3. Remove Next.js cache volume" -ForegroundColor White
Write-Host "  4. Clear any cached environment variables" -ForegroundColor White
Write-Host "  5. Recreate everything from scratch" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continue? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 1: Updating .env file..." -ForegroundColor Cyan
$envFile = Join-Path $PSScriptRoot "..\.env"

$apiTunnel = "https://linking-ipod-cup-embedded.trycloudflare.com/graphql/"
$stripeTunnel = "https://currencies-head-arabic-landscapes.trycloudflare.com"

@"
# Tunnel URLs Configuration
DASHBOARD_API_URL=$apiTunnel
STRIPE_APP_URL=$stripeTunnel
"@ | Out-File -FilePath $envFile -Encoding utf8 -Force

Write-Host "  ✓ .env file updated" -ForegroundColor Green
Write-Host "    DASHBOARD_API_URL=$apiTunnel" -ForegroundColor Gray
Write-Host "    STRIPE_APP_URL=$stripeTunnel" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 2: Stopping Stripe app..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml stop saleor-stripe-app 2>&1 | Out-Null
Write-Host "  ✓ Stopped" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Removing container..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml rm -f saleor-stripe-app 2>&1 | Out-Null
Write-Host "  ✓ Removed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Removing Next.js cache volume..." -ForegroundColor Cyan
docker volume rm saleor-platform_stripe-app-next-cache -f 2>&1 | Out-Null
Write-Host "  ✓ Cache volume removed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Clearing any remaining cache in mounted volume..." -ForegroundColor Cyan
# Try to clear cache if container was running
docker run --rm -v saleor-platform_apps:/app alpine sh -c "rm -rf /app/apps/stripe/.next" 2>&1 | Out-Null
Write-Host "  ✓ Cache cleared" -ForegroundColor Green
Write-Host ""

Write-Host "Step 6: Recreating container with fresh environment..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml up -d saleor-stripe-app
Write-Host "  ✓ Container recreated" -ForegroundColor Green
Write-Host ""

Write-Host "Step 7: Waiting for service to fully start (30 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 30
Write-Host "  ✓ Wait complete" -ForegroundColor Green
Write-Host ""

Write-Host "Step 8: Verifying environment variables..." -ForegroundColor Cyan
$envCheck = docker compose -f docker-compose.dev.yml exec -T saleor-stripe-app sh -c "printenv NEXT_PUBLIC_SALEOR_API_URL APP_URL" 2>&1
if ($envCheck) {
    Write-Host "  Environment variables in container:" -ForegroundColor White
    $envCheck -split "`n" | ForEach-Object {
        if ($_ -match "NEXT_PUBLIC_SALEOR_API_URL") {
            if ($_ -match "linking-ipod-cup-embedded") {
                Write-Host "    ✓ $_" -ForegroundColor Green
            }
            else {
                Write-Host "    ✗ $_ (STILL WRONG!)" -ForegroundColor Red
                Write-Host "      This means the .env file isn't being read!" -ForegroundColor Red
            }
        }
        elseif ($_ -match "APP_URL") {
            if ($_ -match "currencies-head-arabic-landscapes") {
                Write-Host "    ✓ $_" -ForegroundColor Green
            }
            else {
                Write-Host "    ✗ $_ (STILL WRONG!)" -ForegroundColor Red
            }
        }
        else {
            Write-Host "    $_" -ForegroundColor White
        }
    }
}
else {
    Write-Host "  ⚠ Could not read environment variables" -ForegroundColor Yellow
    Write-Host "    Service may still be starting. Wait 10 more seconds and check:" -ForegroundColor Yellow
    Write-Host "    docker compose -f docker-compose.dev.yml exec saleor-stripe-app printenv NEXT_PUBLIC_SALEOR_API_URL" -ForegroundColor Gray
}
Write-Host ""

Write-Host "Step 9: Testing manifest endpoint..." -ForegroundColor Cyan
try {
    $manifest = Invoke-WebRequest -Uri "$stripeTunnel/api/manifest" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $json = $manifest.Content | ConvertFrom-Json
    Write-Host "  ✓ Manifest accessible" -ForegroundColor Green
    Write-Host "    appUrl: $($json.appUrl)" -ForegroundColor White
    if ($json.appUrl -match "currencies-head-arabic-landscapes") {
        Write-Host "    ✓ appUrl is correct" -ForegroundColor Green
    }
    else {
        Write-Host "    ✗ appUrl is WRONG: $($json.appUrl)" -ForegroundColor Red
    }
}
catch {
    Write-Host "  ⚠ Could not fetch manifest: $_" -ForegroundColor Yellow
    Write-Host "    Wait 10 more seconds and try again" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Nuclear Fix Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait 10-15 more seconds for Next.js to fully initialize" -ForegroundColor White
Write-Host "2. Hard refresh your browser (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "3. Clear browser cache completely" -ForegroundColor White
Write-Host "4. Try installing Stripe again" -ForegroundColor White
Write-Host ""
Write-Host "If environment variables are still wrong:" -ForegroundColor Red
Write-Host "- Check that .env file is in the infra/ directory" -ForegroundColor White
Write-Host "- Verify docker-compose is reading it (check logs)" -ForegroundColor White
Write-Host "- Try setting environment variables directly in docker-compose.dev.yml" -ForegroundColor White
Write-Host ""

