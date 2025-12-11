# ============================================
# Verify Saleor Platform Configuration
# ============================================
# Checks that all services are using correct URLs

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Saleor Platform Configuration Verification" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$infraDir = Split-Path -Parent $scriptDir
$envFile = Join-Path $infraDir ".env"

# Check if .env exists
if (-not (Test-Path $envFile)) {
    Write-Host "⚠️  No .env file found at $envFile" -ForegroundColor Yellow
    Write-Host "   Using default localhost configuration" -ForegroundColor Gray
    Write-Host ""
    $useLocalhost = $true
}
else {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Read tunnel URLs from .env
    $envContent = Get-Content $envFile -Raw
    
    $saleorApiUrl = if ($envContent -match 'SALEOR_API_TUNNEL_URL=(.+)') { $matches[1].Trim() } else { "" }
    $stripeAppUrl = if ($envContent -match 'STRIPE_APP_TUNNEL_URL=(.+)') { $matches[1].Trim() } else { "" }
    $storefrontUrl = if ($envContent -match 'STOREFRONT_TUNNEL_URL=(.+)') { $matches[1].Trim() } else { "" }
    
    if ([string]::IsNullOrWhiteSpace($saleorApiUrl) -and [string]::IsNullOrWhiteSpace($stripeAppUrl)) {
        Write-Host "   Using localhost configuration (no tunnel URLs set)" -ForegroundColor Gray
        $useLocalhost = $true
    }
    else {
        Write-Host "   Using tunnel configuration:" -ForegroundColor Gray
        if ($saleorApiUrl) { Write-Host "     Saleor API: $saleorApiUrl" -ForegroundColor White }
        if ($stripeAppUrl) { Write-Host "     Stripe App: $stripeAppUrl" -ForegroundColor White }
        if ($storefrontUrl) { Write-Host "     Storefront: $storefrontUrl" -ForegroundColor White }
        $useLocalhost = $false
    }
}

Write-Host ""
Write-Host "Checking running services..." -ForegroundColor Cyan

Push-Location $infraDir

# Check which services are running
$services = @(
    @{ Name = "Saleor API"; Container = "saleor-api-dev"; Port = "8000" }
    @{ Name = "Dashboard"; Container = "saleor-dashboard-dev"; Port = "9000" }
    @{ Name = "Storefront"; Container = "saleor-storefront-dev"; Port = "3000" }
    @{ Name = "Stripe App"; Container = "saleor-stripe-app-dev"; Port = "3002" }
)

$runningServices = @()

foreach ($service in $services) {
    $status = docker ps --filter "name=$($service.Container)" --format "{{.Status}}" 2>&1
    if ($status -match "Up") {
        Write-Host "  ✅ $($service.Name) is running" -ForegroundColor Green
        $runningServices += $service
    }
    else {
        Write-Host "  ⚠️  $($service.Name) is not running" -ForegroundColor Yellow
    }
}

if ($runningServices.Count -eq 0) {
    Write-Host ""
    Write-Host "No services are running. Start them with:" -ForegroundColor Yellow
    Write-Host "  docker compose -f docker-compose.dev.yml up -d" -ForegroundColor Gray
    Pop-Location
    exit 0
}

Write-Host ""
Write-Host "Checking environment variables in containers..." -ForegroundColor Cyan

# Check Saleor API
$apiRunning = $runningServices | Where-Object { $_.Container -eq "saleor-api-dev" }
if ($apiRunning) {
    Write-Host ""
    Write-Host "  Saleor API:" -ForegroundColor White
    $publicUrl = docker compose -f docker-compose.dev.yml exec -T saleor-api printenv PUBLIC_URL 2>&1 | Select-Object -First 1
    if ($publicUrl) {
        if ($useLocalhost) {
            if ($publicUrl -match "localhost") {
                Write-Host "    ✅ PUBLIC_URL: $publicUrl" -ForegroundColor Green
            }
            else {
                Write-Host "    ⚠️  PUBLIC_URL: $publicUrl (expected localhost)" -ForegroundColor Yellow
            }
        }
        else {
            if ($publicUrl -match "trycloudflare.com|ngrok.io") {
                Write-Host "    ✅ PUBLIC_URL: $publicUrl" -ForegroundColor Green
            }
            else {
                Write-Host "    ⚠️  PUBLIC_URL: $publicUrl (expected tunnel URL)" -ForegroundColor Yellow
            }
        }
    }
}

# Check Dashboard
$dashboardRunning = $runningServices | Where-Object { $_.Container -eq "saleor-dashboard-dev" }
if ($dashboardRunning) {
    Write-Host ""
    Write-Host "  Dashboard:" -ForegroundColor White
    $apiUrl = docker compose -f docker-compose.dev.yml exec -T saleor-dashboard printenv API_URL 2>&1 | Select-Object -First 1
    if ($apiUrl) {
        if ($useLocalhost) {
            if ($apiUrl -match "localhost") {
                Write-Host "    ✅ API_URL: $apiUrl" -ForegroundColor Green
            }
            else {
                Write-Host "    ⚠️  API_URL: $apiUrl (expected localhost)" -ForegroundColor Yellow
            }
        }
        else {
            if ($apiUrl -match "trycloudflare.com|ngrok.io") {
                Write-Host "    ✅ API_URL: $apiUrl" -ForegroundColor Green
            }
            else {
                Write-Host "    ⚠️  API_URL: $apiUrl (expected tunnel URL)" -ForegroundColor Yellow
            }
        }
    }
}

# Check Stripe App
$stripeRunning = $runningServices | Where-Object { $_.Container -eq "saleor-stripe-app-dev" }
if ($stripeRunning) {
    Write-Host ""
    Write-Host "  Stripe App:" -ForegroundColor White
    $saleorApiUrl = docker compose -f docker-compose.dev.yml exec -T saleor-stripe-app printenv NEXT_PUBLIC_SALEOR_API_URL 2>&1 | Select-Object -First 1
    $appUrl = docker compose -f docker-compose.dev.yml exec -T saleor-stripe-app printenv APP_URL 2>&1 | Select-Object -First 1
    
    if ($saleorApiUrl) {
        if ($useLocalhost) {
            if ($saleorApiUrl -match "localhost") {
                Write-Host "    ✅ NEXT_PUBLIC_SALEOR_API_URL: $saleorApiUrl" -ForegroundColor Green
            }
            else {
                Write-Host "    ⚠️  NEXT_PUBLIC_SALEOR_API_URL: $saleorApiUrl (expected localhost)" -ForegroundColor Yellow
            }
        }
        else {
            if ($saleorApiUrl -match "trycloudflare.com|ngrok.io") {
                Write-Host "    ✅ NEXT_PUBLIC_SALEOR_API_URL: $saleorApiUrl" -ForegroundColor Green
            }
            else {
                Write-Host "    ⚠️  NEXT_PUBLIC_SALEOR_API_URL: $saleorApiUrl (expected tunnel URL)" -ForegroundColor Yellow
            }
        }
    }
    
    if ($appUrl) {
        if ($useLocalhost) {
            if ($appUrl -match "localhost") {
                Write-Host "    ✅ APP_URL: $appUrl" -ForegroundColor Green
            }
            else {
                Write-Host "    ⚠️  APP_URL: $appUrl (expected localhost)" -ForegroundColor Yellow
            }
        }
        else {
            if ($appUrl -match "trycloudflare.com|ngrok.io") {
                Write-Host "    ✅ APP_URL: $appUrl" -ForegroundColor Green
            }
            else {
                Write-Host "    ⚠️  APP_URL: $appUrl (expected tunnel URL)" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($useLocalhost) {
    Write-Host "✅ All services configured for localhost development" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your services at:" -ForegroundColor White
    Write-Host "  API:        http://localhost:8000/graphql/" -ForegroundColor Gray
    Write-Host "  Dashboard:  http://localhost:9000" -ForegroundColor Gray
    Write-Host "  Storefront: http://localhost:3000" -ForegroundColor Gray
    Write-Host "  Stripe App: http://localhost:3002" -ForegroundColor Gray
}
else {
    Write-Host "✅ All services configured for tunnel development" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your services at:" -ForegroundColor White
    if ($saleorApiUrl) { Write-Host "  API:        $saleorApiUrl" -ForegroundColor Gray }
    if ($stripeAppUrl) { Write-Host "  Stripe App: $stripeAppUrl" -ForegroundColor Gray }
    if ($storefrontUrl) { Write-Host "  Storefront: $storefrontUrl" -ForegroundColor Gray }
    
    Write-Host ""
    Write-Host "⚠️  Remember to reinstall Stripe app if you changed tunnel URLs" -ForegroundColor Yellow
}

Write-Host ""

Pop-Location
