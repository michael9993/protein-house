param(
    [string]$OrderId = "T3JkZXI6Y2JlOGRjZTctYjY2My00NGU0LWJmODctYjQwNzYzZTYwN2Qy",
    [string]$AuthToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUyNDQxMzgsIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUyNDQ0MzgsInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.XhAx4qSFE52YY2e7tqXwOKxhW7auvXUoC8ts5euu7H8ikCEV6owgZSTL1UMwk_IKurgRco3E5X-22geHSSSP05yYOEcVYA_2OR9QTcM4KJLozIX4j3xbDGxHyBLqDaGSFTBTkHzAusY-XXfL5RE46bp7cOtdXJOxIFh-yxTUALRUvIoE08HB3nqEUcL1BrmjjMkduqSDoPdtoUIOI8XT3Z4ZsVKTQ435xobbtvNxgZmk5OGRw2CyTnhyj_H8B4swqwre83BXI1MXRtj4jdWlJkYPnmrosjTz9H6TN0NV2zvXvZHg2N25GvI3sozanQzu3r5JQkmcN8iZtpnCm9RSKA"
)

Write-Host "`n=== Check Order Transaction Status ===`n" -ForegroundColor Cyan

$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $AuthToken"
}

$query = @"
{
    "query": "query { order(id: `"$OrderId`") { id number total { gross { amount currency } } paymentStatus transactions { id name type pspReference availableActions events { id type message createdAt } } } }"
}
"@

try {
    $response = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $query -ContentType "application/json" -Headers $headers -TimeoutSec 15 -ErrorAction Stop
    
    if ($response.errors) {
        Write-Host "✗ GraphQL errors:" -ForegroundColor Red
        $response.errors | ForEach-Object { Write-Host "  $($_.message)" -ForegroundColor Red }
        exit
    }
    
    $order = $response.data.order
    Write-Host "✅ Order #$($order.number)" -ForegroundColor Green
    Write-Host "   Payment Status: $($order.paymentStatus)" -ForegroundColor Cyan
    Write-Host "   Total: $($order.total.gross.amount) $($order.total.gross.currency)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($order.transactions -and $order.transactions.Count -gt 0) {
        Write-Host "Transactions:" -ForegroundColor Yellow
        foreach ($tx in $order.transactions) {
            Write-Host "  - Transaction: $($tx.name)" -ForegroundColor Cyan
            Write-Host "    Type: $($tx.type)" -ForegroundColor Gray
            Write-Host "    PSP Reference: $($tx.pspReference)" -ForegroundColor Gray
            Write-Host "    Available Actions: $($tx.availableActions -join ', ')" -ForegroundColor $(if ($tx.availableActions -contains 'CHARGE') { "Yellow" } else { "Green" })
            Write-Host ""
            
            if ($tx.events -and $tx.events.Count -gt 0) {
                Write-Host "    Events:" -ForegroundColor Gray
                foreach ($event in $tx.events) {
                    Write-Host "      - $($event.type): $($event.message) ($($event.createdAt))" -ForegroundColor Gray
                }
            }
        }
        
        # Check if payment needs capture
        $needsCapture = $order.transactions | Where-Object { 
            $_.availableActions -contains "CHARGE" -or 
            ($_.type -eq "AUTHORIZATION" -and $_.availableActions -contains "CHARGE")
        }
        
        if ($needsCapture) {
            Write-Host ""
            Write-Host "⚠️ Payment can be captured from dashboard" -ForegroundColor Yellow
            Write-Host "   The TRANSACTION_CHARGE_REQUESTED webhook needs to work for this." -ForegroundColor Yellow
        }
        else {
            Write-Host ""
            Write-Host "✅ Payment already captured/charged" -ForegroundColor Green
            Write-Host "   No capture action needed." -ForegroundColor Gray
        }
    }
    else {
        Write-Host "⚠️ No transactions found for this order" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "✗ Query failed: $_" -ForegroundColor Red
}

Write-Host ""
