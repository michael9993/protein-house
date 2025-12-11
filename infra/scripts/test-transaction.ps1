param(
    [string]$AuthToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUyNDg0MjksIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUyNDg3MjksInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.baLtMqcGziMkNliQu6hDkdAjtf98rdmZmnRkZmQc35A33XpMg32LVl3anFTj0yJ3io6RZxdao7O6b3JWUtcO4eH_90d4gjxeE9IOnCIwRQRzcuolXUcM2sffBT7q0xTQG6h3cXM7baWyiZE4B_vWDnMgiiBfN3HE9957VcXiMsHSwE89Cl3JzG2wZOYUG4SzEQtpB7fy1YRByCjPAcxyJu6PD42dYb7DkBLTrIQffun1eCcvzwxxcP2X6Jb7Q_cXx5_B9MJgsloINJLasjCbTwho4hWlW4XNBtLhzNIu1Il7zM3KX_8O2vVALxcl1JJKBeT4HMwZ0MfC32zRWuU2Ww",
    [string]$CheckoutId = ""
)

Write-Host "`n=== Test Transaction Flow ===`n" -ForegroundColor Cyan

$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $AuthToken"
}

# Step 1: Check app status
Write-Host "1. Checking Stripe app status..." -ForegroundColor Yellow
$appQuery = @"
{
    "query": "query { apps(first: 20, filter: { search: \"stripe\" }) { edges { node { id name identifier isActive removedAt } } } }"
}
"@

try {
    $appResponse = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $appQuery -ContentType "application/json" -Headers $headers -TimeoutSec 15
    
    if ($appResponse.errors) {
        Write-Host "   ✗ GraphQL errors:" -ForegroundColor Red
        $appResponse.errors | ForEach-Object { Write-Host "     $($_.message)" -ForegroundColor Red }
    }
    else {
        $stripeApp = $null
        foreach ($edge in $appResponse.data.apps.edges) {
            if ($edge.node.name -like "*Stripe*") {
                $stripeApp = $edge.node
                break
            }
        }
        
        if ($stripeApp) {
            Write-Host "   ✓ App ID: $($stripeApp.id)" -ForegroundColor Green
            Write-Host "   ✓ App Name: $($stripeApp.name)" -ForegroundColor Green
            Write-Host "   ✓ Identifier: '$($stripeApp.identifier)'" -ForegroundColor Green
            Write-Host "   ✓ Active: $($stripeApp.isActive)" -ForegroundColor Green
            Write-Host "   ✓ Removed: $($stripeApp.removedAt)" -ForegroundColor Green
        }
        else {
            Write-Host "   ✗ Stripe app not found!" -ForegroundColor Red
        }
    }
}
catch {
    Write-Host "   ✗ Failed to check app status: $_" -ForegroundColor Red
}

Write-Host ""

# Step 2: Check available payment gateways
Write-Host "2. Checking available payment gateways..." -ForegroundColor Yellow
$gatewaysQuery = @"
{
    "query": "query { shop { availablePaymentGateways { id name } } }"
}
"@

try {
    $gatewaysResponse = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $gatewaysQuery -ContentType "application/json" -Headers $headers -TimeoutSec 15
    
    if ($gatewaysResponse.errors) {
        Write-Host "   ✗ GraphQL errors:" -ForegroundColor Red
        $gatewaysResponse.errors | ForEach-Object { Write-Host "     $($_.message)" -ForegroundColor Red }
    }
    else {
        $gateways = $gatewaysResponse.data.shop.availablePaymentGateways
        if ($gateways) {
            Write-Host "   ✓ Found $($gateways.Count) gateway(s):" -ForegroundColor Green
            foreach ($gw in $gateways) {
                Write-Host "     - ID: $($gw.id), Name: $($gw.name)" -ForegroundColor Cyan
            }
        }
        else {
            Write-Host "   ✗ No gateways found!" -ForegroundColor Red
        }
    }
}
catch {
    Write-Host "   ✗ Failed to check gateways: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "If the app identifier is 'stripe' and the gateway ID is 'app.stripe.stripe'," -ForegroundColor Yellow
Write-Host "the transaction should work. If not, check:" -ForegroundColor Yellow
Write-Host "  1. Clear browser cache completely" -ForegroundColor Gray
Write-Host "  2. Check the exact gateway ID being sent in the transaction" -ForegroundColor Gray
Write-Host "  3. Check Saleor API logs: docker logs saleor-api --tail 50 | findstr /i 'identifier'" -ForegroundColor Gray
Write-Host ""
