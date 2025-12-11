Write-Host "`n=== Checking Stripe App Status ===`n" -ForegroundColor Cyan

# Check if container is running
Write-Host "1. Container Status:" -ForegroundColor Yellow
docker ps --filter "name=stripe" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check recent logs
Write-Host "`n2. Recent Logs (last 30 lines):" -ForegroundColor Yellow
docker logs saleor-stripe-app --tail 30

# Test the manifest endpoint
Write-Host "`n3. Testing Manifest Endpoint:" -ForegroundColor Yellow
try {
    $manifest = Invoke-RestMethod -Uri "https://indiana-decades-burn-cold.trycloudflare.com/api/manifest" -Method GET -TimeoutSec 10
    Write-Host "   ✓ Manifest accessible" -ForegroundColor Green
    $plgWebhook = $manifest.webhooks | Where-Object { $_.syncEvents -contains "PAYMENT_LIST_GATEWAYS" }
    if ($plgWebhook) {
        Write-Host "   ✓ PAYMENT_LIST_GATEWAYS in manifest" -ForegroundColor Green
    }
    else {
        Write-Host "   ✗ PAYMENT_LIST_GATEWAYS NOT in manifest" -ForegroundColor Red
    }
}
catch {
    Write-Host "   ✗ Cannot access manifest: $_" -ForegroundColor Red
}

# Test the webhook endpoint directly
Write-Host "`n4. Testing Webhook Endpoint:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://indiana-decades-burn-cold.trycloudflare.com/api/webhooks/saleor/payment-list-gateways" -Method POST -Body '{}' -ContentType "application/json" -UseBasicParsing -TimeoutSec 10 2>&1
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor $(if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401) { "Green" } else { "Yellow" })
}
catch {
    if ($_.Exception.Response.StatusCode) {
        Write-Host "   Status: $($_.Exception.Response.StatusCode) (endpoint exists)" -ForegroundColor Yellow
    }
    else {
        Write-Host "   ✗ Endpoint error: $_" -ForegroundColor Red
    }
}

Write-Host ""

