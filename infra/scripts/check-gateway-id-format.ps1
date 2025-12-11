Write-Host "`n=== Check Gateway ID Format ===`n" -ForegroundColor Cyan

Write-Host "Testing both shop and checkout queries to see actual gateway ID format..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Shop query (what we tested before)
Write-Host "1. Shop query (availablePaymentGateways):" -ForegroundColor Yellow
$shopQuery = @"
{
    "query": "query { shop { availablePaymentGateways(channel: \"default-channel\") { id name } } }"
}
"@

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $shopQuery -ContentType "application/json" -TimeoutSec 15 -ErrorAction Stop
    
    $gateways = $response.data.shop.availablePaymentGateways
    $stripeGw = $gateways | Where-Object { $_.id -like "*stripe*" }
    
    if ($stripeGw) {
        Write-Host "   ✓ Found Stripe gateway:" -ForegroundColor Green
        Write-Host "     ID: $($stripeGw.id)" -ForegroundColor Cyan
        Write-Host "     Name: $($stripeGw.name)" -ForegroundColor Cyan
    }
    else {
        Write-Host "   ✗ Stripe gateway not found" -ForegroundColor Red
    }
}
catch {
    Write-Host "   ✗ Query failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 2: Create a checkout and check its gateways
Write-Host "2. Creating a test checkout to check gateway IDs in checkout context..." -ForegroundColor Yellow

$createCheckoutMutation = @"
{
    "query": "mutation { checkoutCreate(input: { channel: \"default-channel\", lines: [] }) { checkout { id availablePaymentGateways { id name } } errors { message field } } }"
}
"@

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $createCheckoutMutation -ContentType "application/json" -TimeoutSec 15 -ErrorAction Stop
    
    if ($response.data.checkoutCreate.errors) {
        Write-Host "   ⚠ Checkout creation errors:" -ForegroundColor Yellow
        $response.data.checkoutCreate.errors | ForEach-Object { Write-Host "     $($_.message)" -ForegroundColor Yellow }
    }
    else {
        $checkout = $response.data.checkoutCreate.checkout
        Write-Host "   ✓ Checkout created:" -ForegroundColor Green
        Write-Host "     Checkout ID: $($checkout.id)" -ForegroundColor Cyan
        
        $gateways = $checkout.availablePaymentGateways
        Write-Host "     Found $($gateways.Count) gateway(s):" -ForegroundColor Cyan
        
        foreach ($gw in $gateways) {
            $color = if ($gw.id -like "*stripe*") { "Green" } else { "Gray" }
            Write-Host "       - ID: $($gw.id)" -ForegroundColor $color
            Write-Host "         Name: $($gw.name)" -ForegroundColor $color
        }
        
        $stripeGw = $gateways | Where-Object { $_.id -like "*stripe*" }
        if ($stripeGw) {
            Write-Host ""
            Write-Host "   ✅ STRIPE GATEWAY ID IN CHECKOUT: $($stripeGw.id)" -ForegroundColor Green
            Write-Host ""
            Write-Host "   Storefront expects: 'saleor.app.payment.stripe'" -ForegroundColor Yellow
            Write-Host "   Actual gateway ID:  '$($stripeGw.id)'" -ForegroundColor Yellow
            Write-Host ""
            
            if ($stripeGw.id -ne "saleor.app.payment.stripe") {
                Write-Host "   ⚠ ID MISMATCH!" -ForegroundColor Red
                Write-Host "   The storefront needs to be updated to recognize this ID." -ForegroundColor Yellow
            }
            else {
                Write-Host "   ✓ ID matches storefront expectation!" -ForegroundColor Green
            }
        }
        else {
            Write-Host "   ✗ Stripe gateway not found in checkout" -ForegroundColor Red
        }
    }
}
catch {
    Write-Host "   ✗ Query failed: $_" -ForegroundColor Red
}

Write-Host ""
