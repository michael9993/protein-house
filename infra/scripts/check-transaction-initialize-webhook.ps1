param(
    [string]$AuthToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUyNDQxMzgsIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUyNDQ0MzgsInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.XhAx4qSFE52YY2e7tqXwOKxhW7auvXUoC8ts5euu7H8ikCEV6owgZSTL1UMwk_IKurgRco3E5X-22geHSSSP05yYOEcVYA_2OR9QTcM4KJLozIX4j3xbDGxHyBLqDaGSFTBTkHzAusY-XXfL5RE46bp7cOtdXJOxIFh-yxTUALRUvIoE08HB3nqEUcL1BrmjjMkduqSDoPdtoUIOI8XT3Z4ZsVKTQ435xobbtvNxgZmk5OGRw2CyTnhyj_H8B4swqwre83BXI1MXRtj4jdWlJkYPnmrosjTz9H6TN0NV2zvXvZHg2N25GvI3sozanQzu3r5JQkmcN8iZtpnCm9RSKA"
)

Write-Host "`n=== Check Transaction Initialize Webhook ===`n" -ForegroundColor Cyan

if (-not $AuthToken) {
    Write-Host "⚠ No auth token provided!" -ForegroundColor Yellow
    exit
}

# First, find the Stripe app
Write-Host "Finding Stripe app..." -ForegroundColor Yellow
$findAppQuery = @"
{
    "query": "query { apps(first: 10) { edges { node { id name identifier } } } }"
}
"@

$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $AuthToken"
}

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
    
    # Check webhooks
    Write-Host "Checking TRANSACTION_INITIALIZE_SESSION webhook..." -ForegroundColor Yellow
    $webhookQuery = @"
{
    "query": "query { app(id: `"$appId`") { id name webhooks { id name syncEvents { name } isActive targetUrl } } }"
}
"@
    
    $webhookResponse = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $webhookQuery -ContentType "application/json" -Headers $headers -TimeoutSec 15 -ErrorAction Stop
    
    if ($webhookResponse.errors) {
        Write-Host "✗ GraphQL errors:" -ForegroundColor Red
        $webhookResponse.errors | ForEach-Object { Write-Host "  $($_.message)" -ForegroundColor Red }
        exit
    }
    
    $app = $webhookResponse.data.app
    $transactionWebhook = $app.webhooks | Where-Object { 
        $_.syncEvents | Where-Object { $_.name -eq "TRANSACTION_INITIALIZE_SESSION" }
    }
    
    if ($transactionWebhook) {
        Write-Host "✅ TRANSACTION_INITIALIZE_SESSION webhook found:" -ForegroundColor Green
        Write-Host "   ID: $($transactionWebhook.id)" -ForegroundColor Cyan
        Write-Host "   Name: $($transactionWebhook.name)" -ForegroundColor Cyan
        Write-Host "   Target URL: $($transactionWebhook.targetUrl)" -ForegroundColor Cyan
        Write-Host "   Active: $($transactionWebhook.isActive)" -ForegroundColor Cyan
        Write-Host ""
        
        if (-not $transactionWebhook.isActive) {
            Write-Host "⚠ Webhook is NOT active!" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "✗ TRANSACTION_INITIALIZE_SESSION webhook NOT found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Registered webhooks:" -ForegroundColor Yellow
        foreach ($wh in $app.webhooks) {
            $events = ($wh.syncEvents | ForEach-Object { $_.name }) -join ', '
            Write-Host "  - $($wh.name) (Events: $events)" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "Checking Stripe app logs for recent webhook calls..." -ForegroundColor Yellow
    Write-Host ""
    
    $logs = docker compose -f c:\Users\micha\saleor-platform\infra\docker-compose.dev.yml logs --tail 100 saleor-stripe-app 2>&1
    $transactionLogs = $logs | Select-String -Pattern "TRANSACTION_INITIALIZE|transaction-initialize|Received webhook|Failed|error" -CaseSensitive:$false
    
    if ($transactionLogs) {
        Write-Host "Recent relevant logs:" -ForegroundColor Cyan
        $transactionLogs | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    }
    else {
        Write-Host "⚠ No recent transaction initialize logs found" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "✗ Query failed: $_" -ForegroundColor Red
}

Write-Host ""
