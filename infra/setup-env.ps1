# PowerShell script to create .env file for Saleor development
# Run this script from the infra folder

$envFile = ".env"

if (Test-Path $envFile) {
    Write-Host "[!] .env file already exists. Skipping creation." -ForegroundColor Yellow
    exit
}

Write-Host "[*] Generating SECRET_KEY..." -ForegroundColor Cyan

# Generate a secure random key
$secretKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 50 | ForEach-Object { [char]$_ })
$secretKey = $secretKey + (New-Guid).ToString().Replace("-", "")

$envContent = @"
# Core Settings
SECRET_KEY=$secretKey
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
ALLOWED_CLIENT_HOSTS=localhost:3000,localhost:3001

# Database (defaults work for local dev)
DATABASE_URL=postgres://saleor:saleor@postgres:5432/saleor

# Redis (defaults work for local dev)
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# Media Files
MEDIA_ROOT=/app/media
MEDIA_URL=/media/

# Email (console for development)
EMAIL_URL=consolemail://

# Timezone
TIME_ZONE=UTC

# Enable Playground in Development
GRAPHQL_PLAYGROUND_ENABLED=True
"@

$envContent | Out-File -FilePath $envFile -Encoding utf8

Write-Host "[+] .env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "[*] Next steps:" -ForegroundColor Cyan
Write-Host "   1. Make sure Docker Desktop is running"
Write-Host "   2. Run: docker compose -f docker-compose.dev.yml up -d"
Write-Host ""

