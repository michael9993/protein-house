# PowerShell script to run Saleor locally for development
# This connects to Docker PostgreSQL and Redis

Write-Host "🚀 Starting Saleor Local Development" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment is activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "⚠️  Activating virtual environment..." -ForegroundColor Yellow
    if (Test-Path "venv\Scripts\Activate.ps1") {
        .\venv\Scripts\Activate.ps1
    } else {
        Write-Host "❌ Virtual environment not found. Run: python -m venv venv" -ForegroundColor Red
        exit 1
    }
}

# Check if Docker services are running
Write-Host "🔍 Checking Docker services..." -ForegroundColor Cyan
$postgresRunning = docker ps --filter "name=saleor-postgres-dev" --format "{{.Names}}" | Select-String "saleor-postgres-dev"
$redisRunning = docker ps --filter "name=saleor-redis-dev" --format "{{.Names}}" | Select-String "saleor-redis-dev"

if (-not $postgresRunning) {
    Write-Host "❌ PostgreSQL container is not running!" -ForegroundColor Red
    Write-Host "   Start it with: docker compose -f ../infra/docker-compose.dev.yml up -d postgres" -ForegroundColor Yellow
    exit 1
}

if (-not $redisRunning) {
    Write-Host "❌ Redis container is not running!" -ForegroundColor Red
    Write-Host "   Start it with: docker compose -f ../infra/docker-compose.dev.yml up -d redis" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker services are running" -ForegroundColor Green
Write-Host ""

# Load environment variables
if (Test-Path ".env.local") {
    Write-Host "📝 Loading .env.local..." -ForegroundColor Cyan
    Get-Content .env.local | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "⚠️  .env.local not found. Using defaults." -ForegroundColor Yellow
}

# Run migrations
Write-Host "🔧 Running database migrations..." -ForegroundColor Cyan
python manage.py migrate

Write-Host ""
Write-Host "✅ Starting development server..." -ForegroundColor Green
Write-Host "📍 API will be available at: http://localhost:8000/graphql/" -ForegroundColor Cyan
Write-Host ""

# Start the development server
python manage.py runserver 0.0.0.0:8000

