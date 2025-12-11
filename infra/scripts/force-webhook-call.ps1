param(
    [string]$AuthToken = ""
)

Write-Host "`n=== Force Webhook to be Called ===`n" -ForegroundColor Cyan

if (-not $AuthToken) {
    Write-Host "Please provide an auth token:" -ForegroundColor Yellow
    Write-Host ".\force-webhook-call.ps1 -AuthToken 'YOUR_TOKEN_HERE'" -ForegroundColor Gray
    Write-Host ""
    exit
}

Write-Host "The webhook is registered but Saleor isn't calling it." -ForegroundColor Yellow
Write-Host "This could be due to Saleor caching the webhook list." -ForegroundColor Yellow
Write-Host ""

Write-Host "Potential fixes:" -ForegroundColor Cyan
Write-Host "1. Restart Saleor backend to clear cache" -ForegroundColor Yellow
Write-Host "2. Update webhook to trigger re-sync" -ForegroundColor Yellow
Write-Host "3. Check if webhook has correct event type" -ForegroundColor Yellow
Write-Host ""

# Try option 2: Update the webhook to trigger a re-sync
Write-Host "Attempting to update webhook (trigger re-sync)..." -ForegroundColor Cyan

$updateMutation = @"
{
    "query": "mutation { webhookUpdate(id: \"V2ViaG9vazoxMzM=\", input: { isActive: true }) { webhook { id name isActive } errors { field message } } }"
}
"@

$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $AuthToken"
}

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $updateMutation -Headers $headers -ContentType "application/json"
    
    if ($response.data.webhookUpdate.webhook) {
        Write-Host "✓ Webhook updated successfully" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Update failed: $($response.data.webhookUpdate.errors | ConvertTo-Json)" -ForegroundColor Red
    }
}
catch {
    Write-Host "✗ Update failed: $_" -ForegroundColor Red
}

Write-Host "`n=== Now testing gateway query ===`n" -ForegroundColor Cyan

$gatewayQuery = @"
{
    "query": "query { shop { availablePaymentGateways(channel: \"default-channel\") { id name currencies } } }"
}
"@

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $gatewayQuery -ContentType "application/json"
    
    $gateways = $response.data.shop.availablePaymentGateways
    Write-Host "Found $($gateways.Count) gateway(s):" -ForegroundColor Cyan
    
    foreach ($gw in $gateways) {
        $color = if ($gw.id -like "*stripe*") { "Green" } else { "Gray" }
        Write-Host "  - $($gw.id) ($($gw.name))" -ForegroundColor $color
    }
    
    $stripeGw = $gateways | Where-Object { $_.id -like "*stripe*" }
    if ($stripeGw) {
        Write-Host "`n✅ STRIPE GATEWAY FOUND!" -ForegroundColor Green
    }
    else {
        Write-Host "`n❌ STRIPE GATEWAY NOT FOUND" -ForegroundColor Red
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Check Stripe app logs:" -ForegroundColor Cyan
        Write-Host "   docker logs saleor-stripe-app-dev --tail 50" -ForegroundColor Gray
        Write-Host "2. Restart Saleor backend:" -ForegroundColor Cyan
        Write-Host "   docker compose -f infra/docker-compose.dev.yml restart saleor-api" -ForegroundColor Gray
        Write-Host "3. Check webhook deliveries in Dashboard" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "✗ Query failed: $_" -ForegroundColor Red
}

Write-Host ""

