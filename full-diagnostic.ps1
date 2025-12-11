Write-Host "`n=== COMPREHENSIVE STRIPE APP DIAGNOSTIC ===`n" -ForegroundColor Cyan

# 1. Check container status
Write-Host "1. Container Status:" -ForegroundColor Yellow
$containerStatus = docker ps --filter "name=stripe" --format "{{.Names}}\t{{.Status}}" 2>&1
if ($containerStatus) {
    Write-Host "   $containerStatus" -ForegroundColor Green
}
else {
    Write-Host "   ✗ Stripe app container NOT running!" -ForegroundColor Red
    Write-Host "   Attempting to start..." -ForegroundColor Yellow
    docker compose -f infra/docker-compose.dev.yml up -d saleor-stripe-app
    Start-Sleep -Seconds 10
}

# 2. Check for compilation errors in logs
Write-Host "`n2. Checking for Compilation Errors:" -ForegroundColor Yellow
$logs = docker logs saleor-stripe-app --tail 100 2>&1
$compileErrors = $logs | Select-String -Pattern "error|Error|ERROR|failed|Failed|FAILED" | Select-Object -First 10
if ($compileErrors) {
    Write-Host "   ⚠ Found potential errors:" -ForegroundColor Red
    $compileErrors | ForEach-Object { Write-Host "     $_" -ForegroundColor Red }
}
else {
    Write-Host "   ✓ No obvious errors in recent logs" -ForegroundColor Green
}

# 3. Check if app is ready
Write-Host "`n3. Checking if App is Ready:" -ForegroundColor Yellow
$readyLog = $logs | Select-String -Pattern "Ready|ready|started|listening" | Select-Object -Last 1
if ($readyLog) {
    Write-Host "   ✓ App appears ready: $readyLog" -ForegroundColor Green
}
else {
    Write-Host "   ⚠ Cannot confirm app is ready" -ForegroundColor Yellow
}

# 4. Check webhook in logs (see if it's being called)
Write-Host "`n4. Looking for Webhook Calls in Logs:" -ForegroundColor Yellow
$webhookLogs = $logs | Select-String -Pattern "PAYMENT_LIST_GATEWAYS|payment-list-gateways|No channel ID|executeForAnyChannel" | Select-Object -Last 5
if ($webhookLogs) {
    Write-Host "   ✓ Found webhook activity:" -ForegroundColor Green
    $webhookLogs | ForEach-Object { Write-Host "     $_" -ForegroundColor Cyan }
}
else {
    Write-Host "   ✗ No webhook calls found in logs!" -ForegroundColor Red
    Write-Host "     This means Saleor isn't calling the webhook." -ForegroundColor Yellow
}

# 5. Check manifest endpoint
Write-Host "`n5. Testing Manifest Endpoint:" -ForegroundColor Yellow
try {
    $manifest = Invoke-RestMethod -Uri "https://indiana-decades-burn-cold.trycloudflare.com/api/manifest" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✓ Manifest accessible" -ForegroundColor Green
    
    $plgWebhook = $manifest.webhooks | Where-Object { $_.syncEvents -contains "PAYMENT_LIST_GATEWAYS" }
    if ($plgWebhook) {
        Write-Host "   ✓ PAYMENT_LIST_GATEWAYS in manifest" -ForegroundColor Green
        Write-Host "     Target URL: $($plgWebhook.targetUrl)" -ForegroundColor Gray
    }
    else {
        Write-Host "   ✗ PAYMENT_LIST_GATEWAYS NOT in manifest!" -ForegroundColor Red
    }
}
catch {
    Write-Host "   ✗ Cannot access manifest: $_" -ForegroundColor Red
}

# 6. Query Saleor for registered webhooks
Write-Host "`n6. Checking Registered Webhooks in Saleor:" -ForegroundColor Yellow
$query = @"
{
    "query": "query { apps(first: 10, filter: { search: \"stripe\" }) { edges { node { id name webhooks { edges { node { id name syncEvents { name } isActive } } } } } } }"
}
"@

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $query -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
    
    if ($response.data.apps.edges.Count -gt 0) {
        $stripeApp = $response.data.apps.edges[0].node
        Write-Host "   App: $($stripeApp.name) (ID: $($stripeApp.id))" -ForegroundColor Cyan
        
        $plgWebhook = $stripeApp.webhooks.edges | Where-Object { 
            $_.node.syncEvents.name -contains "PAYMENT_LIST_GATEWAYS" 
        }
        
        if ($plgWebhook) {
            Write-Host "   ✓ PAYMENT_LIST_GATEWAYS webhook registered" -ForegroundColor Green
            Write-Host "     Active: $($plgWebhook.node.isActive)" -ForegroundColor Gray
        }
        else {
            Write-Host "   ✗ PAYMENT_LIST_GATEWAYS webhook NOT registered in Saleor!" -ForegroundColor Red
        }
    }
}
catch {
    Write-Host "   ⚠ Could not query Saleor (need auth token): $_" -ForegroundColor Yellow
}

# 7. Test gateway query
Write-Host "`n7. Testing Gateway Query:" -ForegroundColor Yellow
$gatewayQuery = @"
{
    "query": "query { shop { availablePaymentGateways(channel: \"default-channel\") { id name currencies } } }"
}
"@

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $gatewayQuery -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
    
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
        Write-Host "`n   ❌ STRIPE GATEWAY NOT FOUND" -ForegroundColor Red
    }
}
catch {
    Write-Host "   ✗ Query failed: $_" -ForegroundColor Red
}

Write-Host "`n=== SUMMARY ===`n" -ForegroundColor Cyan
Write-Host "If webhook is NOT being called (step 4), the issue is:" -ForegroundColor Yellow
Write-Host "  - Either webhook not registered in Saleor (step 6)" -ForegroundColor Yellow
Write-Host "  - Or Saleor cache needs clearing" -ForegroundColor Yellow
Write-Host "`nIf webhook IS being called but gateway not appearing (step 7):" -ForegroundColor Yellow
Write-Host "  - Check the response in Dashboard webhook deliveries" -ForegroundColor Yellow
Write-Host "  - Or the code fix didn't apply (compilation error in step 2)" -ForegroundColor Yellow
Write-Host ""

