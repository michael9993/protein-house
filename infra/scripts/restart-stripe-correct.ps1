Write-Host "`n=== Restart Stripe App (Correct Service Name) ===`n" -ForegroundColor Cyan

Write-Host "Service name: saleor-stripe-app" -ForegroundColor Yellow
Write-Host "Container name: saleor-stripe-app-dev" -ForegroundColor Yellow
Write-Host ""

Write-Host "Restarting..." -ForegroundColor Yellow
docker compose -f c:\Users\micha\saleor-platform\infra\docker-compose.dev.yml restart saleor-stripe-app

Write-Host "`nWaiting 20 seconds for compilation..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

Write-Host "`nChecking container status..." -ForegroundColor Yellow
docker ps --filter "name=saleor-stripe-app-dev" --format "table {{.Names}}\t{{.Status}}"

Write-Host "`nRecent logs (last 10 lines):" -ForegroundColor Yellow
docker logs saleor-stripe-app-dev --tail 10

Write-Host ""
