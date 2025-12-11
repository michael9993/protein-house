# Fix Stripe app volume mount issue on Windows
# This script verifies and fixes the volume mount path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Stripe App Volume Mount" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$platformDir = Split-Path -Parent (Split-Path -Parent (Get-Location))
$appsDir = Join-Path $platformDir "apps"

Write-Host "Step 1: Verifying apps folder..." -ForegroundColor Yellow
if (-not (Test-Path $appsDir)) {
    Write-Host "  ✗ Apps folder not found at: $appsDir" -ForegroundColor Red
    Write-Host "  Cloning apps repository..." -ForegroundColor Yellow
    Set-Location $platformDir
    git clone https://github.com/saleor/apps.git
    if (-not (Test-Path $appsDir)) {
        Write-Host "  ✗ Failed to clone apps repository" -ForegroundColor Red
        exit 1
    }
}

if (Test-Path "$appsDir\package.json") {
    Write-Host "  ✓ Apps folder exists with package.json" -ForegroundColor Green
    $absPath = (Resolve-Path $appsDir).Path
    Write-Host "  Absolute path: $absPath" -ForegroundColor Gray
}
else {
    Write-Host "  ✗ package.json not found in apps folder" -ForegroundColor Red
    Write-Host "  Apps folder may be incomplete" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 2: Checking Docker Desktop file sharing..." -ForegroundColor Yellow
Write-Host "  Make sure 'C:\Users\micha' is shared in Docker Desktop" -ForegroundColor Gray
Write-Host "  Settings → Resources → File Sharing" -ForegroundColor Gray

Write-Host ""
Write-Host "Step 3: Updating docker-compose.dev.yml with correct path..." -ForegroundColor Yellow
$composeFile = Join-Path $platformDir "infra\docker-compose.dev.yml"
$absPathDocker = $absPath -replace '\\', '/'
Write-Host "  Docker path format: $absPathDocker" -ForegroundColor Gray

# Read the file
$content = Get-Content $composeFile -Raw

# Check current path
if ($content -match "- (.*?):/app") {
    $currentPath = $matches[1]
    Write-Host "  Current path in docker-compose: $currentPath" -ForegroundColor Gray
    
    if ($currentPath -ne $absPathDocker) {
        Write-Host "  Updating to: $absPathDocker" -ForegroundColor Yellow
        $content = $content -replace "- (.*?):/app", "- $absPathDocker:/app"
        Set-Content -Path $composeFile -Value $content -NoNewline
        Write-Host "  ✓ Updated docker-compose.dev.yml" -ForegroundColor Green
    }
    else {
        Write-Host "  ✓ Path is already correct" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Step 4: Stopping and removing container..." -ForegroundColor Yellow
Set-Location (Join-Path $platformDir "infra")
docker compose -f docker-compose.dev.yml stop saleor-stripe-app 2>&1 | Out-Null
docker compose -f docker-compose.dev.yml rm -f saleor-stripe-app 2>&1 | Out-Null
Write-Host "  ✓ Container removed" -ForegroundColor Green

Write-Host ""
Write-Host "Step 5: Recreating container..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml up -d saleor-stripe-app

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Container recreated" -ForegroundColor Green
}
else {
    Write-Host "  ✗ Failed to recreate container" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 6: Waiting 20 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

Write-Host ""
Write-Host "Step 7: Testing volume mount..." -ForegroundColor Cyan
$testResult = docker compose -f docker-compose.dev.yml exec -T saleor-stripe-app sh -c "test -f /app/package.json && echo 'SUCCESS' || echo 'FAILED'" 2>&1

if ($testResult -match "SUCCESS") {
    Write-Host "  ✓ Container can see package.json!" -ForegroundColor Green
}
else {
    Write-Host "  ✗ Container cannot see package.json" -ForegroundColor Red
    Write-Host "  Checking what container sees..." -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml exec saleor-stripe-app ls -la /app 2>&1 | Select-Object -First 10
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If the container still can't see package.json:" -ForegroundColor Yellow
Write-Host "1. Check Docker Desktop → Settings → Resources → File Sharing" -ForegroundColor White
Write-Host "2. Ensure 'C:\Users\micha' is in the shared folders list" -ForegroundColor White
Write-Host "3. Restart Docker Desktop if you added a new path" -ForegroundColor White
Write-Host "4. Try using the full absolute path in docker-compose.dev.yml" -ForegroundColor White
Write-Host ""
