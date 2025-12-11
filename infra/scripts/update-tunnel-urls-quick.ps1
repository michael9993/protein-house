# Quick script to update tunnel URLs and restart services
# Usage: .\update-tunnel-urls-quick.ps1 -ApiUrl "https://xxx.trycloudflare.com" -DashboardUrl "https://yyy.trycloudflare.com" -StripeUrl "https://zzz.trycloudflare.com"

param(
    [Parameter(Mandatory = $true)]
    [string]$ApiUrl,
    
    [Parameter(Mandatory = $true)]
    [string]$DashboardUrl,
    
    [Parameter(Mandatory = $true)]
    [string]$StripeUrl
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quick Tunnel URL Update" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Clean up URLs
$apiUrl = $ApiUrl.TrimEnd('/')
if (-not $apiUrl.StartsWith("http")) {
    $apiUrl = "https://$apiUrl"
}
if (-not $apiUrl.EndsWith("/graphql/")) {
    $apiUrl = "$apiUrl/graphql/"
}

$dashboardUrl = $DashboardUrl.TrimEnd('/')
if (-not $dashboardUrl.StartsWith("http")) {
    $dashboardUrl = "https://$dashboardUrl"
}

$stripeUrl = $StripeUrl.TrimEnd('/')
if (-not $stripeUrl.StartsWith("http")) {
    $stripeUrl = "https://$stripeUrl"
}

Write-Host "Updating .env file..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot "..\.env"

@"
# Tunnel URLs Configuration
# Updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
DASHBOARD_API_URL=$apiUrl
STRIPE_APP_URL=$stripeUrl
"@ | Out-File -FilePath $envFile -Encoding utf8 -Force

Write-Host "  ✓ .env updated" -ForegroundColor Green
Write-Host ""
Write-Host "New URLs:" -ForegroundColor Yellow
Write-Host "  API: $apiUrl" -ForegroundColor White
Write-Host "  Dashboard: $dashboardUrl" -ForegroundColor White
Write-Host "  Stripe: $stripeUrl" -ForegroundColor White
Write-Host ""

Write-Host "Recreating services..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-dashboard saleor-stripe-app saleor-storefront

Write-Host ""
Write-Host "  ✓ Services recreated" -ForegroundColor Green
Write-Host ""
Write-Host "Waiting 30 seconds for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Update Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your services should now use the new tunnel URLs." -ForegroundColor Yellow
Write-Host "Test them:" -ForegroundColor White
Write-Host "  Dashboard: $dashboardUrl" -ForegroundColor Cyan
Write-Host "  API: $apiUrl" -ForegroundColor Cyan
Write-Host "  Stripe: $stripeUrl" -ForegroundColor Cyan
Write-Host ""
