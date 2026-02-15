# PowerShell Script to Restart Dashboard Container After File Changes
# Run this after copying files from 3.22.24

Write-Host "🔄 Restarting Saleor Dashboard container..." -ForegroundColor Cyan

# Navigate to infra directory
Set-Location "C:\Users\micha\saleor-platform\infra"

# Check if container is running
$containerStatus = docker compose -f docker-compose.dev.yml ps saleor-dashboard 2>&1

if ($containerStatus -match "Up|running") {
    Write-Host "✅ Dashboard container is running" -ForegroundColor Green
    Write-Host "🔄 Restarting with rebuild..." -ForegroundColor Yellow
    
    # Restart and rebuild
    docker compose -f docker-compose.dev.yml up -d --build saleor-dashboard
    
    Write-Host "`n✅ Dashboard container restarted!" -ForegroundColor Green
    Write-Host "📋 Watching logs (Ctrl+C to stop)..." -ForegroundColor Yellow
    Write-Host ""
    
    # Show logs
    docker compose -f docker-compose.dev.yml logs -f saleor-dashboard
} else {
    Write-Host "⚠️  Dashboard container is not running" -ForegroundColor Yellow
    Write-Host "🚀 Starting dashboard container..." -ForegroundColor Cyan
    
    # Start the container
    docker compose -f docker-compose.dev.yml up -d --build saleor-dashboard
    
    Write-Host "`n✅ Dashboard container started!" -ForegroundColor Green
    Write-Host "📋 Watching logs (Ctrl+C to stop)..." -ForegroundColor Yellow
    Write-Host ""
    
    # Show logs
    docker compose -f docker-compose.dev.yml logs -f saleor-dashboard
}

