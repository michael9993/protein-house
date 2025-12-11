Write-Host "`n=== Running Storefront GraphQL Codegen ===`n" -ForegroundColor Cyan

Write-Host "This will regenerate GraphQL types to include the new Stripe gateway." -ForegroundColor Yellow
Write-Host ""

# Check if storefront container is running
$storefrontRunning = docker ps --filter "name=saleor-storefront-dev" --format "{{.Names}}" 2>&1

if (-not $storefrontRunning) {
    Write-Host "⚠ Storefront container not running!" -ForegroundColor Yellow
    Write-Host "Starting storefront..." -ForegroundColor Yellow
    docker compose -f c:\Users\micha\saleor-platform\infra\docker-compose.dev.yml up -d saleor-storefront
    Write-Host "Waiting 10 seconds for container to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

Write-Host "Running codegen in storefront container..." -ForegroundColor Yellow
Write-Host ""

# Run codegen inside the container
docker compose -f c:\Users\micha\saleor-platform\infra\docker-compose.dev.yml exec saleor-storefront pnpm run generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Codegen completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The storefront GraphQL types have been updated to include:" -ForegroundColor Cyan
    Write-Host "  - Stripe gateway (app:stripe:stripe)" -ForegroundColor Green
    Write-Host "  - Updated PaymentGateway type" -ForegroundColor Green
    Write-Host ""
    Write-Host "The storefront should now recognize the Stripe payment gateway!" -ForegroundColor Cyan
}
else {
    Write-Host "`n❌ Codegen failed!" -ForegroundColor Red
    Write-Host "Check the output above for errors." -ForegroundColor Yellow
}

Write-Host ""
