# Comprehensive Payment Gateway Debug Script

param(
  [string]$ApiUrl = "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/",
  [string]$StripeAppUrl = "https://indiana-decades-burn-cold.trycloudflare.com",
  [string]$AuthToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUyMTI2OTIsIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUyMTI5OTIsInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.SxDd5kqgQsx1sxVmLM5CyODyV0Remy9XLskTETNnzzDin7nf6gDaBej5jRLGE6NKsD36d7_UL23b6w2VjZi0R8RLpKdZYIYSEKD67z2yzAzSq6fl4PX4Oc8aQLILpVWZMqsz2jDPfQMaBw43fxqzpop1Hyl-eGUVBvpXjm12mbiNjMzywAn1asMyAIKMQjFXTKNfceWfLlYp8QpZaQQFJLtytznFeOcyFtUcP44UKvJGYKgsIc2ZbufnGRirW3jmcMPpiZrNwFJdkw146wC1hH_nVRWe8IpoyPyZUPo1hwpqpzOnVCH0hHeWk-AWQvOQUKQKimDGKmFhYFq1e4PgCw"
)

$ErrorActionPreference = "Stop"

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   COMPREHENSIVE PAYMENT GATEWAY DEBUG" -ForegroundColor Yellow
Write-Host "=============================================`n" -ForegroundColor Cyan

$headers = @{
  "Authorization" = "Bearer $AuthToken"
  "Content-Type"  = "application/json"
}

# Test 1: Check Stripe app details
Write-Host "1. Checking Stripe App Details..." -ForegroundColor Yellow
$appQuery = @"
query {
  apps(first: 20, filter: { search: "stripe" }) {
    edges {
      node {
        id
        name
        identifier
        isActive
        permissions {
          code
        }
      }
    }
  }
}
"@

try {
  $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -Body (@{ query = $appQuery } | ConvertTo-Json)
  $stripeApp = $response.data.apps.edges[0].node
  Write-Host "   ✓ App ID: $($stripeApp.id)" -ForegroundColor Green
  Write-Host "   ✓ Identifier: $($stripeApp.identifier)" -ForegroundColor Green
  Write-Host "   ✓ Active: $($stripeApp.isActive)" -ForegroundColor Green
  Write-Host "   ✓ Permissions: $($stripeApp.permissions.code -join ', ')`n" -ForegroundColor Green
    
  # Calculate expected gateway ID
  $appIdentifier = if ($stripeApp.identifier) { $stripeApp.identifier } else { $stripeApp.id }
  $expectedGatewayId = "app:$($appIdentifier):stripe"
  Write-Host "   Expected Gateway ID: `"$expectedGatewayId`"`n" -ForegroundColor Cyan
}
catch {
  Write-Host "   ✗ Error: $_`n" -ForegroundColor Red
}

# Test 2: Check webhook registration
Write-Host "2. Checking Webhook Registration..." -ForegroundColor Yellow
$webhookQuery = @"
query {
  app(id: "$($stripeApp.id)") {
    webhooks {
      id
      name
      isActive
      syncEvents {
        eventType
      }
    }
  }
}
"@

try {
  $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -Body (@{ query = $webhookQuery } | ConvertTo-Json)
  $paymentWebhook = $response.data.app.webhooks | Where-Object { 
    if ($_.syncEvents) {
      ($_.syncEvents | ForEach-Object { $_.eventType }) -contains "PAYMENT_LIST_GATEWAYS"
    }
    else { $false }
  }
    
  if ($paymentWebhook) {
    Write-Host "   ✓ PAYMENT_LIST_GATEWAYS webhook registered" -ForegroundColor Green
    Write-Host "   ✓ Webhook ID: $($paymentWebhook.id)" -ForegroundColor Green
    Write-Host "   ✓ Active: $($paymentWebhook.isActive)`n" -ForegroundColor Green
  }
  else {
    Write-Host "   ✗ PAYMENT_LIST_GATEWAYS webhook NOT registered`n" -ForegroundColor Red
  }
}
catch {
  Write-Host "   ✗ Error: $_`n" -ForegroundColor Red
}

# Test 3: Query available payment gateways
Write-Host "3. Querying Available Payment Gateways..." -ForegroundColor Yellow
$gatewayQuery = @"
query {
  shop {
    availablePaymentGateways(channel: "default-channel") {
      id
      name
      currencies
      config {
        field
        value
      }
    }
  }
}
"@

try {
  $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -Body (@{ query = $gatewayQuery } | ConvertTo-Json)
    
  if ($response.errors) {
    Write-Host "   ✗ GraphQL Errors:" -ForegroundColor Red
    foreach ($error in $response.errors) {
      Write-Host "     $($error.message)" -ForegroundColor Yellow
    }
  }
    
  $gateways = $response.data.shop.availablePaymentGateways
  Write-Host "   Found $($gateways.Count) gateway(s):" -ForegroundColor White
    
  foreach ($gw in $gateways) {
    Write-Host "   - ID: $($gw.id)" -ForegroundColor Gray
    Write-Host "     Name: $($gw.name)" -ForegroundColor Gray
    Write-Host "     Currencies: $($gw.currencies -join ', ')" -ForegroundColor Gray
  }
    
  $stripeGateway = $gateways | Where-Object { $_.id -like "*stripe*" }
  if ($stripeGateway) {
    Write-Host "`n   ✓ Stripe gateway FOUND!`n" -ForegroundColor Green
  }
  else {
    Write-Host "`n   ✗ Stripe gateway NOT FOUND`n" -ForegroundColor Red
  }
}
catch {
  Write-Host "   ✗ Error: $_`n" -ForegroundColor Red
  if ($_.ErrorDetails) {
    Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
  }
}

# Test 4: Check webhook deliveries in Dashboard
Write-Host "4. Recent Webhook Deliveries..." -ForegroundColor Yellow
Write-Host "   Check Dashboard → Extensions → Stripe → Webhooks" -ForegroundColor White
Write-Host "   Look for 'Stripe Payment List Gateways' webhook" -ForegroundColor White
Write-Host "   Check if there are recent successful deliveries`n" -ForegroundColor White

# Test 5: Check Stripe app logs
Write-Host "5. Checking Stripe App Logs..." -ForegroundColor Yellow
Write-Host "   Running: docker compose logs saleor-stripe-app --tail=50`n" -ForegroundColor White

docker compose -f "c:\Users\micha\saleor-platform\infra\docker-compose.dev.yml" logs saleor-stripe-app --tail=50 --since 5m | Select-String "PAYMENT_LIST_GATEWAYS|payment-list-gateways" -Context 2

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   DEBUG SUMMARY" -ForegroundColor Yellow
Write-Host "=============================================`n" -ForegroundColor Cyan

Write-Host "Expected Gateway ID format:" -ForegroundColor Yellow
Write-Host "  app:{app_identifier}:{external_id}" -ForegroundColor Gray
Write-Host "  Example: app:stripe:stripe`n" -ForegroundColor Gray

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check webhook delivery logs in Dashboard" -ForegroundColor White
Write-Host "2. Verify Stripe app logs show successful webhook calls" -ForegroundColor White
Write-Host "3. If webhook is being called but gateway not appearing," -ForegroundColor White
Write-Host "   the issue might be with how Saleor processes the response`n" -ForegroundColor White

