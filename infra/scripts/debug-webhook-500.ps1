Write-Host "`n=== Debugging Webhook 500 Error ===`n" -ForegroundColor Cyan

Write-Host "Getting last 100 lines of Stripe app logs..." -ForegroundColor Yellow
$logs = docker logs saleor-stripe-app-dev --tail 100 2>&1

Write-Host "`nLooking for the most recent error details..." -ForegroundColor Yellow

# Find the most recent PAYMENT_LIST_GATEWAYS error with full context
$errorContext = @()
$inError = $false
$linesCaptured = 0

for ($i = $logs.Count - 1; $i -ge 0; $i--) {
    $line = $logs[$i]
    
    if ($line -like "*PAYMENT_LIST_GATEWAYS*" -and $line -like "*Unhandled error*") {
        $inError = $true
        $errorContext = @()
        $linesCaptured = 0
    }
    
    if ($inError) {
        $errorContext = @($line) + $errorContext
        $linesCaptured++
        
        # Capture 30 lines after the error
        if ($linesCaptured -gt 30) {
            break
        }
    }
}

if ($errorContext.Count -gt 0) {
    Write-Host "`nMost recent error context:" -ForegroundColor Red
    $errorContext | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
}
else {
    Write-Host "No error context found" -ForegroundColor Yellow
}

Write-Host "`n`nSearching for stack traces or detailed errors..." -ForegroundColor Yellow
$detailedErrors = $logs | Select-String -Pattern "at |Error:|TypeError|ReferenceError|Cannot read|undefined" | Select-Object -Last 10

if ($detailedErrors) {
    Write-Host "Found detailed errors:" -ForegroundColor Red
    $detailedErrors | ForEach-Object { Write-Host $_ -ForegroundColor Red }
}

Write-Host "`n`nChecking for successful calls..." -ForegroundColor Yellow
$successful = $logs | Select-String -Pattern "PAYMENT_LIST_GATEWAYS.*Successfully processed|gatewaysCount.*1" | Select-Object -Last 3

if ($successful) {
    Write-Host "Found successful calls:" -ForegroundColor Green
    $successful | ForEach-Object { Write-Host $_ -ForegroundColor Green }
}
else {
    Write-Host "No successful calls found in recent logs" -ForegroundColor Red
}

Write-Host ""

