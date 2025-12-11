param(
    [string]$AuthToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUyNDQxMzgsIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUyNDQ0MzgsInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.XhAx4qSFE52YY2e7tqXwOKxhW7auvXUoC8ts5euu7H8ikCEV6owgZSTL1UMwk_IKurgRco3E5X-22geHSSSP05yYOEcVYA_2OR9QTcM4KJLozIX4j3xbDGxHyBLqDaGSFTBTkHzAusY-XXfL5RE46bp7cOtdXJOxIFh-yxTUALRUvIoE08HB3nqEUcL1BrmjjMkduqSDoPdtoUIOI8XT3Z4ZsVKTQ435xobbtvNxgZmk5OGRw2CyTnhyj_H8B4swqwre83BXI1MXRtj4jdWlJkYPnmrosjTz9H6TN0NV2zvXvZHg2N25GvI3sozanQzu3r5JQkmcN8iZtpnCm9RSKA"
)

Write-Host "`n=== Check Webhook URLs ===`n" -ForegroundColor Cyan

$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $AuthToken"
}

# Find Stripe app
$findAppQuery = @"
{
    "query": "query { apps(first: 10) { edges { node { id name identifier appUrl } } } }"
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
    Write-Host "✅ Found Stripe app:" -ForegroundColor Green
    Write-Host "   Name: $($stripeApp.node.name)" -ForegroundColor Cyan
    Write-Host "   Identifier: $($stripeApp.node.identifier)" -ForegroundColor Cyan
    Write-Host "   App URL: $($stripeApp.node.appUrl)" -ForegroundColor Cyan
    Write-Host ""
    
    # Get all webhooks
    $webhookQuery = @"
{
    "query": "query { app(id: `"$appId`") { webhooks { id name syncEvents { name } isActive targetUrl } } }"
}
"@
    
    $webhookResponse = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $webhookQuery -ContentType "application/json" -Headers $headers -TimeoutSec 15 -ErrorAction Stop
    
    Write-Host "Webhooks:" -ForegroundColor Yellow
    foreach ($wh in $webhookResponse.data.app.webhooks) {
        $events = ($wh.syncEvents | ForEach-Object { $_.name }) -join ', '
        Write-Host "  - $($wh.name)" -ForegroundColor Cyan
        Write-Host "    Events: $events" -ForegroundColor Gray
        Write-Host "    Target URL: $($wh.targetUrl)" -ForegroundColor Gray
        Write-Host "    Active: $($wh.isActive)" -ForegroundColor $(if ($wh.isActive) { "Green" } else { "Red" })
        Write-Host ""
        
        # Test if URL is reachable
        if ($wh.targetUrl) {
            try {
                $testResponse = Invoke-WebRequest -Uri "$($wh.targetUrl)" -Method GET -TimeoutSec 5 -ErrorAction Stop
                Write-Host "    ✅ URL is reachable (Status: $($testResponse.StatusCode))" -ForegroundColor Green
            }
            catch {
                Write-Host "    ⚠ URL test failed: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
}
catch {
    Write-Host "✗ Query failed: $_" -ForegroundColor Red
}

Write-Host ""
