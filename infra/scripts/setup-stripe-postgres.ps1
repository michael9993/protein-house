# Setup PostgreSQL database and schema for Stripe app
# This script runs the database migrations inside the Stripe app container

param(
    [switch]$SkipSchema = $false
)

Write-Host "🔧 Setting up PostgreSQL for Stripe app..." -ForegroundColor Cyan

# Check if Stripe app container is running
$stripeContainer = docker ps --filter "name=saleor-stripe-app" --format "{{.Names}}" | Select-String "saleor-stripe-app"
if (-not $stripeContainer) {
    Write-Host "❌ Stripe app container is not running. Start it first:" -ForegroundColor Red
    Write-Host "   docker compose -f docker-compose.dev.yml up -d saleor-stripe-app" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Stripe app container is running" -ForegroundColor Green

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxRetries = 30
$retryCount = 0

do {
    $result = docker compose -f docker-compose.dev.yml exec -T postgres pg_isready -U saleor 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
        break
    }
    $retryCount++
    if ($retryCount -ge $maxRetries) {
        Write-Host "❌ PostgreSQL failed to start after $maxRetries attempts" -ForegroundColor Red
        exit 1
    }
    Write-Host "   PostgreSQL is not ready yet, waiting... ($retryCount/$maxRetries)" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
} while ($retryCount -lt $maxRetries)

# Ensure stripe_app database exists (init script should create it, but verify)
Write-Host "🔍 Verifying stripe_app database exists..." -ForegroundColor Yellow
$dbExists = docker compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -lqt | Select-String "stripe_app"
if (-not $dbExists) {
    Write-Host "📦 Creating stripe_app database..." -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -d saleor -c "CREATE DATABASE stripe_app;" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database created" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Database might already exist (this is OK)" -ForegroundColor Yellow
    }
}
else {
    Write-Host "✅ Database already exists" -ForegroundColor Green
}

if (-not $SkipSchema) {
    # Run schema migration inside Stripe app container
    Write-Host "📋 Running database schema migration..." -ForegroundColor Yellow
    docker compose -f docker-compose.dev.yml exec saleor-stripe-app sh -c "cd /app/apps/stripe && pnpm setup-postgres" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database schema created successfully" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to create database schema" -ForegroundColor Red
        Write-Host "   You can run the migration manually:" -ForegroundColor Yellow
        Write-Host "   docker compose -f docker-compose.dev.yml exec saleor-stripe-app sh -c 'cd /app/apps/stripe && pnpm setup-postgres'" -ForegroundColor Yellow
        exit 1
    }
}
else {
    Write-Host "⏭️  Skipping schema creation (use -SkipSchema to skip)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Stripe app PostgreSQL setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "The Stripe app is now configured to use PostgreSQL." -ForegroundColor Cyan
Write-Host "Database: stripe_app" -ForegroundColor Cyan
Write-Host "Connection: postgres://saleor:saleor@postgres:5432/stripe_app" -ForegroundColor Cyan
Write-Host ""
