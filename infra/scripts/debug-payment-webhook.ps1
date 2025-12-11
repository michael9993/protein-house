# Diagnostic script to debug PAYMENT_LIST_GATEWAYS webhook
# Checks if webhook is registered and being called

param(
    [string]$ApiUrl = "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/",
    [string]$StripeAppUrl = "https://indiana-decades-burn-cold.trycloudflare.com",
    [string]$ChannelSlug = "default-channel",
    [string]$AuthToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUyMTI2OTIsIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUyMTI5OTIsInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.SxDd5kqgQsx1sxVmLM5CyODyV0Remy9XLskTETNnzzDin7nf6gDaBej5jRLGE6NKsD36d7_UL23b6w2VjZi0R8RLpKdZYIYSEKD67z2yzAzSq6fl4PX4Oc8aQLILpVWZMqsz2jDPfQMaBw43fxqzpop1Hyl-eGUVBvpXjm12mbiNjMzywAn1asMyAIKMQjFXTKNfceWfLlYp8QpZaQQFJLtytznFeOcyFtUcP44UKvJGYKgsIc2ZbufnGRirW3jmcMPpiZrNwFJdkw146wC1hH_nVRWe8IpoyPyZUPo1hwpqpzOnVCH0hHeWk-AWQvOQUKQKimDGKmFhYFq1e4PgCQ"
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== Payment Webhook Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Stripe app manifest includes the webhook
Write-Host "1. Checking Stripe app manifest..." -ForegroundColor Yellow
try {
    $manifestUrl = "$StripeAppUrl/api/manifest"
    $manifest = Invoke-RestMethod -Uri $manifestUrl -Method GET
    
    $paymentListGatewaysWebhook = $manifest.webhooks | Where-Object { 
        $_.syncEvents -contains "PAYMENT_LIST_GATEWAYS" 
    }
    
    if ($paymentListGatewaysWebhook) {
        Write-Host "   ✓ PAYMENT_LIST_GATEWAYS webhook found in manifest" -ForegroundColor Green
        Write-Host "     Name: $($paymentListGatewaysWebhook.name)" -ForegroundColor Gray
        Write-Host "     Target URL: $($paymentListGatewaysWebhook.targetUrl)" -ForegroundColor Gray
        Write-Host "     Active: $($paymentListGatewaysWebhook.isActive)" -ForegroundColor Gray
    }
    else {
        Write-Host "   ✗ PAYMENT_LIST_GATEWAYS webhook NOT found in manifest!" -ForegroundColor Red
        Write-Host "     Found webhooks:" -ForegroundColor Yellow
        foreach ($wh in $manifest.webhooks) {
            Write-Host "       - $($wh.name): $($wh.syncEvents -join ', ')" -ForegroundColor Gray
        }
        exit 1
    }
}
catch {
    Write-Host "   ✗ Failed to fetch manifest: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Check if webhook is registered in Saleor
Write-Host "`n2. Checking if webhook is registered in Saleor..." -ForegroundColor Yellow

$checkWebhookQuery = @"
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
    $body = @{
        query = $checkWebhookQuery
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -Body $body
    
    if ($response.errors) {
        Write-Host "   ✗ GraphQL errors:" -ForegroundColor Red
        foreach ($error in $response.errors) {
            Write-Host "     $($error.message)" -ForegroundColor Yellow
        }
        Write-Host "`n   💡 Trying to list all apps instead..." -ForegroundColor Cyan
        
        # Try listing apps
        $listAppsQuery = @"
query {
  apps(first: 10) {
    edges {
      node {
        id
        name
        isActive
      }
    }
  }
}
"@
        $listBody = @{ query = $listAppsQuery } | ConvertTo-Json
        $listResponse = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -Body $listBody
        
        if ($listResponse.data.apps.edges) {
            Write-Host "   Found apps:" -ForegroundColor Cyan
            foreach ($edge in $listResponse.data.apps.edges) {
                $appNode = $edge.node
                Write-Host "     - $($appNode.name) (ID: $($appNode.id), Active: $($appNode.isActive))" -ForegroundColor Gray
                if ($appNode.name -like "*Stripe*") {
                    Write-Host "       ⚠ This might be the Stripe app - update the script with this ID!" -ForegroundColor Yellow
                }
            }
        }
    }
    elseif ($response.data.app) {
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
            Write-Host "   ✓ PAYMENT_LIST_GATEWAYS webhook registered in Saleor" -ForegroundColor Green
            Write-Host "     Webhook ID: $($paymentWebhook.id)" -ForegroundColor Gray
            Write-Host "     Name: $($paymentWebhook.name)" -ForegroundColor Gray
            Write-Host "     Active: $($paymentWebhook.isActive)" -ForegroundColor $(if ($paymentWebhook.isActive) { "Green" } else { "Red" })
            Write-Host "     Target URL: $($paymentWebhook.targetUrl)" -ForegroundColor Gray
        }
        else {
            Write-Host "   ✗ PAYMENT_LIST_GATEWAYS webhook NOT registered in Saleor!" -ForegroundColor Red
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
            Write-Host "`n   💡 Solution: Restart the Stripe app container to register the webhook" -ForegroundColor Yellow
            Write-Host "      docker compose -f infra/docker-compose.dev.yml restart saleor-stripe-app" -ForegroundColor White
        }
    }
    else {
        Write-Host "   ✗ App not found or query failed" -ForegroundColor Red
    }
}
catch {
    Write-Host "   ✗ Error checking webhook registration: $_" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

# Step 3: Test webhook endpoint directly (simulate Saleor call)
Write-Host "`n3. Testing webhook endpoint directly..." -ForegroundColor Yellow

$testPayload = @{
    checkout = @{
        id      = "test-checkout-id"
        channel = @{
            id   = "test-channel-id"
            slug = $ChannelSlug
        }
    }
    currency = "USD"
} | ConvertTo-Json -Depth 10

try {
    # Note: This will likely fail without proper auth, but we can see if endpoint exists
    $webhookUrl = "$StripeAppUrl/api/webhooks/saleor/payment-list-gateways"
    Write-Host "   Testing: $webhookUrl" -ForegroundColor Gray
    
    try {
        $webhookResponse = Invoke-WebRequest -Uri $webhookUrl -Method POST -ContentType "application/json" -Body $testPayload -UseBasicParsing -ErrorAction Stop
        Write-Host "   ✓ Webhook endpoint responds (status: $($webhookResponse.StatusCode))" -ForegroundColor Green
        Write-Host "   Response: $($webhookResponse.Content.Substring(0, [Math]::Min(200, $webhookResponse.Content.Length)))..." -ForegroundColor Gray
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 403) {
            Write-Host "   ✓ Webhook endpoint exists (auth required, which is expected)" -ForegroundColor Green
        }
        elseif ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "   ✗ Webhook endpoint NOT FOUND (404)" -ForegroundColor Red
            Write-Host "   💡 Check if the route file exists and Next.js compiled successfully" -ForegroundColor Yellow
        }
        else {
            Write-Host "   ⚠ Webhook endpoint responded with: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
            Write-Host "   This might be expected (auth/validation errors)" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "   ✗ Error testing webhook: $_" -ForegroundColor Red
}

# Step 4: Check if app needs to be restarted
Write-Host "`n4. Checking if app needs restart..." -ForegroundColor Yellow

if (-not $paymentWebhook) {
    Write-Host "   ⚠ Webhook not registered in Saleor!" -ForegroundColor Yellow
    Write-Host "`n   💡 Solution: Restart the Stripe app to register the new webhook" -ForegroundColor Cyan
    Write-Host "`n   Run this command:" -ForegroundColor White
    Write-Host "   docker compose -f infra/docker-compose.dev.yml restart saleor-stripe-app" -ForegroundColor Green
    Write-Host "`n   Then wait ~30 seconds and run this script again to verify." -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# Step 5: Check Stripe app logs for webhook calls
Write-Host "`n5. Checking Stripe app logs for webhook activity..." -ForegroundColor Yellow
Write-Host "   Run this to see recent logs:" -ForegroundColor White
Write-Host "   docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app --tail=100 | Select-String 'PAYMENT_LIST_GATEWAYS'" -ForegroundColor Gray
Write-Host ""

# Step 6: Verify channel configuration
Write-Host "6. Verify Stripe configuration:" -ForegroundColor Yellow
Write-Host "   - Go to Stripe app configuration page" -ForegroundColor White
Write-Host "   - Ensure a Stripe config is created" -ForegroundColor White
Write-Host "   - Assign the config to channel '$ChannelSlug'" -ForegroundColor White
Write-Host "   - The webhook only returns gateways if config is assigned!" -ForegroundColor Yellow
Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
if ($paymentWebhook -and $paymentWebhook.isActive) {
    Write-Host "✓ Webhook is registered and active" -ForegroundColor Green
    Write-Host "✓ Manifest includes webhook" -ForegroundColor Green
    Write-Host "`nIf gateway still doesn't appear:" -ForegroundColor Yellow
    Write-Host "  1. Verify Stripe config is assigned to channel" -ForegroundColor White
    Write-Host "  2. Check Stripe app logs for errors" -ForegroundColor White
    Write-Host "  3. Check Saleor API logs for webhook delivery failures" -ForegroundColor White
}
else {
    Write-Host "✗ Webhook registration issue detected" -ForegroundColor Red
    Write-Host "  Follow the restart instructions above" -ForegroundColor Yellow
}
Write-Host ""
