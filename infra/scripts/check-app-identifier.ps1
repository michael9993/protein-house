param(
    [string]$AuthToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUyNDQxMzgsIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUyNDQ0MzgsInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.XhAx4qSFE52YY2e7tqXwOKxhW7auvXUoC8ts5euu7H8ikCEV6owgZSTL1UMwk_IKurgRco3E5X-22geHSSSP05yYOEcVYA_2OR9QTcM4KJLozIX4j3xbDGxHyBLqDaGSFTBTkHzAusY-XXfL5RE46bp7cOtdXJOxIFh-yxTUALRUvIoE08HB3nqEUcL1BrmjjMkduqSDoPdtoUIOI8XT3Z4ZsVKTQ435xobbtvNxgZmk5OGRw2CyTnhyj_H8B4swqwre83BXI1MXRtj4jdWlJkYPnmrosjTz9H6TN0NV2zvXvZHg2N25GvI3sozanQzu3r5JQkmcN8iZtpnCm9RSKA"
)

Write-Host "`n=== Check Stripe App Identifier ===`n" -ForegroundColor Cyan

Write-Host "Checking Stripe app details to verify identifier..." -ForegroundColor Yellow
Write-Host ""

$query = @"
{
    "query": "query { app(id: \"QXBwOjE=\") { id name identifier isActive removedAt } }"
}
"@

$headers = @{
    "Content-Type" = "application/json"
}

if ($AuthToken) {
    $headers["Authorization"] = "Bearer $AuthToken"
}

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $query -ContentType "application/json" -Headers $headers -TimeoutSec 15 -ErrorAction Stop
    
    if ($response.errors) {
        Write-Host "✗ GraphQL errors:" -ForegroundColor Red
        $response.errors | ForEach-Object { Write-Host "  $($_.message)" -ForegroundColor Red }
        exit
    }
    
    $app = $response.data.app
    
    if ($app) {
        Write-Host "✅ Stripe App Details:" -ForegroundColor Green
        Write-Host "   ID: $($app.id)" -ForegroundColor Cyan
        Write-Host "   Name: $($app.name)" -ForegroundColor Cyan
        Write-Host "   Identifier: $($app.identifier)" -ForegroundColor Cyan
        Write-Host "   Active: $($app.isActive)" -ForegroundColor Cyan
        Write-Host "   Removed: $($app.removedAt)" -ForegroundColor Cyan
        Write-Host ""
        
        if (-not $app.identifier) {
            Write-Host "⚠ WARNING: App identifier is NULL or empty!" -ForegroundColor Red
            Write-Host "   This will cause 'App with provided identifier not found' errors." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "   The app identifier should be set to 'stripe'." -ForegroundColor Yellow
        }
        elseif ($app.identifier -ne "stripe") {
            Write-Host "⚠ WARNING: App identifier is '$($app.identifier)', expected 'stripe'!" -ForegroundColor Yellow
            Write-Host "   This might cause issues with payment processing." -ForegroundColor Yellow
        }
        else {
            Write-Host "✅ App identifier is correct: 'stripe'" -ForegroundColor Green
        }
        
        if (-not $app.isActive) {
            Write-Host "⚠ WARNING: App is NOT active!" -ForegroundColor Red
        }
        
        if ($app.removedAt) {
            Write-Host "⚠ WARNING: App has been removed!" -ForegroundColor Red
        }
    }
    else {
        Write-Host "✗ App not found!" -ForegroundColor Red
    }
}
catch {
    Write-Host "✗ Query failed: $_" -ForegroundColor Red
}

Write-Host ""
