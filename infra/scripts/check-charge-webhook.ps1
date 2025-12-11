param(
    [string]$AuthToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUyNDQxMzgsIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUyNDQ0MzgsInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.XhAx4qSFE52YY2e7tqXwOKxhW7auvXUoC8ts5euu7H8ikCEV6owgZSTL1UMwk_IKurgRco3E5X-22geHSSSP05yYOEcVYA_2OR9QTcM4KJLozIX4j3xbDGxHyBLqDaGSFTBTkHzAusY-XXfL5RE46bp7cOtdXJOxIFh-yxTUALRUvIoE08HB3nqEUcL1BrmjjMkduqSDoPdtoUIOI8XT3Z4ZsVKTQ435xobbtvNxgZmk5OGRw2CyTnhyj_H8B4swqwre83BXI1MXRtj4jdWlJkYPnmrosjTz9H6TN0NV2zvXvZHg2N25GvI3sozanQzu3r5JQkmcN8iZtpnCm9RSKA"
)

Write-Host "`n=== Check TRANSACTION_CHARGE_REQUESTED Webhook ===`n" -ForegroundColor Cyan

$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $AuthToken"
}

# Find Stripe app
$findAppQuery = @"
{
    "query": "query { apps(first: 10) { edges { node { id name identifier } } } }"
}
"@

try {
    $appsResponse = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $findAppQuery -ContentType "application/json" -Headers $headers -TimeoutSec 15 -ErrorAction Stop
    
    $stripeApp = $appsResponse.data.apps.edges | Where-Object { $_.node.name -like "*Stripe*" } | Select-Object -First 1
    
    if (-not $stripeApp) {
        Write-Host "✗ Stripe app not found!" -ForegroundColor Red
        exit
    }
    
    $appId = $stripeApp.node.id
    Write-Host "✅ Found Stripe app: $($stripeApp.node.name) (ID: $appId, Identifier: $($stripeApp.node.identifier))" -ForegroundColor Green
    Write-Host ""
    
    # Get webhooks
    $webhookQuery = @"
{
    "query": "query { app(id: `"$appId`") { webhooks { id name syncEvents { name } isActive targetUrl } } }"
}
"@
    
    $webhookResponse = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $webhookQuery -ContentType "application/json" -Headers $headers -TimeoutSec 15 -ErrorAction Stop
    
    $app = $webhookResponse.data.app
    $chargeWebhook = $app.webhooks | Where-Object { 
        $_.syncEvents | Where-Object { $_.name -eq "TRANSACTION_CHARGE_REQUESTED" }
    }
    
    if ($chargeWebhook) {
        Write-Host "✅ TRANSACTION_CHARGE_REQUESTED webhook found:" -ForegroundColor Green
        Write-Host "   ID: $($chargeWebhook.id)" -ForegroundColor Cyan
        Write-Host "   Name: $($chargeWebhook.name)" -ForegroundColor Cyan
        Write-Host "   Target URL: $($chargeWebhook.targetUrl)" -ForegroundColor Cyan
        Write-Host "   Active: $($chargeWebhook.isActive)" -ForegroundColor $(if ($chargeWebhook.isActive) { "Green" } else { "Red" })
        Write-Host ""
        
        # Check if URL matches current Cloudflare tunnel
        $currentUrl = "https://indiana-decades-burn-cold.trycloudflare.com"
        if ($chargeWebhook.targetUrl -notlike "*$currentUrl*") {
            Write-Host "⚠️ WARNING: Webhook URL may not match current Cloudflare tunnel!" -ForegroundColor Yellow
            Write-Host "   Expected: *$currentUrl*" -ForegroundColor Gray
            Write-Host "   Actual: $($chargeWebhook.targetUrl)" -ForegroundColor Gray
            Write-Host ""
        }
        
        # Test URL reachability
        Write-Host "Testing webhook URL..." -ForegroundColor Yellow
        try {
            $testResponse = Invoke-WebRequest -Uri "$($chargeWebhook.targetUrl)" -Method GET -TimeoutSec 5 -ErrorAction Stop
            Write-Host "   ✅ URL is reachable (Status: $($testResponse.StatusCode))" -ForegroundColor Green
        }
        catch {
            Write-Host "   ⚠ URL test failed: $($_.Exception.Message)" -ForegroundColor Yellow
            if ($_.Exception.Response) {
                Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
            }
        }
    }
    else {
        Write-Host "✗ TRANSACTION_CHARGE_REQUESTED webhook NOT found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Registered webhooks:" -ForegroundColor Yellow
        foreach ($wh in $app.webhooks) {
            $events = ($wh.syncEvents | ForEach-Object { $_.name }) -join ', '
            Write-Host "  - $($wh.name) (Events: $events)" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "Checking Stripe app logs for recent charge webhook calls..." -ForegroundColor Yellow
    Write-Host ""
    
    $logs = docker compose -f c:\Users\micha\saleor-platform\infra\docker-compose.dev.yml logs --tail 50 saleor-stripe-app 2>&1
    $chargeLogs = $logs | Select-String -Pattern "TRANSACTION_CHARGE|charge-requested|401|Unauthorized" -CaseSensitive:$false
    
    if ($chargeLogs) {
        Write-Host "Recent relevant logs:" -ForegroundColor Cyan
        $chargeLogs | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    }
    else {
        Write-Host "⚠ No recent charge webhook logs found" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "✗ Query failed: $_" -ForegroundColor Red
}

Write-Host ""
