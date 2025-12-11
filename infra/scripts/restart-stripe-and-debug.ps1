Write-Host "`n=== Restart Stripe App and Debug ===`n" -ForegroundColor Cyan

Write-Host "1. Restarting Stripe app..." -ForegroundColor Yellow
docker compose -f c:\Users\micha\saleor-platform\infra\docker-compose.dev.yml restart saleor-stripe-app
Write-Host "   ✓ Restarted" -ForegroundColor Green

Write-Host "`n2. Waiting 20 seconds for app to compile..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

Write-Host "`n3. Triggering gateway query to call webhook..." -ForegroundColor Yellow
$gatewayQuery = @"
{
    "query": "query { shop { availablePaymentGateways(channel: \"default-channel\") { id name currencies } } }"
}
"@

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $gatewayQuery -ContentType "application/json" -TimeoutSec 20 -ErrorAction Stop
    
    if ($response.errors) {
        Write-Host "   GraphQL errors:" -ForegroundColor Red
        $response.errors | ForEach-Object { Write-Host "     $($_.message)" -ForegroundColor Red }
    }
    else {
        $gateways = $response.data.shop.availablePaymentGateways
        Write-Host "   Found $($gateways.Count) gateway(s)" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "   Query failed (this is OK, we're just triggering the webhook)" -ForegroundColor Yellow
}

Write-Host "`n4. Waiting 3 seconds for webhook to process..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "`n5. Checking Stripe app logs for detailed error..." -ForegroundColor Yellow
$logs = docker logs saleor-stripe-app-dev --tail 50 2>&1

# Find the most recent error with details
$recentError = $logs | Select-String -Pattern "Unhandled error|error:|Error:|TypeError|ReferenceError" -Context 5 | Select-Object -Last 1

if ($recentError) {
    Write-Host "`n   Most recent error:" -ForegroundColor Red
    Write-Host "   $recentError" -ForegroundColor Yellow
}
else {
    Write-Host "   No detailed errors found" -ForegroundColor Yellow
}

# Check for successful calls
$success = $logs | Select-String -Pattern "Successfully processed.*gatewaysCount.*1" | Select-Object -Last 1

if ($success) {
    Write-Host "`n   ✅ Found successful webhook call!" -ForegroundColor Green
    Write-Host "   $success" -ForegroundColor Cyan
}
else {
    Write-Host "`n   ❌ No successful calls found" -ForegroundColor Red
}

Write-Host "`n6. Full recent logs (last 20 lines):" -ForegroundColor Yellow
$logs | Select-Object -Last 20 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }

Write-Host ""

