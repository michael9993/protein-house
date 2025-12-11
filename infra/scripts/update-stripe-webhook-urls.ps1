# Script to update Stripe app webhook URLs to use tunnel URL
# This fixes 401 Unauthorized errors when webhooks are called through tunnels

Write-Host "Updating Stripe app webhook URLs..." -ForegroundColor Cyan

# Get tunnel URL from environment or prompt
$stripeAppUrl = $env:STRIPE_APP_URL
if (-not $stripeAppUrl) {
    Write-Host "STRIPE_APP_URL not set. Please set it to your Stripe app tunnel URL." -ForegroundColor Yellow
    Write-Host "Example: https://your-app.trycloudflare.com" -ForegroundColor Yellow
    $stripeAppUrl = Read-Host "Enter Stripe app tunnel URL"
}

if (-not $stripeAppUrl) {
    Write-Host "Error: Stripe app URL is required" -ForegroundColor Red
    exit 1
}

# Ensure URL doesn't have trailing slash
$stripeAppUrl = $stripeAppUrl.TrimEnd('/')

Write-Host "Using Stripe app URL: $stripeAppUrl" -ForegroundColor Green

# Set environment variable for the container
$env:STRIPE_APP_URL = $stripeAppUrl
$env:APP_API_BASE_URL = $stripeAppUrl

# Restart the Stripe app container to pick up new environment variables
Write-Host "`nRestarting Stripe app container..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml restart saleor-stripe-app

Write-Host "`nWaiting for Stripe app to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Check if manifest is accessible
Write-Host "`nChecking manifest endpoint..." -ForegroundColor Cyan
try {
    $manifestUrl = "$stripeAppUrl/api/manifest"
    $response = Invoke-WebRequest -Uri $manifestUrl -UseBasicParsing -ErrorAction Stop
    $manifest = $response.Content | ConvertFrom-Json
    
    Write-Host "Manifest retrieved successfully!" -ForegroundColor Green
    Write-Host "App URL: $($manifest.appUrl)" -ForegroundColor Gray
    Write-Host "Token Target URL: $($manifest.tokenTargetUrl)" -ForegroundColor Gray
    
    if ($manifest.webhooks) {
        Write-Host "`nWebhook URLs:" -ForegroundColor Cyan
        foreach ($webhook in $manifest.webhooks) {
            Write-Host "  - $($webhook.name): $($webhook.targetUrl)" -ForegroundColor Gray
        }
    }
    
    Write-Host "`n✅ Manifest is using tunnel URL!" -ForegroundColor Green
    Write-Host "`n⚠️  IMPORTANT: You need to update webhooks in Saleor Dashboard:" -ForegroundColor Yellow
    Write-Host "   1. Go to Saleor Dashboard > Apps > Stripe" -ForegroundColor Yellow
    Write-Host "   2. Click 'Update webhooks' or re-install the app" -ForegroundColor Yellow
    Write-Host "   3. The webhook URLs should now use: $stripeAppUrl" -ForegroundColor Yellow
    Write-Host "`n   OR run the webhook migration script:" -ForegroundColor Yellow
    Write-Host "   docker compose -f docker-compose.dev.yml exec saleor-stripe-app pnpm run webhooks:update" -ForegroundColor Cyan
    
}
catch {
    Write-Host "❌ Failed to retrieve manifest: $_" -ForegroundColor Red
    Write-Host "Make sure the Stripe app is running and accessible at $stripeAppUrl" -ForegroundColor Yellow
}

Write-Host "`nDone!" -ForegroundColor Green
