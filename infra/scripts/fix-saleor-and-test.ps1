Write-Host "`n=== Fix Saleor Backend and Test ===`n" -ForegroundColor Cyan

Write-Host "1. Checking Saleor API logs for errors..." -ForegroundColor Yellow
$saleorLogs = docker logs saleor-api-dev --tail 30 2>&1
$errors = $saleorLogs | Select-String -Pattern "AttributeError|Error|Exception" | Select-Object -Last 5

if ($errors) {
    Write-Host "   Found errors in Saleor API:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
}
else {
    Write-Host "   No obvious errors" -ForegroundColor Green
}

Write-Host "`n2. Restarting both Saleor API and Stripe app..." -ForegroundColor Yellow
docker compose -f c:\Users\micha\saleor-platform\infra\docker-compose.dev.yml restart saleor-api saleor-stripe-app
Write-Host "   ✓ Restarted" -ForegroundColor Green

Write-Host "`n3. Waiting 15 seconds for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`n4. Testing gateway query..." -ForegroundColor Yellow
$gatewayQuery = @"
{
    "query": "query { shop { availablePaymentGateways(channel: \"default-channel\") { id name currencies } } }"
}
"@

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $gatewayQuery -ContentType "application/json" -TimeoutSec 20 -ErrorAction Stop
    
    if ($response.errors) {
        Write-Host "   ✗ GraphQL errors:" -ForegroundColor Red
        $response.errors | ForEach-Object { Write-Host "     $($_.message)" -ForegroundColor Red }
    }
    else {
        $gateways = $response.data.shop.availablePaymentGateways
        Write-Host "   Found $($gateways.Count) gateway(s):" -ForegroundColor Cyan
        
        foreach ($gw in $gateways) {
            $color = if ($gw.id -like "*stripe*") { "Green" } else { "Gray" }
            Write-Host "     - $($gw.id) ($($gw.name))" -ForegroundColor $color
        }
        
        $stripeGw = $gateways | Where-Object { $_.id -like "*stripe*" }
        if ($stripeGw) {
            Write-Host "`n   ✅ SUCCESS! STRIPE GATEWAY FOUND!" -ForegroundColor Green
        }
        else {
            Write-Host "`n   ❌ Stripe gateway not found" -ForegroundColor Red
        }
    }
}
catch {
    Write-Host "   ✗ Query failed: $_" -ForegroundColor Red
    Write-Host "   Waiting longer for services..." -ForegroundColor Yellow
}

Write-Host "`n5. Checking if webhook was called..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
$stripeLogs = docker logs saleor-stripe-app-dev --tail 30 2>&1
$webhookCalls = $stripeLogs | Select-String -Pattern "PAYMENT_LIST_GATEWAYS|payment-list-gateways" | Select-Object -Last 3

if ($webhookCalls) {
    Write-Host "   ✓ Found webhook activity:" -ForegroundColor Green
    $webhookCalls | ForEach-Object { Write-Host "     $_" -ForegroundColor Cyan }
}
else {
    Write-Host "   ✗ No webhook calls found - Saleor may still have cached webhook list" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Try option: Clear Saleor's database cache" -ForegroundColor Yellow
    Write-Host "   Run: docker compose -f c:\Users\micha\saleor-platform\infra\docker-compose.dev.yml exec saleor-api python manage.py clear_cache" -ForegroundColor Gray
}

Write-Host ""

