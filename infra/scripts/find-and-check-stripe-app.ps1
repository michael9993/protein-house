# Find Stripe app and check webhook registration

param(
    [string]$ApiUrl = "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/",
    [string]$StripeAppUrl = "https://indiana-decades-burn-cold.trycloudflare.com",
    [string]$AuthToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUyMTI2OTIsIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUyMTI5OTIsInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.SxDd5kqgQsx1sxVmLM5CyODyV0Remy9XLskTETNnzzDin7nf6gDaBej5jRLGE6NKsD36d7_UL23b6w2VjZi0R8RLpKdZYIYSEKD67z2yzAzSq6fl4PX4Oc8aQLILpVWZMqsz2jDPfQMaBw43fxqzpop1Hyl-eGUVBvpXjm12mbiNjMzywAn1asMyAIKMQjFXTKNfceWfLlYp8QpZaQQFJLtytznFeOcyFtUcP44UKvJGYKgsIc2ZbufnGRirW3jmcMPpiZrNwFJdkw146wC1hH_nVRWe8IpoyPyZUPo1hwpqpzOnVCH0hHeWk-AWQvOQUKQKimDGKmFhYFq1e4PgCQ"
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== Find and Check Stripe App ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: List all apps to find Stripe
Write-Host "1. Finding Stripe app..." -ForegroundColor Yellow

$listAppsQuery = @"
query {
  apps(first: 20, filter: { search: "stripe" }) {
    edges {
      node {
        id
        name
        isActive
        appUrl
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
    $body = @{ query = $listAppsQuery } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -Body $body
    
    if ($response.errors) {
        Write-Host "   ✗ Error: $($response.errors[0].message)" -ForegroundColor Red
        exit 1
    }
    
    $stripeApp = $null
    foreach ($edge in $response.data.apps.edges) {
        $app = $edge.node
        if ($app.name -like "*Stripe*" -or $app.appUrl -like "*stripe*") {
            $stripeApp = $app
            Write-Host "   ✓ Found Stripe app:" -ForegroundColor Green
            Write-Host "     ID: $($app.id)" -ForegroundColor Gray
            Write-Host "     Name: $($app.name)" -ForegroundColor Gray
            Write-Host "     Active: $($app.isActive)" -ForegroundColor $(if ($app.isActive) { "Green" } else { "Red" })
            Write-Host "     URL: $($app.appUrl)" -ForegroundColor Gray
            break
        }
    }
    
    if (-not $stripeApp) {
        Write-Host "   ✗ Stripe app not found!" -ForegroundColor Red
        Write-Host "   Found apps:" -ForegroundColor Yellow
        foreach ($edge in $response.data.apps.edges) {
            Write-Host "     - $($edge.node.name) (ID: $($edge.node.id))" -ForegroundColor Gray
        }
        exit 1
    }
}
catch {
    Write-Host "   ✗ Error finding app: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Check webhooks for this app
Write-Host "`n2. Checking webhooks for Stripe app..." -ForegroundColor Yellow

$checkWebhookQuery = @"
query {
  app(id: "$($stripeApp.id)") {
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
      targetUrl
    }
  }
}
"@

try {
    $headers = @{
        "Authorization" = "Bearer $AuthToken"
        "Content-Type"  = "application/json"
    }
    $body = @{ query = $checkWebhookQuery } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -Body $body
    
    if ($response.errors) {
        Write-Host "   ✗ Error: $($response.errors[0].message)" -ForegroundColor Red
        exit 1
    }
    
    if ($response.data.app) {
        $app = $response.data.app
        Write-Host "   App: $($app.name)" -ForegroundColor Cyan
        Write-Host "   Active: $($app.isActive)" -ForegroundColor $(if ($app.isActive) { "Green" } else { "Red" })
        
        $paymentWebhook = $app.webhooks | Where-Object { 
            if ($_.syncEvents) {
                ($_.syncEvents | ForEach-Object { $_.name }) -contains "PAYMENT_LIST_GATEWAYS"
            }
            else {
                $false
            }
        }
        
        if ($paymentWebhook) {
            Write-Host "   ✓ PAYMENT_LIST_GATEWAYS webhook registered!" -ForegroundColor Green
            Write-Host "     Webhook ID: $($paymentWebhook.id)" -ForegroundColor Gray
            Write-Host "     Name: $($paymentWebhook.name)" -ForegroundColor Gray
            Write-Host "     Active: $($paymentWebhook.isActive)" -ForegroundColor $(if ($paymentWebhook.isActive) { "Green" } else { "Red" })
            Write-Host "     Target URL: $($paymentWebhook.targetUrl)" -ForegroundColor Gray
        }
        else {
            Write-Host "   ✗ PAYMENT_LIST_GATEWAYS webhook NOT registered!" -ForegroundColor Red
            Write-Host "     Registered webhooks:" -ForegroundColor Yellow
            foreach ($wh in $app.webhooks) {
                $events = if ($wh.syncEvents) { 
                    ($wh.syncEvents | ForEach-Object { $_.name }) -join ', ' 
                }
                else { 
                    "none" 
                }
                Write-Host "       - $($wh.name): $events" -ForegroundColor Gray
            }
            Write-Host "`n   💡 Solution: Update the app to sync webhooks from manifest" -ForegroundColor Cyan
            Write-Host "`n   Option 1: Dashboard (Recommended)" -ForegroundColor Yellow
            Write-Host "     1. Go to Dashboard → Extensions → Installed" -ForegroundColor White
            Write-Host "     2. Click on Stripe app" -ForegroundColor White
            Write-Host "     3. Look for 'Update' or 'Refresh' button" -ForegroundColor White
            Write-Host "     4. Click it to sync webhooks from manifest" -ForegroundColor White
            Write-Host "`n   Option 2: Reinstall app" -ForegroundColor Yellow
            Write-Host "     This will force webhook registration" -ForegroundColor White
        }
    }
}
catch {
    Write-Host "   ✗ Error checking webhooks: $_" -ForegroundColor Red
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
Write-Host ""
