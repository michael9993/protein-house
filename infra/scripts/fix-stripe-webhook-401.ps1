# Script to fix 401 Unauthorized errors for Stripe app webhooks
# This happens when webhook URLs are registered with localhost but requests come through tunnels

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Stripe App Webhook 401 Errors" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

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
Write-Host ""

# Step 1: Update docker-compose environment variables
Write-Host "Step 1: Setting environment variables..." -ForegroundColor Cyan
$env:STRIPE_APP_URL = $stripeAppUrl
$env:APP_API_BASE_URL = $stripeAppUrl

# Step 2: Restart the Stripe app container
Write-Host "Step 2: Restarting Stripe app container..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-stripe-app

Write-Host "Waiting for Stripe app to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 3: Verify manifest
Write-Host "`nStep 3: Verifying manifest endpoint..." -ForegroundColor Cyan
try {
    $manifestUrl = "$stripeAppUrl/api/manifest"
    $response = Invoke-WebRequest -Uri $manifestUrl -UseBasicParsing -ErrorAction Stop
    $manifest = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Manifest retrieved successfully!" -ForegroundColor Green
    Write-Host "   App URL: $($manifest.appUrl)" -ForegroundColor Gray
    Write-Host "   Token Target URL: $($manifest.tokenTargetUrl)" -ForegroundColor Gray
    
    if ($manifest.webhooks) {
        Write-Host "`n   Webhook URLs in manifest:" -ForegroundColor Cyan
        foreach ($webhook in $manifest.webhooks) {
            $webhookUrl = $webhook.targetUrl
            if ($webhookUrl -like "*localhost*") {
                Write-Host "     ⚠️  $($webhook.name): $webhookUrl" -ForegroundColor Yellow
            }
            else {
                Write-Host "     ✅ $($webhook.name): $webhookUrl" -ForegroundColor Green
            }
        }
    }
}
catch {
    Write-Host "❌ Failed to retrieve manifest: $_" -ForegroundColor Red
    Write-Host "Make sure the Stripe app is running and accessible at $stripeAppUrl" -ForegroundColor Yellow
    exit 1
}

# Step 4: Run webhook migration
Write-Host "`nStep 4: Updating webhooks in Saleor..." -ForegroundColor Cyan
Write-Host "Running webhook migration script..." -ForegroundColor Yellow

try {
    $migrationOutput = docker compose -f docker-compose.dev.yml exec -T saleor-stripe-app pnpm run migrate 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Webhook migration completed successfully!" -ForegroundColor Green
        Write-Host $migrationOutput
    }
    else {
        Write-Host "⚠️  Webhook migration may have issues. Check output:" -ForegroundColor Yellow
        Write-Host $migrationOutput
        Write-Host "`nYou may need to manually update webhooks in Saleor Dashboard:" -ForegroundColor Yellow
        Write-Host "  1. Go to Apps > Stripe > Webhooks" -ForegroundColor White
        Write-Host "  2. Update each webhook URL to use: $stripeAppUrl" -ForegroundColor White
    }
}
catch {
    Write-Host "⚠️  Could not run migration script automatically" -ForegroundColor Yellow
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "`nPlease run manually:" -ForegroundColor Yellow
    Write-Host "  docker compose -f docker-compose.dev.yml exec saleor-stripe-app pnpm run migrate" -ForegroundColor Cyan
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify webhooks are updated in Saleor Dashboard" -ForegroundColor White
Write-Host "2. Test a payment to ensure webhooks work correctly" -ForegroundColor White
Write-Host "3. Check logs if issues persist:" -ForegroundColor White
Write-Host "   docker compose -f docker-compose.dev.yml logs saleor-stripe-app" -ForegroundColor Cyan
Write-Host ""
