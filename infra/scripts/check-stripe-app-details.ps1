# Check Stripe app details to understand gateway ID generation

param(
    [string]$ApiUrl = "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/",
    [string]$AuthToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUyMTI2OTIsIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUyMTI5OTIsInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.SxDd5kqgQsx1sxVmLM5CyODyV0Remy9XLskTETNnzzDin7nf6gDaBej5jRLGE6NKsD36d7_UL23b6w2VjZi0R8RLpKdZYIYSEKD67z2yzAzSq6fl4PX4Oc8aQLILpVWZMqsz2jDPfQMaBw43fxqzpop1Hyl-eGUVBvpXjm12mbiNjMzywAn1asMyAIKMQjFXTKNfceWfLlYp8QpZaQQFJLtytznFeOcyFtUcP44UKvJGYKgsIc2ZbufnGRirW3jmcMPpiZrNwFJdkw146wC1hH_nVRWe8IpoyPyZUPo1hwpqpzOnVCH0hHeWk-AWQvOQUKQKimDGKmFhYFq1e4PgCw"
)

Write-Host "`n=== Stripe App Details ===" -ForegroundColor Cyan

$query = @"
query {
  apps(first: 20, filter: { search: "stripe" }) {
    edges {
      node {
        id
        name
        identifier
        isActive
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
    $body = @{ query = $query } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -Body $body
    
    $stripeApp = $null
    foreach ($edge in $response.data.apps.edges) {
        $app = $edge.node
        if ($app.name -like "*Stripe*") {
            $stripeApp = $app
            break
        }
    }
    
    if ($stripeApp) {
        Write-Host "`nStripe App Found:" -ForegroundColor Green
        Write-Host "  Name: $($stripeApp.name)" -ForegroundColor White
        Write-Host "  ID: $($stripeApp.id)" -ForegroundColor White
        Write-Host "  Identifier: $($stripeApp.identifier)" -ForegroundColor White
        Write-Host "  Active: $($stripeApp.isActive)" -ForegroundColor White
        
        Write-Host "`n=== Gateway ID Transformation ===" -ForegroundColor Cyan
        Write-Host "Saleor transforms gateway IDs using this formula:" -ForegroundColor Yellow
        Write-Host "  app:{app_identifier}:{external_id}`n" -ForegroundColor Gray
        
        $appIdentifier = if ($stripeApp.identifier) { $stripeApp.identifier } else { $stripeApp.id }
        $externalId = "stripe"  # What our webhook returns
        $transformedId = "app:$($appIdentifier):$externalId"
        
        Write-Host "Our webhook returns:" -ForegroundColor Yellow
        Write-Host "  { id: `"$externalId`" }" -ForegroundColor Gray
        
        Write-Host "`nSaleor transforms it to:" -ForegroundColor Yellow
        Write-Host "  `"$transformedId`"`n" -ForegroundColor Green
        
        Write-Host "Expected gateway ID in availablePaymentGateways:" -ForegroundColor Yellow
        Write-Host "  $transformedId`n" -ForegroundColor Green
    }
    else {
        Write-Host "Stripe app not found!" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

