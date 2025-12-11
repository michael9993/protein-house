Write-Host "`n=== Restart Services and Test Gateway ===`n" -ForegroundColor Cyan

Write-Host "1. Restarting Saleor API (to clear webhook cache)..." -ForegroundColor Yellow
docker compose -f infra/docker-compose.dev.yml restart saleor-api
Write-Host "   ✓ Restarted" -ForegroundColor Green

Write-Host "`n2. Waiting 10 seconds for service to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n3. Testing gateway query..." -ForegroundColor Yellow
$gatewayQuery = @"
{
    "query": "query { shop { availablePaymentGateways(channel: \"default-channel\") { id name currencies } } }"
}
"@

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $gatewayQuery -ContentType "application/json" -TimeoutSec 15
    
    $gateways = $response.data.shop.availablePaymentGateways
    Write-Host "   Found $($gateways.Count) gateway(s):" -ForegroundColor Cyan
    
    foreach ($gw in $gateways) {
        $color = if ($gw.id -like "*stripe*") { "Green" } else { "Gray" }
        Write-Host "     - $($gw.id) ($($gw.name))" -ForegroundColor $color
    }
    
    $stripeGw = $gateways | Where-Object { $_.id -like "*stripe*" }
    if ($stripeGw) {
        Write-Host "`n   ✅ STRIPE GATEWAY FOUND!" -ForegroundColor Green
    }
    else {
        Write-Host "`n   ❌ STRIPE GATEWAY STILL NOT FOUND" -ForegroundColor Red
    }
}
catch {
    Write-Host "   ✗ Query failed: $_" -ForegroundColor Red
}

Write-Host "`n4. Checking Stripe app logs for webhook calls..." -ForegroundColor Yellow
$logs = docker logs saleor-stripe-app-dev --tail 50 2>&1
$webhookCalls = $logs | Select-String -Pattern "PAYMENT_LIST_GATEWAYS|payment-list-gateways|No channel ID|executeForAnyChannel|Received webhook" | Select-Object -Last 5

if ($webhookCalls) {
    Write-Host "   ✓ Found recent webhook activity:" -ForegroundColor Green
    $webhookCalls | ForEach-Object { Write-Host "     $_" -ForegroundColor Cyan }
}
else {
    Write-Host "   ✗ No webhook calls found!" -ForegroundColor Red
    Write-Host "   Saleor is still not calling the webhook." -ForegroundColor Yellow
}

Write-Host ""

