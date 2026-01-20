# PowerShell script to fix PostgreSQL connection pool exhaustion
# This recreates the postgres container with increased max_connections

Write-Host "🔧 Fixing PostgreSQL connection pool configuration..." -ForegroundColor Cyan
Write-Host ""

# Stop and remove the postgres container
Write-Host "📦 Stopping and removing existing postgres container..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml stop postgres
docker-compose -f docker-compose.dev.yml rm -f postgres

# Recreate the postgres container with new settings
Write-Host "🔄 Recreating postgres container with max_connections=200..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up -d postgres

# Wait for postgres to be healthy
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$timeout = 60
$counter = 0
$ready = $false

while (-not $ready -and $counter -lt $timeout) {
    Start-Sleep -Seconds 1
    $counter++
    try {
        $result = docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U saleor 2>&1
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
        }
    } catch {
        # Continue waiting
    }
}

if (-not $ready) {
    Write-Host "❌ Timeout waiting for PostgreSQL to be ready" -ForegroundColor Red
    exit 1
}

Write-Host "✅ PostgreSQL is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Verifying max_connections setting..." -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -d saleor -c "SHOW max_connections;"

Write-Host ""
Write-Host "✅ Done! PostgreSQL now supports up to 200 connections." -ForegroundColor Green
Write-Host "💡 Make sure DB_CONN_MAX_AGE=60 is set in your infra/.env file for connection pooling." -ForegroundColor Yellow
