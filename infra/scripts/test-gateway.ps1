$query = @"
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

$headers = @{
    "Content-Type" = "application/json"
}

$body = @{ query = $query } | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Headers $headers -Body $body
    
    Write-Host "`n=== RESULT ===`n" -ForegroundColor Cyan
    $gateways = $response.data.shop.availablePaymentGateways
    
    if ($gateways) {
        Write-Host "Found $($gateways.Count) gateway(s):" -ForegroundColor Green
        foreach ($gw in $gateways) {
            Write-Host "  - ID: $($gw.id)" -ForegroundColor Yellow
            Write-Host "    Name: $($gw.name)" -ForegroundColor White
            Write-Host "    Currencies: $($gw.currencies -join ', ')" -ForegroundColor White
        }
    }
    else {
        Write-Host "No gateways found" -ForegroundColor Red
    }
    
    $stripeGateway = $gateways | Where-Object { $_.id -like "*stripe*" -or $_.name -like "*Stripe*" }
    if ($stripeGateway) {
        Write-Host "`n✅ STRIPE GATEWAY FOUND!`n" -ForegroundColor Green
    }
    else {
        Write-Host "`n❌ Stripe gateway NOT found`n" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
}

