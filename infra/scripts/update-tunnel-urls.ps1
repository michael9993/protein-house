# ============================================
# Update Tunnel URLs for Saleor Platform
# ============================================
# This script updates tunnel URLs in .env and restarts services

param(
    [string]$SaleorApiUrl,
    [string]$StripeAppUrl,
    [string]$StorefrontUrl,
    [string]$DashboardUrl
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Saleor Platform - Update Tunnel URLs" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory (should be infra/)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$infraDir = Split-Path -Parent $scriptDir
$envFile = Join-Path $infraDir ".env"

# Check if .env exists
if (-not (Test-Path $envFile)) {
    Write-Host "Creating new .env file..." -ForegroundColor Yellow
    Copy-Item (Join-Path $infraDir ".env.example") $envFile
}

# Interactive mode if no parameters
if (-not $SaleorApiUrl) {
    Write-Host "Enter tunnel URLs (leave empty to keep localhost):" -ForegroundColor Yellow
    Write-Host ""
    
    $SaleorApiUrl = Read-Host "Saleor API tunnel URL (e.g., https://your-api.trycloudflare.com)"
    $StripeAppUrl = Read-Host "Stripe App tunnel URL (e.g., https://your-app.trycloudflare.com)"
    $StorefrontUrl = Read-Host "Storefront tunnel URL (optional)"
    $DashboardUrl = Read-Host "Dashboard tunnel URL (optional, usually same as API)"
}

# Normalize URLs (remove trailing slashes and /graphql/)
function Normalize-Url {
    param([string]$url)
    if ([string]::IsNullOrWhiteSpace($url)) {
        return ""
    }
    $url = $url.TrimEnd('/')
    $url = $url -replace '/graphql/?$', ''
    return $url
}

$SaleorApiUrl = Normalize-Url $SaleorApiUrl
$StripeAppUrl = Normalize-Url $StripeAppUrl
$StorefrontUrl = Normalize-Url $StorefrontUrl
$DashboardUrl = Normalize-Url $DashboardUrl

Write-Host ""
Write-Host "Updating .env file..." -ForegroundColor Cyan

# Read current .env
$envContent = Get-Content $envFile -Raw

# Update or add variables
function Update-EnvVar {
    param(
        [string]$content,
        [string]$varName,
        [string]$varValue
    )
    
    if ([string]::IsNullOrWhiteSpace($varValue)) {
        # Comment out if empty
        $content = $content -replace "(?m)^$varName=.*$", "# $varName="
    }
    elseif ($content -match "(?m)^$varName=") {
        # Update existing
        $content = $content -replace "(?m)^$varName=.*$", "$varName=$varValue"
    }
    elseif ($content -match "(?m)^# $varName=") {
        # Uncomment and update
        $content = $content -replace "(?m)^# $varName=.*$", "$varName=$varValue"
    }
    else {
        # Add new
        $content += "`n$varName=$varValue"
    }
    
    return $content
}

$envContent = Update-EnvVar $envContent "SALEOR_API_TUNNEL_URL" $SaleorApiUrl
$envContent = Update-EnvVar $envContent "STRIPE_APP_TUNNEL_URL" $StripeAppUrl
$envContent = Update-EnvVar $envContent "STOREFRONT_TUNNEL_URL" $StorefrontUrl
$envContent = Update-EnvVar $envContent "DASHBOARD_TUNNEL_URL" $DashboardUrl

# Save updated .env
Set-Content $envFile $envContent -NoNewline

Write-Host "  ✓ .env file updated" -ForegroundColor Green
Write-Host ""

# Display current configuration
Write-Host "Current Configuration:" -ForegroundColor Cyan
if ($SaleorApiUrl) {
    Write-Host "  Saleor API: $SaleorApiUrl" -ForegroundColor White
}
else {
    Write-Host "  Saleor API: http://localhost:8000 (default)" -ForegroundColor Gray
}

if ($StripeAppUrl) {
    Write-Host "  Stripe App: $StripeAppUrl" -ForegroundColor White
}
else {
    Write-Host "  Stripe App: http://localhost:3002 (default)" -ForegroundColor Gray
}

if ($StorefrontUrl) {
    Write-Host "  Storefront: $StorefrontUrl" -ForegroundColor White
}
else {
    Write-Host "  Storefront: http://localhost:3000 (default)" -ForegroundColor Gray
}

Write-Host ""

# Ask to restart services
$restart = Read-Host "Restart services to apply changes? (y/n)"
if ($restart -eq 'y' -or $restart -eq 'Y') {
    Write-Host ""
    Write-Host "Restarting services..." -ForegroundColor Yellow
    
    Push-Location $infraDir
    docker compose -f docker-compose.dev.yml restart saleor-api saleor-dashboard saleor-storefront saleor-stripe-app
    Pop-Location
    
    Write-Host "  ✓ Services restarted" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($SaleorApiUrl -or $StripeAppUrl) {
    Write-Host "⚠️  IMPORTANT: After updating tunnel URLs:" -ForegroundColor Yellow
    Write-Host "  1. Uninstall the Stripe app from Dashboard" -ForegroundColor White
    Write-Host "  2. Reinstall the Stripe app (webhooks need new URLs)" -ForegroundColor White
    Write-Host "  3. Configure Stripe in the app settings" -ForegroundColor White
    Write-Host ""
}

Write-Host "To switch back to localhost, run this script with no parameters" -ForegroundColor Gray
Write-Host "and leave all fields empty." -ForegroundColor Gray
Write-Host ""
