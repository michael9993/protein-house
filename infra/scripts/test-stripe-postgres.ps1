# Test script to verify Stripe app PostgreSQL integration
# This script verifies database connectivity, schema, and basic operations

param(
    [switch]$Verbose = $false
)

Write-Host "🧪 Testing Stripe App PostgreSQL Integration..." -ForegroundColor Cyan
Write-Host ""

# 1. Check PostgreSQL container
Write-Host "1️⃣  Checking PostgreSQL container..." -ForegroundColor Yellow
$postgresStatus = docker compose -f docker-compose.dev.yml ps postgres --format "{{.Status}}"
if ($postgresStatus -match "Up") {
    Write-Host "   ✅ PostgreSQL container is running" -ForegroundColor Green
}
else {
    Write-Host "   ❌ PostgreSQL container is not running" -ForegroundColor Red
    exit 1
}

# 2. Check Stripe app container
Write-Host "2️⃣  Checking Stripe app container..." -ForegroundColor Yellow
$stripeStatus = docker compose -f docker-compose.dev.yml ps saleor-stripe-app-dev --format "{{.Status}}"
if ($stripeStatus -match "Up") {
    Write-Host "   ✅ Stripe app container is running" -ForegroundColor Green
}
else {
    Write-Host "   ❌ Stripe app container is not running" -ForegroundColor Red
    Write-Host "   Start it with: docker compose -f docker-compose.dev.yml up -d saleor-stripe-app" -ForegroundColor Yellow
    exit 1
}

# 3. Verify database exists
Write-Host "3️⃣  Verifying stripe_app database..." -ForegroundColor Yellow
$dbCheck = docker compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -lqt 2>&1 | Select-String "stripe_app"
if ($dbCheck) {
    Write-Host "   ✅ stripe_app database exists" -ForegroundColor Green
}
else {
    Write-Host "   ❌ stripe_app database not found" -ForegroundColor Red
    exit 1
}

# 4. Check tables exist
Write-Host "4️⃣  Verifying database tables..." -ForegroundColor Yellow
$tables = docker compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -d stripe_app -c "\dt" 2>&1

$expectedTables = @("stripe_configs", "channel_config_mappings", "recorded_transactions")
$allTablesExist = $true

foreach ($table in $expectedTables) {
    if ($tables -match $table) {
        Write-Host "   ✅ Table '$table' exists" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Table '$table' not found" -ForegroundColor Red
        $allTablesExist = $false
    }
}

if (-not $allTablesExist) {
    Write-Host "   Run: .\scripts\setup-stripe-postgres.ps1" -ForegroundColor Yellow
    exit 1
}

# 5. Test database connection from Stripe app
Write-Host "5️⃣  Testing database connection from Stripe app..." -ForegroundColor Yellow
$connectionTest = docker compose -f docker-compose.dev.yml exec saleor-stripe-app-dev sh -c "cd /app/apps/stripe && node -e \"
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL || 'postgres://saleor:saleor@postgres:5432/stripe_app');
sql\`SELECT 1 as test\`.then((result) = > {
        console.log('✅ Connection successful:', result[0]);
        sql.end();
        process.exit(0);
    }).catch((err) = > {
        console.error('❌ Connection failed:', err.message);
        sql.end();
        process.exit(1);
    });
\"" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Database connection successful" -ForegroundColor Green
}
else {
    Write-Host "   ❌ Database connection failed" -ForegroundColor Red
    Write-Host "   Error: $connectionTest" -ForegroundColor Red
    exit 1
}

# 6. Check environment variables
Write-Host "6️⃣  Verifying environment variables..." -ForegroundColor Yellow
$envCheck = docker compose -f docker-compose.dev.yml exec saleor-stripe-app-dev sh -c "env | grep -E 'STORAGE_BACKEND|DATABASE_URL'" 2>&1

if ($envCheck -match "STORAGE_BACKEND=postgres") {
    Write-Host "   ✅ STORAGE_BACKEND=postgres" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  STORAGE_BACKEND not set to postgres" -ForegroundColor Yellow
}

if ($envCheck -match "DATABASE_URL") {
    Write-Host "   ✅ DATABASE_URL is set" -ForegroundColor Green
    if ($Verbose) {
        $dbUrl = ($envCheck | Select-String "DATABASE_URL").ToString()
        Write-Host "      $dbUrl" -ForegroundColor Gray
    }
}
else {
    Write-Host "   ❌ DATABASE_URL not set" -ForegroundColor Red
    exit 1
}

# 7. Check Stripe app logs for PostgreSQL initialization
Write-Host "7️⃣  Checking Stripe app logs for PostgreSQL..." -ForegroundColor Yellow
$logs = docker compose -f docker-compose.dev.yml logs saleor-stripe-app-dev --tail 50 2>&1 | Select-String -Pattern "PostgreSQL|Postgres|DATABASE" -CaseSensitive:$false

if ($logs) {
    Write-Host "   ✅ Found PostgreSQL-related logs" -ForegroundColor Green
    if ($Verbose) {
        $logs | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    }
}
else {
    Write-Host "   ⚠️  No PostgreSQL logs found (app may not have initialized yet)" -ForegroundColor Yellow
}

# 8. Test table query
Write-Host "8️⃣  Testing database queries..." -ForegroundColor Yellow
$queryTest = docker compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -d stripe_app -c "SELECT COUNT(*) as config_count FROM stripe_configs;" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Query successful" -ForegroundColor Green
    if ($Verbose) {
        Write-Host "      $queryTest" -ForegroundColor Gray
    }
}
else {
    Write-Host "   ❌ Query failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ All tests passed! PostgreSQL integration is working correctly." -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Configure Stripe via Dashboard: http://localhost:9000" -ForegroundColor White
Write-Host "   2. Test payment flow in Storefront: http://localhost:3000" -ForegroundColor White
Write-Host "   3. Verify data is stored in PostgreSQL:" -ForegroundColor White
Write-Host "      docker compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -d stripe_app -c 'SELECT * FROM stripe_configs;'" -ForegroundColor Gray
Write-Host ""
