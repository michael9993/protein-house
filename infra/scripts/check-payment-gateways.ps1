# Diagnostic script to check why Stripe payment gateway isn't appearing
# This helps debug payment gateway visibility issues

param(
    [string]$ApiUrl = "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/",
    [string]$ChannelSlug = "default-channel",
    [string]$AuthToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUyMTI2OTIsIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUyMTI5OTIsInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.SxDd5kqgQsx1sxVmLM5CyODyV0Remy9XLskTETNnzzDin7nf6gDaBej5jRLGE6NKsD36d7_UL23b6w2VjZi0R8RLpKdZYIYSEKD67z2yzAzSq6fl4PX4Oc8aQLILpVWZMqsz2jDPfQMaBw43fxqzpop1Hyl-eGUVBvpXjm12mbiNjMzywAn1asMyAIKMQjFXTKNfceWfLlYp8QpZaQQFJLtytznFeOcyFtUcP44UKvJGYKgsIc2ZbufnGRirW3jmcMPpiZrNwFJdkw146wC1hH_nVRWe8IpoyPyZUPo1hwpqpzOnVCH0hHeWk-AWQvOQUKQKimDGKmFhYFq1e4PgCQ"

)

$ErrorActionPreference = "Stop"

Write-Host "`n=== Payment Gateway Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

# Check if API is accessible
Write-Host "1. Checking API accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl" -Method POST -ContentType "application/json" -Body '{"query":"{ __typename }"}' -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✓ API is accessible" -ForegroundColor Green
}
catch {
    Write-Host "   ✗ Cannot reach API: $_" -ForegroundColor Red
    Write-Host "   Make sure the API is running and accessible" -ForegroundColor Yellow
    exit 1
}

# GraphQL query to check available payment gateways
$query = @"
query {
  shop {
    availablePaymentGateways(channel: "$ChannelSlug") {
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

Write-Host "`n2. Querying available payment gateways..." -ForegroundColor Yellow
Write-Host "   Channel: $ChannelSlug" -ForegroundColor Gray
Write-Host "   API: $ApiUrl" -ForegroundColor Gray

try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    if ($AuthToken) {
        $headers["Authorization"] = "Bearer $AuthToken"
    }
    $body = @{
        query = $query
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -Body $body

    $gateways = $response.data.shop.availablePaymentGateways

    Write-Host "`n   Found $($gateways.Count) payment gateway(s):" -ForegroundColor Cyan
    foreach ($gateway in $gateways) {
        Write-Host "   - ID: $($gateway.id)" -ForegroundColor White
        Write-Host "     Name: $($gateway.name)" -ForegroundColor Gray
        if ($gateway.currencies) {
            Write-Host "     Currencies: $($gateway.currencies -join ', ')" -ForegroundColor Gray
        }
    }

    $stripeGateway = $gateways | Where-Object { $_.id -eq "stripe" -or $_.id -eq "saleor.app.payment.stripe" -or $_.name -like "*Stripe*" }
    
    if ($stripeGateway) {
        Write-Host "`n   ✓ Stripe gateway found!" -ForegroundColor Green
        Write-Host "     ID: $($stripeGateway.id)" -ForegroundColor Gray
        Write-Host "     Name: $($stripeGateway.name)" -ForegroundColor Gray
        if ($stripeGateway.currencies) {
            Write-Host "     Currencies: $($stripeGateway.currencies -join ', ')" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "`n   ✗ Stripe gateway NOT found in available gateways" -ForegroundColor Red
        Write-Host "`n   Possible causes:" -ForegroundColor Yellow
        Write-Host "   1. Stripe app not installed or not active" -ForegroundColor White
        Write-Host "   2. Stripe configuration not assigned to channel '$ChannelSlug'" -ForegroundColor White
        Write-Host "   3. Stripe app doesn't have HANDLE_PAYMENTS permission" -ForegroundColor White
        Write-Host "   4. Wrong channel slug (check your storefront's default channel)" -ForegroundColor White
    }

}
catch {
    Write-Host "   ✗ Error querying gateways: $_" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n3. Next steps:" -ForegroundColor Yellow
Write-Host "   - Check Dashboard → Extensions → Installed → Stripe (should be active)" -ForegroundColor White
Write-Host "   - Check Stripe app → Channels configurations (assign config to channel)" -ForegroundColor White
Write-Host "   - Verify channel slug matches your storefront's channel" -ForegroundColor White
Write-Host ""
