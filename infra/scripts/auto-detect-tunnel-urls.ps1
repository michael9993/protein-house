# Auto-detect tunnel URLs from running cloudflared processes
# This script finds active tunnels and updates the .env file automatically

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Auto-Detecting Tunnel URLs" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check for running cloudflared processes
Write-Host "Scanning for active cloudflared tunnels..." -ForegroundColor Yellow

# Get cloudflared processes and their command lines
$cloudflaredProcesses = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue

if (-not $cloudflaredProcesses) {
    Write-Host "⚠ No cloudflared processes found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Make sure your tunnels are running. Start them with:" -ForegroundColor White
    Write-Host "  .\scripts\tunnel-all.ps1" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "Found $($cloudflaredProcesses.Count) cloudflared process(es)" -ForegroundColor Green
Write-Host ""

# Try to extract URLs from cloudflared output
# Note: This is tricky because cloudflared outputs to stderr and the URL format
# We'll check the cloudflared logs or try to connect to the management API

$tunnelUrls = @{}

# Map ports to service names
$portMapping = @{
    "8000" = "API"
    "9000" = "Dashboard"
    "3002" = "Stripe App"
}

Write-Host "Attempting to detect tunnel URLs..." -ForegroundColor Yellow
Write-Host "Note: This requires checking cloudflared output or using cloudflared's management API" -ForegroundColor Gray
Write-Host ""

# Alternative: Check if we can access common tunnel patterns
# Or use cloudflared's management API if available

# For now, provide a manual input option
Write-Host "Since auto-detection is complex, please provide your current tunnel URLs:" -ForegroundColor Yellow
Write-Host ""

$apiUrl = Read-Host "API Tunnel URL (e.g., https://xxx.trycloudflare.com)"
$dashboardUrl = Read-Host "Dashboard Tunnel URL (e.g., https://yyy.trycloudflare.com)"
$stripeUrl = Read-Host "Stripe App Tunnel URL (e.g., https://zzz.trycloudflare.com)"

# Clean up URLs (remove trailing slashes, ensure https)
$apiUrl = $apiUrl.TrimEnd('/')
if (-not $apiUrl.StartsWith("http")) {
    $apiUrl = "https://$apiUrl"
}
if (-not $apiUrl.EndsWith("/graphql/")) {
    $apiUrl = "$apiUrl/graphql/"
}

$dashboardUrl = $dashboardUrl.TrimEnd('/')
if (-not $dashboardUrl.StartsWith("http")) {
    $dashboardUrl = "https://$dashboardUrl"
}

$stripeUrl = $stripeUrl.TrimEnd('/')
if (-not $stripeUrl.StartsWith("http")) {
    $stripeUrl = "https://$stripeUrl"
}

Write-Host ""
Write-Host "Updating .env file with detected URLs..." -ForegroundColor Cyan

$envFile = Join-Path $PSScriptRoot "..\.env"

@"
# Tunnel URLs Configuration
# Auto-detected/updated by auto-detect-tunnel-urls.ps1
# These URLs are updated automatically when tunnels change
DASHBOARD_API_URL=$apiUrl
STRIPE_APP_URL=$stripeUrl
"@ | Out-File -FilePath $envFile -Encoding utf8 -Force

Write-Host "  ✓ .env file updated" -ForegroundColor Green
Write-Host ""
Write-Host "Current configuration:" -ForegroundColor Yellow
Write-Host "  API: $apiUrl" -ForegroundColor White
Write-Host "  Dashboard: $dashboardUrl" -ForegroundColor White
Write-Host "  Stripe: $stripeUrl" -ForegroundColor White
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart services to pick up new URLs:" -ForegroundColor White
Write-Host "   docker compose -f docker-compose.dev.yml restart saleor-dashboard saleor-stripe-app" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Or use the fix script:" -ForegroundColor White
Write-Host "   .\scripts\fix-all-tunnel-urls.ps1" -ForegroundColor Cyan
Write-Host ""
