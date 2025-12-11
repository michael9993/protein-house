# Script to migrate Stripe app configs from file to PostgreSQL
# This reads configs from .saleor-app-config.json and migrates them to PostgreSQL

Write-Host "🔄 Migrating Stripe App Configs to PostgreSQL..." -ForegroundColor Cyan
Write-Host ""

# Check if postgres container is running
$postgresStatus = docker ps --filter "name=saleor-postgres-dev" --format "{{.Status}}"
if (-not ($postgresStatus -match "Up")) {
    Write-Host "❌ PostgreSQL container is not running" -ForegroundColor Red
    Write-Host "   Start it with: docker compose -f docker-compose.dev.yml up -d postgres" -ForegroundColor Yellow
    exit 1
}

# Check if Stripe app container is running
$stripeAppStatus = docker ps --filter "name=saleor-stripe-app-dev" --format "{{.Status}}"
if (-not ($stripeAppStatus -match "Up")) {
    Write-Host "❌ Stripe app container is not running" -ForegroundColor Red
    Write-Host "   Start it with: docker compose -f docker-compose.dev.yml up -d saleor-stripe-app" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Containers are running" -ForegroundColor Green
Write-Host ""

# Check if config file exists
$configFile = ".saleor-app-config.json"
if (-not (Test-Path $configFile)) {
    Write-Host "ℹ️  No config file found at $configFile" -ForegroundColor Yellow
    Write-Host "   Nothing to migrate. Configs will be saved to PostgreSQL when created." -ForegroundColor Gray
    exit 0
}

Write-Host "📋 Found config file: $configFile" -ForegroundColor Cyan
Write-Host ""

# Run migration inside the Stripe app container
Write-Host "🔄 Running migration script..." -ForegroundColor Yellow
$migrationResult = docker compose -f docker-compose.dev.yml exec saleor-stripe-app-dev sh -c "cd /app/apps/stripe && pnpm tsx scripts/migrate-to-postgres.ts" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Verify configs in PostgreSQL:" -ForegroundColor White
    Write-Host "      docker exec saleor-postgres-dev psql -U saleor -d stripe_app -c 'SELECT config_id, config_name FROM stripe_configs;'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. The app will now use PostgreSQL for configs (STORAGE_BACKEND=postgres)" -ForegroundColor White
    Write-Host "   3. You can keep the .saleor-app-config.json file as backup" -ForegroundColor White
    Write-Host ""
}
else {
    Write-Host "❌ Migration failed" -ForegroundColor Red
    Write-Host "   Error output:" -ForegroundColor Yellow
    Write-Host $migrationResult -ForegroundColor Red
    exit 1
}
