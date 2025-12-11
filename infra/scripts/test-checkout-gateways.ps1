param(
    [string]$CheckoutId = ""
)

Write-Host "`n=== Testing Checkout Payment Gateways ===`n" -ForegroundColor Cyan

if (-not $CheckoutId) {
    Write-Host "This script tests payment gateways in a checkout context." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Cyan
    Write-Host "  .\test-checkout-gateways.ps1 -CheckoutId 'CHECKOUT_ID_HERE'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To get a checkout ID:" -ForegroundColor Yellow
    Write-Host "  1. Go to storefront and add items to cart" -ForegroundColor Gray
    Write-Host "  2. Open browser DevTools → Network tab" -ForegroundColor Gray
    Write-Host "  3. Look for GraphQL requests, find 'checkout' query" -ForegroundColor Gray
    Write-Host "  4. Copy the checkout ID from the response" -ForegroundColor Gray
    Write-Host ""
    exit
}

$query = @"
{
    "query": "query { checkout(id: \"$CheckoutId\") { id availablePaymentGateways { id name currencies } } }"
}
"@

Write-Host "Querying checkout payment gateways..." -ForegroundColor Yellow
Write-Host "Checkout ID: $CheckoutId" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $query -ContentType "application/json" -TimeoutSec 15 -ErrorAction Stop
    
    if ($response.errors) {
        Write-Host "✗ GraphQL errors:" -ForegroundColor Red
        $response.errors | ForEach-Object { Write-Host "  $($_.message)" -ForegroundColor Red }
        exit
    }
    
    if (-not $response.data.checkout) {
        Write-Host "✗ Checkout not found!" -ForegroundColor Red
        Write-Host "  Make sure the checkout ID is correct and the checkout hasn't expired." -ForegroundColor Yellow
        exit
    }
    
    $gateways = $response.data.checkout.availablePaymentGateways
    
    if ($gateways.Count -eq 0) {
        Write-Host "⚠ No payment gateways found in checkout!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "This could mean:" -ForegroundColor Yellow
        Write-Host "  1. The webhook is returning empty array for this checkout" -ForegroundColor Gray
        Write-Host "  2. The checkout channel doesn't have Stripe configured" -ForegroundColor Gray
        Write-Host "  3. The webhook is failing" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Check Stripe app logs:" -ForegroundColor Cyan
        Write-Host "  docker logs saleor-stripe-app-dev --tail 50" -ForegroundColor Gray
    }
    else {
        Write-Host "Found $($gateways.Count) gateway(s):`n" -ForegroundColor Cyan
        
        foreach ($gw in $gateways) {
            $color = if ($gw.id -like "*stripe*") { "Green" } else { "Gray" }
            Write-Host "  - ID: $($gw.id)" -ForegroundColor $color
            Write-Host "    Name: $($gw.name)" -ForegroundColor $color
            Write-Host "    Currencies: $($gw.currencies -join ', ')" -ForegroundColor $color
            Write-Host ""
        }
        
        $stripeGw = $gateways | Where-Object { $_.id -like "*stripe*" }
        if ($stripeGw) {
            Write-Host "✅ STRIPE GATEWAY FOUND IN CHECKOUT!" -ForegroundColor Green
            Write-Host ""
            Write-Host "If it's not showing in the UI, check:" -ForegroundColor Yellow
            Write-Host "  1. PaymentMethods component rendering logic" -ForegroundColor Gray
            Write-Host "  2. supportedPaymentApps.ts filter" -ForegroundColor Gray
            Write-Host "  3. Browser console for errors" -ForegroundColor Gray
        }
        else {
            Write-Host "❌ Stripe gateway NOT found in checkout" -ForegroundColor Red
            Write-Host ""
            Write-Host "The webhook might not be returning Stripe for this checkout." -ForegroundColor Yellow
            Write-Host "Check if the checkout's channel has Stripe configured." -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "✗ Query failed: $_" -ForegroundColor Red
}

Write-Host ""
