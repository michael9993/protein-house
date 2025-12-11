param(
    [string]$AuthToken = ""
)

Write-Host "`n=== Checking Webhook Registration ===`n" -ForegroundColor Cyan

if (-not $AuthToken) {
    Write-Host "Please provide an auth token:" -ForegroundColor Yellow
    Write-Host ".\check-webhook-registration.ps1 -AuthToken 'YOUR_TOKEN_HERE'" -ForegroundColor Gray
    Write-Host ""
    exit
}

$query = @"
{
    "query": "query { apps(first: 10, filter: { search: \"stripe\" }) { edges { node { id name isActive webhooks { id name syncEvents { name } isActive targetUrl } } } } }"
}
"@

$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $AuthToken"
}

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $query -Headers $headers -ContentType "application/json"
    
    if ($response.data.apps.edges.Count -gt 0) {
        $stripeApp = $response.data.apps.edges[0].node
        Write-Host "Stripe App Found:" -ForegroundColor Green
        Write-Host "  ID: $($stripeApp.id)" -ForegroundColor Cyan
        Write-Host "  Name: $($stripeApp.name)" -ForegroundColor Cyan
        Write-Host "  Active: $($stripeApp.isActive)" -ForegroundColor Cyan
        
        Write-Host "`nRegistered Webhooks:" -ForegroundColor Yellow
        foreach ($webhook in $stripeApp.webhooks) {
            Write-Host "  - $($webhook.name)" -ForegroundColor Cyan
            Write-Host "    ID: $($webhook.id)" -ForegroundColor Gray
            Write-Host "    Active: $($webhook.isActive)" -ForegroundColor Gray
            Write-Host "    Target: $($webhook.targetUrl)" -ForegroundColor Gray
            Write-Host "    Events: $($webhook.syncEvents.name -join ', ')" -ForegroundColor Gray
        }
        
        $plgWebhook = $stripeApp.webhooks | Where-Object { 
            $_.name -like "*Payment List Gateways*" -or 
            $_.syncEvents.name -contains "PAYMENT_LIST_GATEWAYS" -or
            $_.targetUrl -like "*/payment-list-gateways*"
        }
        
        Write-Host ""
        if ($plgWebhook) {
            Write-Host "✓ PAYMENT_LIST_GATEWAYS webhook IS registered!" -ForegroundColor Green
            Write-Host "  ID: $($plgWebhook.id)" -ForegroundColor Cyan
            Write-Host "  Active: $($plgWebhook.isActive)" -ForegroundColor Cyan
            Write-Host "  Target: $($plgWebhook.targetUrl)" -ForegroundColor Cyan
            if (-not $plgWebhook.isActive) {
                Write-Host "⚠ But it's INACTIVE!" -ForegroundColor Red
            }
        }
        else {
            Write-Host "✗ PAYMENT_LIST_GATEWAYS webhook NOT registered!" -ForegroundColor Red
            Write-Host ""
            Write-Host "To fix this, run:" -ForegroundColor Yellow
            Write-Host "  cd infra/scripts" -ForegroundColor Gray
            Write-Host "  .\register-payment-webhook.ps1 -AuthToken 'YOUR_TOKEN'" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "✗ No Stripe app found!" -ForegroundColor Red
    }
}
catch {
    Write-Host "✗ Query failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Gray
    }
}

Write-Host ""

