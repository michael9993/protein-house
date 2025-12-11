Write-Host "`n=== Get Webhook Error Details ===`n" -ForegroundColor Cyan

Write-Host "Fetching last 100 lines of Stripe app logs..." -ForegroundColor Yellow
$logs = docker logs saleor-stripe-app-dev --tail 100 2>&1

Write-Host "`nLooking for PAYMENT_LIST_GATEWAYS errors..." -ForegroundColor Yellow

# Find the error section
$errorLines = @()
$capturing = $false
for ($i = 0; $i -lt $logs.Count; $i++) {
    $line = $logs[$i]
    
    if ($line -like "*PAYMENT_LIST_GATEWAYS*" -or $line -like "*payment-list-gateways*") {
        $capturing = $true
        $errorLines += $line
    }
    elseif ($capturing) {
        $errorLines += $line
        # Stop capturing after we get enough context (next 20 lines)
        if ($errorLines.Count -gt 25) {
            $capturing = $false
        }
    }
}

if ($errorLines.Count -gt 0) {
    Write-Host "`nFound webhook activity:" -ForegroundColor Green
    $errorLines | ForEach-Object { Write-Host $_ -ForegroundColor Cyan }
}
else {
    Write-Host "`nNo webhook activity found in recent logs" -ForegroundColor Yellow
}

Write-Host "`n`nSearching for specific error patterns..." -ForegroundColor Yellow
$errors = $logs | Select-String -Pattern "TypeError|ReferenceError|Error:|at " | Select-Object -Last 20

if ($errors) {
    Write-Host "`nErrors found:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host $_ -ForegroundColor Red }
}
else {
    Write-Host "No obvious TypeScript/JavaScript errors found" -ForegroundColor Green
}

Write-Host ""

