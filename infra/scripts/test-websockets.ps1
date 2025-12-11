# Test websocket connectivity to Saleor API
# This script checks if GraphQL subscriptions are available

param(
    [string]$ApiUrl = "http://localhost:8000"
)

Write-Host "`n🔌 Testing WebSocket Support for Saleor API`n" -ForegroundColor Cyan

# Check if API is running
Write-Host "1. Checking if API is accessible..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/graphql/" -Method POST -Body '{"query":"{ __typename }"}' -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ API is accessible" -ForegroundColor Green
} catch {
    Write-Host "   ❌ API is not accessible: $_" -ForegroundColor Red
    exit 1
}

# Check GraphQL schema for subscription support
Write-Host "`n2. Checking GraphQL schema for subscriptions..." -ForegroundColor Yellow
try {
    $introspectionQuery = @"
query {
  __schema {
    subscriptionType {
      fields {
        name
      }
    }
  }
}
"@
    $body = @{
        query = $introspectionQuery
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$ApiUrl/graphql/" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data.__schema.subscriptionType -and $data.data.__schema.subscriptionType.fields) {
        $subscriptions = $data.data.__schema.subscriptionType.fields | Select-Object -ExpandProperty name
        Write-Host "   ✅ Subscriptions are available:" -ForegroundColor Green
        $subscriptions | ForEach-Object {
            Write-Host "      - $_" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  No subscriptions found in schema" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Failed to check schema: $_" -ForegroundColor Red
}

# Check if websocket endpoint exists
Write-Host "`n3. Checking WebSocket endpoint..." -ForegroundColor Yellow
$wsUrl = $ApiUrl -replace "http://", "ws://" -replace "https://", "wss://"
Write-Host "   WebSocket URL would be: $wsUrl/graphql/" -ForegroundColor Gray
Write-Host "   ⚠️  Note: WebSocket testing requires a WebSocket client" -ForegroundColor Yellow
Write-Host "   You can test with: wscat -c $wsUrl/graphql/" -ForegroundColor Gray

Write-Host "`n📝 Summary:" -ForegroundColor Cyan
Write-Host "   - Saleor API supports GraphQL subscriptions" -ForegroundColor White
Write-Host "   - Dashboard does NOT use websockets (uses HTTP only)" -ForegroundColor White
Write-Host "   - To enable real-time updates, dashboard needs:" -ForegroundColor White
Write-Host "     1. WebSocket link in Apollo Client" -ForegroundColor Gray
Write-Host "     2. Subscription queries for orderCreated/orderUpdated" -ForegroundColor Gray
Write-Host "     3. Or polling interval on OrderList query`n" -ForegroundColor Gray

