param(
    [string]$AuthToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUyNDQxMzgsIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUyNDQ0MzgsInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.XhAx4qSFE52YY2e7tqXwOKxhW7auvXUoC8ts5euu7H8ikCEV6owgZSTL1UMwk_IKurgRco3E5X-22geHSSSP05yYOEcVYA_2OR9QTcM4KJLozIX4j3xbDGxHyBLqDaGSFTBTkHzAusY-XXfL5RE46bp7cOtdXJOxIFh-yxTUALRUvIoE08HB3nqEUcL1BrmjjMkduqSDoPdtoUIOI8XT3Z4ZsVKTQ435xobbtvNxgZmk5OGRw2CyTnhyj_H8B4swqwre83BXI1MXRtj4jdWlJkYPnmrosjTz9H6TN0NV2zvXvZHg2N25GvI3sozanQzu3r5JQkmcN8iZtpnCm9RSKA")

Write-Host "`n=== Check Payment Gateway Initialize Webhook ===`n" -ForegroundColor Cyan

if (-not $AuthToken) {
    Write-Host "⚠ No auth token provided!" -ForegroundColor Yellow
    Write-Host "Please provide an auth token:" -ForegroundColor Yellow
    Write-Host "  .\check-payment-initialize-webhook.ps1 -AuthToken 'YOUR_TOKEN_HERE'" -ForegroundColor Gray
    Write-Host ""
    exit
}

Write-Host "Checking if PAYMENT_GATEWAY_INITIALIZE_SESSION webhook is registered..." -ForegroundColor Yellow
Write-Host ""

$query = @"
{
    "query": "query { app(id: \"QXBwOjE=\") { id name webhooks { id name syncEvents { name } isActive targetUrl } } }"
}
"@

$headers = @{
    "Content-Type" = "application/json"
}

if ($AuthToken) {
    $headers["Authorization"] = "Bearer $AuthToken"
}

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $query -ContentType "application/json" -Headers $headers -TimeoutSec 15 -ErrorAction Stop
    
    if ($response.errors) {
        Write-Host "✗ GraphQL errors:" -ForegroundColor Red
        $response.errors | ForEach-Object { Write-Host "  $($_.message)" -ForegroundColor Red }
        exit
    }
    
    $app = $response.data.app
    $initializeWebhook = $app.webhooks | Where-Object { 
        $_.syncEvents | Where-Object { $_.name -eq "PAYMENT_GATEWAY_INITIALIZE_SESSION" }
    }
    
    if ($initializeWebhook) {
        Write-Host "✅ PAYMENT_GATEWAY_INITIALIZE_SESSION webhook found:" -ForegroundColor Green
        Write-Host "   ID: $($initializeWebhook.id)" -ForegroundColor Cyan
        Write-Host "   Name: $($initializeWebhook.name)" -ForegroundColor Cyan
        Write-Host "   Target URL: $($initializeWebhook.targetUrl)" -ForegroundColor Cyan
        Write-Host "   Active: $($initializeWebhook.isActive)" -ForegroundColor Cyan
        Write-Host ""
        
        if (-not $initializeWebhook.isActive) {
            Write-Host "⚠ Webhook is NOT active!" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "✗ PAYMENT_GATEWAY_INITIALIZE_SESSION webhook NOT found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Registered webhooks:" -ForegroundColor Yellow
        foreach ($wh in $app.webhooks) {
            Write-Host "  - $($wh.name) (Events: $($wh.syncEvents.name -join ', '))" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "✗ Query failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Checking Stripe app logs for recent webhook calls..." -ForegroundColor Yellow
Write-Host ""

docker logs saleor-stripe-app-dev --tail 50 2>&1 | Select-String -Pattern "PAYMENT_GATEWAY_INITIALIZE|payment-gateway-initialize" -Context 2, 2

Write-Host ""
