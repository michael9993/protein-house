param(
    [string]$CheckoutId = ""
)

Write-Host "`n=== Test Payment Gateway Initialize ===`n" -ForegroundColor Cyan

if (-not $CheckoutId) {
    Write-Host "This script tests the paymentGatewayInitialize mutation." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Cyan
    Write-Host "  .\test-payment-initialize.ps1 -CheckoutId 'CHECKOUT_ID_HERE'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To get a checkout ID:" -ForegroundColor Yellow
    Write-Host "  1. Go to storefront and add items to cart" -ForegroundColor Gray
    Write-Host "  2. Open browser DevTools → Network tab" -ForegroundColor Gray
    Write-Host "  3. Look for GraphQL requests, find 'checkout' query" -ForegroundColor Gray
    Write-Host "  4. Copy the checkout ID from the response" -ForegroundColor Gray
    Write-Host ""
    exit
}

# First, get available gateways from checkout
Write-Host "1. Getting available payment gateways from checkout..." -ForegroundColor Yellow
$checkoutQuery = @"
{
    "query": "query { checkout(id: \"$CheckoutId\") { id availablePaymentGateways { id name config { field value } } } }"
}
"@

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $checkoutQuery -ContentType "application/json" -TimeoutSec 15 -ErrorAction Stop
    
    if ($response.errors) {
        Write-Host "   ✗ GraphQL errors:" -ForegroundColor Red
        $response.errors | ForEach-Object { Write-Host "     $($_.message)" -ForegroundColor Red }
        exit
    }
    
    $checkout = $response.data.checkout
    $gateways = $checkout.availablePaymentGateways
    $stripeGw = $gateways | Where-Object { $_.id -like "*stripe*" }
    
    if (-not $stripeGw) {
        Write-Host "   ✗ Stripe gateway not found in checkout!" -ForegroundColor Red
        exit
    }
    
    Write-Host "   ✓ Found Stripe gateway:" -ForegroundColor Green
    Write-Host "     ID: $($stripeGw.id)" -ForegroundColor Cyan
    Write-Host "     Config fields: $($stripeGw.config.Count)" -ForegroundColor Cyan
    
    if ($stripeGw.config.Count -gt 0) {
        Write-Host "     Config:" -ForegroundColor Cyan
        foreach ($field in $stripeGw.config) {
            Write-Host "       - $($field.field): $($field.value.Substring(0, [Math]::Min(20, $field.value.Length)))..." -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "2. Testing paymentGatewayInitialize mutation..." -ForegroundColor Yellow
    
    # Build the mutation with the gateway config
    $paymentGateways = @(
        @{
            id   = $stripeGw.id
            data = $stripeGw.config
        }
    )
    
    $initializeMutation = @"
{
    "query": "mutation { paymentGatewayInitialize(id: \"$CheckoutId\", paymentGateways: $(ConvertTo-Json $paymentGateways -Depth 10)) { errors { message field code } gatewayConfigs { id data errors { message field code } } } }"
}
"@
    
    $initResponse = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $initializeMutation -ContentType "application/json" -TimeoutSec 15 -ErrorAction Stop
    
    if ($initResponse.errors) {
        Write-Host "   ✗ GraphQL errors:" -ForegroundColor Red
        $initResponse.errors | ForEach-Object { Write-Host "     $($_.message)" -ForegroundColor Red }
    }
    else {
        $result = $initResponse.data.paymentGatewayInitialize
        
        if ($result.errors) {
            Write-Host "   ⚠ Mutation errors:" -ForegroundColor Yellow
            $result.errors | ForEach-Object { Write-Host "     $($_.message)" -ForegroundColor Yellow }
        }
        
        $stripeConfig = $result.gatewayConfigs | Where-Object { $_.id -like "*stripe*" }
        
        if ($stripeConfig) {
            Write-Host "   ✓ Stripe gateway config received:" -ForegroundColor Green
            Write-Host "     ID: $($stripeConfig.id)" -ForegroundColor Cyan
            
            if ($stripeConfig.data) {
                $dataObj = $stripeConfig.data | ConvertFrom-Json
                if ($dataObj.stripePublishableKey) {
                    Write-Host "     ✅ Publishable key found: $($dataObj.stripePublishableKey.Substring(0, 20))..." -ForegroundColor Green
                }
                else {
                    Write-Host "     ✗ Publishable key NOT in data object" -ForegroundColor Red
                    Write-Host "     Data: $($stripeConfig.data | ConvertTo-Json -Compress)" -ForegroundColor Gray
                }
            }
            else {
                Write-Host "     ✗ No data object in response" -ForegroundColor Red
            }
            
            if ($stripeConfig.errors) {
                Write-Host "     ⚠ Gateway config errors:" -ForegroundColor Yellow
                $stripeConfig.errors | ForEach-Object { Write-Host "       $($_.message)" -ForegroundColor Yellow }
            }
        }
        else {
            Write-Host "   ✗ Stripe gateway config not found in response" -ForegroundColor Red
            Write-Host "     Received configs: $($result.gatewayConfigs.Count)" -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "   ✗ Query failed: $_" -ForegroundColor Red
}

Write-Host ""
