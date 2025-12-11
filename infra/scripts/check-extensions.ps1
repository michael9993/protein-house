# Diagnostic script to check installed Saleor extensions/apps
# This helps verify if Stripe app is properly installed and active

param(
    [string]$ApiUrl = "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/",
    [string]$Token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IlFWbGN5N1ZiVDFfcXN4S3lRZUJwelUtMU01WDVoaTBHWkRHamNVN2ZRZ0UiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NjUxNjAyMzMsIm93bmVyIjoic2FsZW9yIiwiaXNzIjoiaHR0cHM6Ly9yZWZ1Z2Vlcy1mbGVlY2UtcGV0ZXJzb24taW5jdXJyZWQudHJ5Y2xvdWRmbGFyZS5jb20vZ3JhcGhxbC8iLCJleHAiOjE3NjUxNjA1MzMsInRva2VuIjoiR3dmc1Nid2xMSDdjIiwiZW1haWwiOiJtaWNoYWVsemFoZXIxOTkzQGdtYWlsLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJ1c2VyX2lkIjoiVlhObGNqb3giLCJpc19zdGFmZiI6dHJ1ZX0.A_1nyoUSiUEBxbt1gXrfeHz8UiXK9NZ6QtxiA6of75yfuaJkGK4KLBVORvnqH5FomM_lsWIg5vMZA9oqtsmqKsaHv3qH76km8msrwt2nfYFPgcTYT0TvG98mvT3HN31zimQOwxI4S2wbchw94cX2Vb8gOObSlJaw-Mmc50vw8ADNGTMaVh8IF6sMojei2is2_Yc9KlZlOVxZUo-fLVyxYNa3XmeYGNHbL9BxFZ-WS2r_UF9zHlDcAPXsWN_PRMaCzC91hVlhl_fK3Wg2WItruHPg6yr1jHN8UVPs9ADSz4hJvWk6s9DWQf2or28MBM_p8xVpIpmumZia4iVcvT7lbg")

$ErrorActionPreference = "Stop"

Write-Host "`n=== Saleor Extensions/Apps Diagnostic ===" -ForegroundColor Cyan
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

# GraphQL query to check installed apps
$query = @"
query {
  apps(first: 100) {
    edges {
      node {
        id
        name
        isActive
        type
        permissions {
          code
          name
        }
        webhooks {
          id
          name
          isActive
          asyncEvents {
            eventType
          }
          syncEvents {
            eventType
          }
        }
      }
    }
  }
}
"@

Write-Host "`n2. Querying installed apps/extensions..." -ForegroundColor Yellow
Write-Host "   API: $ApiUrl" -ForegroundColor Gray

try {
    $headers = @{
        "Content-Type" = "application/json"
    }

    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    $body = @{
        query = $query
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -ContentType "application/json" -Body $body -Headers $headers

    if ($response.errors) {
        Write-Host "   ⚠ GraphQL errors (might need authentication):" -ForegroundColor Yellow
        foreach ($error in $response.errors) {
            Write-Host "     - $($error.message)" -ForegroundColor Yellow
        }
        Write-Host "`n   Trying without authentication (public query)..." -ForegroundColor Gray
        
        # Try a simpler query that doesn't require auth
        $simpleQuery = @"
query {
  shop {
    availablePaymentGateways {
      id
      name
    }
  }
}
"@
        $simpleBody = @{
            query = $simpleQuery
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -ContentType "application/json" -Body $simpleBody
    }

    $apps = $response.data.apps.edges

    if ($apps -and $apps.Count -gt 0) {
        Write-Host "`n   Found $($apps.Count) installed app(s):" -ForegroundColor Cyan
        
        foreach ($edge in $apps) {
            $app = $edge.node
            $status = if ($app.isActive) { "✓ Active" } else { "✗ Inactive" }
            $statusColor = if ($app.isActive) { "Green" } else { "Red" }
            
            Write-Host "`n   App: $($app.name)" -ForegroundColor White
            Write-Host "     ID: $($app.id)" -ForegroundColor Gray
            Write-Host "     Status: $status" -ForegroundColor $statusColor
            Write-Host "     Type: $($app.type)" -ForegroundColor Gray
            
            if ($app.permissions -and $app.permissions.Count -gt 0) {
                $permissions = $app.permissions | ForEach-Object { $_.code } | Sort-Object
                Write-Host "     Permissions: $($permissions -join ', ')" -ForegroundColor Gray
                
                $hasHandlePayments = $permissions -contains "HANDLE_PAYMENTS"
                if ($hasHandlePayments) {
                    Write-Host "     ✓ Has HANDLE_PAYMENTS permission" -ForegroundColor Green
                }
                else {
                    Write-Host "     ✗ Missing HANDLE_PAYMENTS permission" -ForegroundColor Red
                }
            }
            
            if ($app.webhooks -and $app.webhooks.Count -gt 0) {
                Write-Host "     Webhooks: $($app.webhooks.Count)" -ForegroundColor Gray
                $activeWebhooks = ($app.webhooks | Where-Object { $_.isActive }).Count
                Write-Host "       Active: $activeWebhooks" -ForegroundColor Gray
            }
        }

        # Check specifically for Stripe app
        $stripeApp = $apps | Where-Object { 
            $_.node.name -like "*Stripe*" -or 
            $_.node.id -like "*stripe*" -or
            $_.node.id -eq "saleor.app.payment.stripe"
        }
        
        if ($stripeApp) {
            $app = $stripeApp[0].node
            Write-Host "`n   ✓ Stripe app found!" -ForegroundColor Green
            Write-Host "     Name: $($app.name)" -ForegroundColor Gray
            Write-Host "     ID: $($app.id)" -ForegroundColor Gray
            Write-Host "     Active: $($app.isActive)" -ForegroundColor $(if ($app.isActive) { "Green" } else { "Red" })
            
            if (-not $app.isActive) {
                Write-Host "`n   ⚠ Stripe app is INACTIVE!" -ForegroundColor Red
                Write-Host "     You need to activate it in Dashboard:" -ForegroundColor Yellow
                Write-Host "     Dashboard → Extensions → Installed → Stripe → Activate" -ForegroundColor White
            }
        }
        else {
            Write-Host "`n   ✗ Stripe app NOT found in installed apps" -ForegroundColor Red
            Write-Host "`n   Possible causes:" -ForegroundColor Yellow
            Write-Host "   1. Stripe app not installed" -ForegroundColor White
            Write-Host "   2. App ID doesn't match expected pattern" -ForegroundColor White
            Write-Host "   3. Query requires authentication (try with -Token parameter)" -ForegroundColor White
        }
    }
    else {
        Write-Host "   ⚠ No apps found or query requires authentication" -ForegroundColor Yellow
        Write-Host "`n   Try with authentication token:" -ForegroundColor Cyan
        Write-Host "     .\check-extensions.ps1 -Token 'your-jwt-token'" -ForegroundColor White
        Write-Host "`n   Or check manually in Dashboard:" -ForegroundColor Cyan
        Write-Host "     Dashboard → Extensions → Installed" -ForegroundColor White
    }

}
catch {
    Write-Host "   ✗ Error querying apps: $_" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    Write-Host "`n   Note: This query might require authentication." -ForegroundColor Yellow
    Write-Host "   Try accessing Dashboard → Extensions → Installed manually" -ForegroundColor White
}

Write-Host "`n3. Alternative: Check via Dashboard" -ForegroundColor Yellow
Write-Host "   - Go to Dashboard → Extensions → Installed" -ForegroundColor White
Write-Host "   - Look for 'Stripe' app" -ForegroundColor White
Write-Host "   - Verify it shows as 'Active' or 'Connected'" -ForegroundColor White
Write-Host "   - Click on it to see details" -ForegroundColor White
Write-Host ""
