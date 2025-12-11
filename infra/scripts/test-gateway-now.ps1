Write-Host "`n=== Testing Gateway Query ===`n" -ForegroundColor Cyan

Write-Host "Querying availablePaymentGateways..." -ForegroundColor Yellow

$gatewayQuery = @"
{
    "query": "query { shop { availablePaymentGateways(channel: \"default-channel\") { id name currencies } } }"
}
"@

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $gatewayQuery -ContentType "application/json" -TimeoutSec 15
    
    if ($response.errors) {
        Write-Host "GraphQL errors:" -ForegroundColor Red
        $response.errors | ForEach-Object { Write-Host "  $($_.message)" -ForegroundColor Red }
        exit
    }
    
    $gateways = $response.data.shop.availablePaymentGateways
    Write-Host "Found $($gateways.Count) gateway(s):`n" -ForegroundColor Cyan
    
    foreach ($gw in $gateways) {
        $color = if ($gw.id -like "*stripe*") { "Green" } else { "Gray" }
        Write-Host "  - ID: $($gw.id)" -ForegroundColor $color
        Write-Host "    Name: $($gw.name)" -ForegroundColor $color
        Write-Host "    Currencies: $($gw.currencies -join ', ')" -ForegroundColor $color
        Write-Host ""
    }
    
    $stripeGw = $gateways | Where-Object { $_.id -like "*stripe*" }
    if ($stripeGw) {
        Write-Host "✅ SUCCESS! STRIPE GATEWAY FOUND!" -ForegroundColor Green
        Write-Host ""
        Write-Host "The Stripe gateway should now appear in your storefront checkout!" -ForegroundColor Cyan
    }
    else {
        Write-Host "❌ STRIPE GATEWAY NOT FOUND" -ForegroundColor Red
        Write-Host ""
        Write-Host "But we saw it work in logs at 00:05:59..." -ForegroundColor Yellow
        Write-Host "Checking webhook logs for recent calls..." -ForegroundColor Yellow
        Write-Host ""
        
        $logs = docker logs saleor-stripe-app-dev --tail 20 2>&1
        $recentWebhook = $logs | Select-String -Pattern "PAYMENT_LIST_GATEWAYS.*Successfully processed" | Select-Object -Last 1
        
        if ($recentWebhook) {
            Write-Host "Recent successful webhook call:" -ForegroundColor Green
            Write-Host "  $recentWebhook" -ForegroundColor Cyan
        }
        else {
            Write-Host "No recent successful webhook calls found" -ForegroundColor Red
        }
    }
}
catch {
    Write-Host "✗ Query failed: $_" -ForegroundColor Red
}

Write-Host ""

