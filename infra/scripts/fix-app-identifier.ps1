param(
    [string]$AuthToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUyNDUyOTgsIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUyNDU1OTgsInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.tyi_QaiVRqUeWavb-UInSdBx57lJEmwG7iZ9wWovLu9YuGc71YNJERI9DRNo_HC0itz441k-8dKOGvFhZcEnsPnrhIaNMLBoscZYt6oP18wE7J0y27D7GPHiMVwtpD6Cj_RF80JtYpmm6VftGY-XN_bs68fIzBxbqAitCZkfhEGOR_uRYEKiJZ-KhYpEseDUnPsklw8Qe7GaNH-G_LS5zVDCz5eaCX18gr0_FGt_q5lS3urXg1qrJhx3xYTY9RGa1RU8ubVZmSWmmFQfr-Dpo7xwkWPhQhpFtB3w-RkNnigbjQ_0pR-5M7w4RMnPDCgbzOcvkQw9q7edvugGXt1_hg",
    [string]$AppId = ""
)

Write-Host "`n=== Fix Stripe App Identifier ===`n" -ForegroundColor Cyan

Write-Host "This script will update the Stripe app identifier to 'stripe'." -ForegroundColor Yellow
Write-Host "This is required for payment processing to work correctly." -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $AuthToken"
}

try {
    # First, find the Stripe app
    if (-not $AppId) {
        Write-Host "Finding Stripe app..." -ForegroundColor Yellow
        $findQuery = @"
{
    "query": "query { apps(first: 20, filter: { search: \"stripe\" }) { edges { node { id name identifier isActive } } } }"
}
"@
        
        $findResponse = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $findQuery -ContentType "application/json" -Headers $headers -TimeoutSec 15 -ErrorAction Stop
        
        if ($findResponse.errors) {
            Write-Host "✗ GraphQL errors:" -ForegroundColor Red
            $findResponse.errors | ForEach-Object { Write-Host "  $($_.message)" -ForegroundColor Red }
            exit
        }
        
        $stripeApp = $null
        foreach ($edge in $findResponse.data.apps.edges) {
            if ($edge.node.name -like "*Stripe*") {
                $stripeApp = $edge.node
                break
            }
        }
        
        if (-not $stripeApp) {
            Write-Host "✗ Stripe app not found!" -ForegroundColor Red
            exit
        }
        
        $AppId = $stripeApp.id
        Write-Host "✓ Found Stripe app: $($stripeApp.name) (ID: $AppId)" -ForegroundColor Green
    }
    
    # Check current identifier
    Write-Host "Checking current app identifier..." -ForegroundColor Yellow
    $checkQuery = @"
{
    "query": "query { app(id: \"$AppId\") { id name identifier isActive } }"
}
"@
    
    $checkResponse = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $checkQuery -ContentType "application/json" -Headers $headers -TimeoutSec 15 -ErrorAction Stop
    
    if ($checkResponse.errors) {
        Write-Host "✗ GraphQL errors:" -ForegroundColor Red
        $checkResponse.errors | ForEach-Object { Write-Host "  $($_.message)" -ForegroundColor Red }
        exit
    }
    
    $app = $checkResponse.data.app
    
    if (-not $app) {
        Write-Host "✗ App not found!" -ForegroundColor Red
        exit
    }
    
    Write-Host "Current identifier: '$($app.identifier)'" -ForegroundColor Cyan
    Write-Host ""
    
    if ($app.identifier -eq "stripe") {
        Write-Host "✅ App identifier is already set to 'stripe'!" -ForegroundColor Green
        Write-Host "No changes needed." -ForegroundColor Gray
        exit
    }
    
    Write-Host "Updating app identifier to 'stripe'..." -ForegroundColor Yellow
    
    $updateMutation = @"
{
    "query": "mutation { appUpdate(id: \"$AppId\", input: { identifier: \"stripe\" }) { app { id name identifier } errors { message field } } }"
}
"@
    
    $updateResponse = Invoke-RestMethod -Uri "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/" -Method POST -Body $updateMutation -ContentType "application/json" -Headers $headers -TimeoutSec 15 -ErrorAction Stop
    
    if ($updateResponse.errors) {
        Write-Host "✗ GraphQL errors:" -ForegroundColor Red
        $updateResponse.errors | ForEach-Object { Write-Host "  $($_.message)" -ForegroundColor Red }
        exit
    }
    
    $result = $updateResponse.data.appUpdate
    
    if ($result.errors) {
        Write-Host "✗ Update errors:" -ForegroundColor Red
        $result.errors | ForEach-Object { Write-Host "  $($_.message)" -ForegroundColor Red
            if ($_.field) {
                Write-Host "    Field: $($_.field)" -ForegroundColor Gray
            }
        }
        exit
    }
    
    if ($result.app) {
        Write-Host "✅ App identifier updated successfully!" -ForegroundColor Green
        Write-Host "   New identifier: '$($result.app.identifier)'" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "The app should now work correctly for payment processing." -ForegroundColor Green
    }
}
catch {
    Write-Host "✗ Operation failed: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Response: $($_.Exception.Response)" -ForegroundColor Gray
    }
}

Write-Host ""
