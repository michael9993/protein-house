# Quick fix script to ensure PAYMENT_LIST_GATEWAYS webhook is registered

param(
    [string]$ApiUrl = "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/",
    [string]$StripeAppUrl = "https://indiana-decades-burn-cold.trycloudflare.com",
    [string]$AuthToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUyMTI2OTIsIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUyMTI5OTIsInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.SxDd5kqgQsx1sxVmLM5CyODyV0Remy9XLskTETNnzzDin7nf6gDaBej5jRLGE6NKsD36d7_UL23b6w2VjZi0R8RLpKdZYIYSEKD67z2yzAzSq6fl4PX4Oc8aQLILpVWZMqsz2jDPfQMaBw43fxqzpop1Hyl-eGUVBvpXjm12mbiNjMzywAn1asMyAIKMQjFXTKNfceWfLlYp8QpZaQQFJLtytznFeOcyFtUcP44UKvJGYKgsIc2ZbufnGRirW3jmcMPpiZrNwFJdkw146wC1hH_nVRWe8IpoyPyZUPo1hwpqpzOnVCH0hHeWk-AWQvOQUKQKimDGKmFhYFq1e4PgCQ"
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== Fix Payment Webhook Registration ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Restarting Stripe app container..." -ForegroundColor Yellow
try {
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    $composeFile = Join-Path (Split-Path -Parent $scriptPath) "docker-compose.dev.yml"
    docker compose -f $composeFile restart saleor-stripe-app
    Write-Host "✓ Stripe app restarted" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to restart: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 2: Waiting for app to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`nStep 3: Verifying manifest..." -ForegroundColor Yellow
try {
    $manifest = Invoke-RestMethod -Uri "$StripeAppUrl/api/manifest" -Method GET
    $hasWebhook = $manifest.webhooks | Where-Object { $_.syncEvents -contains "PAYMENT_LIST_GATEWAYS" }
    
    if ($hasWebhook) {
        Write-Host "✓ PAYMENT_LIST_GATEWAYS webhook found in manifest" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Webhook NOT in manifest - check app compilation" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "✗ Failed to check manifest: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 4: Checking Saleor webhook registration..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$checkQuery = @"
query {
  app(id: "QXBwOjIy") {
    id
    name
    isActive
    webhooks {
      id
      name
      isActive
      syncEvents {
        name
      }
    }
  }
}
"@

try {
    $headers = @{
        "Authorization" = "Bearer $AuthToken"
        "Content-Type"  = "application/json"
    }
    $body = @{ query = $checkQuery } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -Body $body
    
    $paymentWebhook = $response.data.app.webhooks | Where-Object { 
        if ($_.syncEvents) {
            ($_.syncEvents | ForEach-Object { $_.name }) -contains "PAYMENT_LIST_GATEWAYS"
        }
        else {
            $false
        }
    }
    
    if ($paymentWebhook) {
        Write-Host "✓ Webhook registered in Saleor!" -ForegroundColor Green
        Write-Host "  Name: $($paymentWebhook.name)" -ForegroundColor Gray
        Write-Host "  Active: $($paymentWebhook.isActive)" -ForegroundColor Gray
    }
    else {
        Write-Host "⚠ Webhook still not registered" -ForegroundColor Yellow
        Write-Host "`n💡 Try manually refreshing the app in Dashboard:" -ForegroundColor Cyan
        Write-Host "   1. Go to Dashboard → Extensions → Installed" -ForegroundColor White
        Write-Host "   2. Click on Stripe app" -ForegroundColor White
        Write-Host "   3. Click 'Refresh' or 'Update' button" -ForegroundColor White
        Write-Host "`n   Or reinstall the app to force webhook registration" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "✗ Error checking registration: $_" -ForegroundColor Red
}

Write-Host "`nStep 5: Testing gateway query..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$gatewayQuery = @"
query {
  shop {
    availablePaymentGateways(channel: "default-channel") {
      id
      name
      currencies
    }
  }
}
"@

try {
    $headers = @{
        "Authorization" = "Bearer $AuthToken"
        "Content-Type"  = "application/json"
    }
    $body = @{ query = $gatewayQuery } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -Body $body
    
    $gateways = $response.data.shop.availablePaymentGateways
    $stripeGateway = $gateways | Where-Object { 
        $_.id -like "*stripe*" -or $_.name -like "*Stripe*" 
    }
    
    if ($stripeGateway) {
        Write-Host "✓ Stripe gateway found!" -ForegroundColor Green
        Write-Host "  ID: $($stripeGateway.id)" -ForegroundColor Gray
        Write-Host "  Name: $($stripeGateway.name)" -ForegroundColor Gray
    }
    else {
        Write-Host "⚠ Stripe gateway still not appearing" -ForegroundColor Yellow
        Write-Host "  Found gateways: $($gateways.Count)" -ForegroundColor Gray
        foreach ($gw in $gateways) {
            Write-Host "    - $($gw.id): $($gw.name)" -ForegroundColor Gray
        }
        Write-Host "`n💡 Make sure:" -ForegroundColor Cyan
        Write-Host "   1. Stripe config is assigned to channel 'default-channel'" -ForegroundColor White
        Write-Host "   2. Webhook is registered (check above)" -ForegroundColor White
        Write-Host "   3. Check Stripe app logs for errors" -ForegroundColor White
    }
}
catch {
    Write-Host "✗ Error querying gateways: $_" -ForegroundColor Red
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
Write-Host ""
