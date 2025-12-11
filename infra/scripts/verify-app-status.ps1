param(
    [string]$AuthToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUyNDUyOTgsIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUyNDU1OTgsInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.tyi_QaiVRqUeWavb-UInSdBx57lJEmwG7iZ9wWovLu9YuGc71YNJERI9DRNo_HC0itz441k-8dKOGvFhZcEnsPnrhIaNMLBoscZYt6oP18wE7J0y27D7GPHiMVwtpD6Cj_RF80JtYpmm6VftGY-XN_bs68fIzBxbqAitCZkfhEGOR_uRYEKiJZ-KhYpEseDUnPsklw8Qe7GaNH-G_LS5zVDCz5eaCX18gr0_FGt_q5lS3urXg1qrJhx3xYTY9RGa1RU8ubVZmSWmmFQfr-Dpo7xwkWPhQhpFtB3w-RkNnigbjQ_0pR-5M7w4RMnPDCgbzOcvkQw9q7edvugGXt1_hg"
)

Write-Host "`n=== Verify Stripe App Status ===`n" -ForegroundColor Cyan

$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $AuthToken"
}

$query = @"
{
    "query": "query { apps(first: 20, filter: { search: \"stripe\" }) { edges { node { id name identifier isActive removedAt } } } }"
}
"@

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $query -ContentType "application/json" -Headers $headers -TimeoutSec 15 -ErrorAction Stop
    
    if ($response.errors) {
        Write-Host "✗ GraphQL errors:" -ForegroundColor Red
        $response.errors | ForEach-Object { Write-Host "  $($_.message)" -ForegroundColor Red }
        exit
    }
    
    $stripeApp = $null
    foreach ($edge in $response.data.apps.edges) {
        if ($edge.node.name -like "*Stripe*") {
            $stripeApp = $edge.node
            break
        }
    }
    
    if (-not $stripeApp) {
        Write-Host "✗ Stripe app not found!" -ForegroundColor Red
        exit
    }
    
    Write-Host "✅ Stripe App Status:" -ForegroundColor Green
    Write-Host "   ID: $($stripeApp.id)" -ForegroundColor Cyan
    Write-Host "   Name: $($stripeApp.name)" -ForegroundColor Cyan
    Write-Host "   Identifier: '$($stripeApp.identifier)'" -ForegroundColor Cyan
    Write-Host "   Active: $($stripeApp.isActive)" -ForegroundColor Cyan
    Write-Host "   Removed: $($stripeApp.removedAt)" -ForegroundColor Cyan
    Write-Host ""
    
    $allGood = $true
    
    if ($stripeApp.identifier -ne "stripe") {
        Write-Host "⚠ ISSUE: Identifier is '$($stripeApp.identifier)', should be 'stripe'" -ForegroundColor Red
        $allGood = $false
    }
    else {
        Write-Host "✅ Identifier is correct: 'stripe'" -ForegroundColor Green
    }
    
    if (-not $stripeApp.isActive) {
        Write-Host "⚠ ISSUE: App is NOT active!" -ForegroundColor Red
        Write-Host "   This will prevent payment processing." -ForegroundColor Yellow
        $allGood = $false
    }
    else {
        Write-Host "✅ App is active" -ForegroundColor Green
    }
    
    if ($stripeApp.removedAt) {
        Write-Host "⚠ ISSUE: App has been removed!" -ForegroundColor Red
        $allGood = $false
    }
    else {
        Write-Host "✅ App is not removed" -ForegroundColor Green
    }
    
    Write-Host ""
    
    if ($allGood) {
        Write-Host "✅ All checks passed! The app should work correctly." -ForegroundColor Green
        Write-Host ""
        Write-Host "If you're still getting 'App with provided identifier not found':" -ForegroundColor Yellow
        Write-Host "  1. Try clearing browser cache and refreshing" -ForegroundColor Gray
        Write-Host "  2. Check browser console for detailed error messages" -ForegroundColor Gray
        Write-Host "  3. Check Stripe app logs: docker logs saleor-stripe-app-dev --tail 50" -ForegroundColor Gray
        Write-Host "  4. Check Saleor API logs for transaction processing errors" -ForegroundColor Gray
    }
    else {
        Write-Host "⚠ Some issues found. Please fix them before testing payments." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "✗ Query failed: $_" -ForegroundColor Red
}

Write-Host ""
