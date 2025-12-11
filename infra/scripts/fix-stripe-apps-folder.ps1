# Fix Stripe app container - ensure apps folder is properly cloned
# This fixes the "No package.json found in /app" error

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Stripe App Apps Folder" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$platformDir = Split-Path -Parent (Split-Path -Parent (Get-Location))
$appsDir = Join-Path $platformDir "apps"

Write-Host "Step 1: Checking apps folder..." -ForegroundColor Yellow
if (Test-Path $appsDir) {
    Write-Host "  ✓ Apps folder exists at: $appsDir" -ForegroundColor Green
    
    # Check if it has package.json (properly cloned)
    if (Test-Path "$appsDir\package.json") {
        Write-Host "  ✓ package.json found - apps folder is properly cloned" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ package.json NOT found - folder may be empty or incomplete" -ForegroundColor Red
        Write-Host "  Removing incomplete folder..." -ForegroundColor Yellow
        Remove-Item -Path $appsDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Removed" -ForegroundColor Green
    }
}
else {
    Write-Host "  ✗ Apps folder does not exist" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 2: Cloning apps repository..." -ForegroundColor Yellow
if (-not (Test-Path $appsDir)) {
    Set-Location $platformDir
    Write-Host "  Cloning from https://github.com/saleor/apps.git..." -ForegroundColor Gray
    git clone https://github.com/saleor/apps.git 2>&1 | Out-Null
    
    if (Test-Path $appsDir) {
        Write-Host "  ✓ Apps repository cloned successfully" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ Failed to clone apps repository" -ForegroundColor Red
        Write-Host "  Please check your internet connection and try again" -ForegroundColor Yellow
        exit 1
    }
}
else {
    Write-Host "  ✓ Apps folder already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Verifying apps folder structure..." -ForegroundColor Yellow
if (Test-Path "$appsDir\package.json") {
    Write-Host "  ✓ Root package.json exists" -ForegroundColor Green
}
else {
    Write-Host "  ✗ Root package.json missing!" -ForegroundColor Red
    exit 1
}

if (Test-Path "$appsDir\apps\stripe") {
    Write-Host "  ✓ Stripe app folder exists" -ForegroundColor Green
}
else {
    Write-Host "  ✗ Stripe app folder missing!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Stopping and removing Stripe app container..." -ForegroundColor Yellow
Set-Location (Join-Path $platformDir "infra")
docker compose -f docker-compose.dev.yml stop saleor-stripe-app 2>&1 | Out-Null
docker compose -f docker-compose.dev.yml rm -f saleor-stripe-app 2>&1 | Out-Null
Write-Host "  ✓ Container removed" -ForegroundColor Green

Write-Host ""
Write-Host "Step 5: Recreating Stripe app container..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml up -d saleor-stripe-app

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Container recreated" -ForegroundColor Green
}
else {
    Write-Host "  ✗ Failed to recreate container" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 6: Waiting 30 seconds for container to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "Step 7: Checking container logs..." -ForegroundColor Cyan
$logs = docker compose -f docker-compose.dev.yml logs --tail=20 saleor-stripe-app 2>&1
if ($logs -match "package.json") {
    if ($logs -match "No package.json") {
        Write-Host "  ✗ Still seeing package.json error" -ForegroundColor Red
        Write-Host "  Check the volume mount path in docker-compose.dev.yml" -ForegroundColor Yellow
    }
    else {
        Write-Host "  ✓ No package.json errors in recent logs" -ForegroundColor Green
    }
}
else {
    Write-Host "  ⚠ Could not determine status from logs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Apps folder location: $appsDir" -ForegroundColor White
Write-Host ""
Write-Host "Check container status:" -ForegroundColor Yellow
Write-Host "  docker compose -f infra/docker-compose.dev.yml ps saleor-stripe-app" -ForegroundColor Gray
Write-Host ""
Write-Host "Check container logs:" -ForegroundColor Yellow
Write-Host "  docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app" -ForegroundColor Gray
Write-Host ""
