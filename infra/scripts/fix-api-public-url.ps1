# Fix Saleor API PUBLIC_URL for JWT token issuer
# This ensures JWT tokens have the correct issuer URL (tunnel URL, not localhost)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Saleor API PUBLIC_URL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Current tunnel URLs
$apiTunnel = "https://refugees-fleece-peterson-incurred.trycloudflare.com"
$dashboardTunnel = "https://lately-tue-river-risks.trycloudflare.com"
$stripeTunnel = "https://indiana-decades-burn-cold.trycloudflare.com"

Write-Host "Step 1: Updating .env file with PUBLIC_URL..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot "..\.env"

# Read existing .env if it exists
$existingEnv = @{}
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $existingEnv[$matches[1]] = $matches[2]
        }
    }
}

# Update with tunnel URLs
$existingEnv["DASHBOARD_API_URL"] = "$apiTunnel/graphql/"
$existingEnv["STRIPE_APP_URL"] = $stripeTunnel
$existingEnv["PUBLIC_URL"] = $apiTunnel

# Write back to .env
$envContent = @"
# Tunnel URLs Configuration
# Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# CRITICAL: PUBLIC_URL sets the JWT token issuer URL
# This must be the tunnel URL when using tunnels
PUBLIC_URL=$($existingEnv["PUBLIC_URL"])
DASHBOARD_API_URL=$($existingEnv["DASHBOARD_API_URL"])
STRIPE_APP_URL=$($existingEnv["STRIPE_APP_URL"])
"@

$envContent | Out-File -FilePath $envFile -Encoding utf8 -Force

Write-Host "  ✓ .env file updated" -ForegroundColor Green
Write-Host "    PUBLIC_URL=$apiTunnel" -ForegroundColor Gray
Write-Host "    DASHBOARD_API_URL=$($existingEnv["DASHBOARD_API_URL"])" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 2: Recreating Saleor API to pick up PUBLIC_URL..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml stop saleor-api 2>&1 | Out-Null
docker compose -f docker-compose.dev.yml rm -f saleor-api 2>&1 | Out-Null
docker compose -f docker-compose.dev.yml up -d saleor-api

Write-Host "  ✓ API recreated" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Waiting 30 seconds for API to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
Write-Host "  ✓ Wait complete" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Verifying API environment..." -ForegroundColor Cyan
$apiEnv = docker compose -f docker-compose.dev.yml exec -T saleor-api printenv PUBLIC_URL 2>&1
if ($apiEnv -match "refugees-fleece-peterson-incurred") {
    Write-Host "  ✓ PUBLIC_URL=$apiEnv" -ForegroundColor Green
    Write-Host "    JWT tokens will now have this as the issuer URL" -ForegroundColor Gray
}
elseif ($apiEnv -match "localhost") {
    Write-Host "  ✗ PUBLIC_URL=$apiEnv (STILL WRONG!)" -ForegroundColor Red
    Write-Host "    Docker Compose might not be reading the .env file" -ForegroundColor Yellow
}
else {
    Write-Host "  ⚠ PUBLIC_URL=$apiEnv" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Step 5: Recreating Dashboard and Stripe app..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-dashboard saleor-stripe-app
Write-Host "  ✓ Services recreated" -ForegroundColor Green
Write-Host ""

Write-Host "Step 6: Waiting 45 seconds for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 45
Write-Host "  ✓ Wait complete" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "CRITICAL: PUBLIC_URL sets the JWT token issuer URL." -ForegroundColor Yellow
Write-Host "All new JWT tokens will have '$apiTunnel/graphql/' as the issuer." -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Log out and log back into the Dashboard (to get a new JWT token)" -ForegroundColor White
Write-Host "2. Open Dashboard in a NEW incognito window:" -ForegroundColor White
Write-Host "   $dashboardTunnel" -ForegroundColor Cyan
Write-Host "3. Try installing Stripe again:" -ForegroundColor White
Write-Host "   - Navigate to Extensions → Add Extension" -ForegroundColor White
Write-Host "   - Enter: $stripeTunnel/api/manifest" -ForegroundColor Cyan
Write-Host "   - Click Install" -ForegroundColor White
Write-Host ""
Write-Host "The JWT token in the installation request should now have:" -ForegroundColor Yellow
Write-Host "  'iss': '$apiTunnel/graphql/'" -ForegroundColor Cyan
Write-Host "  NOT 'iss': 'http://localhost:8000/graphql/'" -ForegroundColor Red
Write-Host ""
