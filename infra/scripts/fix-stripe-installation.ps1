# PowerShell script to fix Stripe app installation issues
# This restarts the Stripe app with correct environment variables

Write-Host "Fixing Stripe app installation..." -ForegroundColor Green
Write-Host ""

# Check if docker-compose is available
$dockerCompose = Get-Command docker-compose -ErrorAction SilentlyContinue
if (-not $dockerCompose) {
    $dockerCompose = Get-Command docker -ErrorAction SilentlyContinue
    if ($dockerCompose) {
        $dockerComposeCmd = "docker compose"
    }
    else {
        Write-Host "Docker not found. Please install Docker Desktop." -ForegroundColor Red
        exit 1
    }
}
else {
    $dockerComposeCmd = "docker-compose"
}

$composeFile = "docker-compose.dev.yml"
$serviceName = "saleor-stripe-app"

Write-Host "1. Stopping Stripe app..." -ForegroundColor Cyan
& $dockerComposeCmd -f $composeFile stop $serviceName

Write-Host "2. Removing Stripe app container..." -ForegroundColor Cyan
& $dockerComposeCmd -f $composeFile rm -f $serviceName

Write-Host "3. Starting Stripe app with updated configuration..." -ForegroundColor Cyan
& $dockerComposeCmd -f $composeFile up -d $serviceName

Write-Host "4. Waiting for app to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "5. Checking app status..." -ForegroundColor Cyan
& $dockerComposeCmd -f $composeFile ps $serviceName

Write-Host ""
Write-Host "6. Checking app logs (last 20 lines)..." -ForegroundColor Cyan
& $dockerComposeCmd -f $composeFile logs --tail=20 $serviceName

Write-Host ""
Write-Host "7. Testing manifest endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/manifest" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Manifest endpoint is accessible" -ForegroundColor Green
    Write-Host "  Response status: $($response.StatusCode)" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Manifest endpoint not accessible yet" -ForegroundColor Yellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "  Wait a few seconds and try: curl http://localhost:3002/api/manifest" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "8. Testing Saleor API connectivity from app container..." -ForegroundColor Cyan
$testResult = & $dockerComposeCmd -f $composeFile exec -T $serviceName wget -q -O- http://saleor-api:8000/graphql/ 2>&1
if ($LASTEXITCODE -eq 0 -or $testResult -match "graphql" -or $testResult -match "200") {
    Write-Host "✓ App can reach Saleor API" -ForegroundColor Green
}
else {
    Write-Host "✗ App cannot reach Saleor API" -ForegroundColor Red
    Write-Host "  Check that saleor-api service is running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Verify app is running: docker compose -f $composeFile ps $serviceName" -ForegroundColor White
Write-Host "2. Check logs: docker compose -f $composeFile logs -f $serviceName" -ForegroundColor White
Write-Host "3. Install via Dashboard:" -ForegroundColor White
Write-Host "   - Go to: http://localhost:9000" -ForegroundColor White
Write-Host "   - Navigate to: Extensions → Add Extension" -ForegroundColor White
Write-Host "   - Enter manifest URL: http://localhost:3002/api/manifest" -ForegroundColor White
Write-Host "4. Or create app manually and set STRIPE_APP_TOKEN" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
