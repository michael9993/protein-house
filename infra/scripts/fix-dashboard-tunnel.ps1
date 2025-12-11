# PowerShell script to fix Dashboard tunnel host issue
# Restarts the dashboard service to pick up Vite config changes

Write-Host "Fixing Dashboard tunnel host configuration..." -ForegroundColor Green
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
$serviceName = "saleor-dashboard"

Write-Host "1. Restarting Dashboard service..." -ForegroundColor Cyan
& $dockerComposeCmd -f $composeFile restart $serviceName

Write-Host "2. Waiting for service to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "3. Checking service status..." -ForegroundColor Cyan
& $dockerComposeCmd -f $composeFile ps $serviceName

Write-Host ""
Write-Host "4. Checking logs (last 20 lines)..." -ForegroundColor Cyan
& $dockerComposeCmd -f $composeFile logs --tail=20 $serviceName

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dashboard should now accept tunnel URLs!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The Vite config has been updated to allow:" -ForegroundColor Yellow
Write-Host "  - *.trycloudflare.com (Cloudflared)" -ForegroundColor White
Write-Host "  - *.ngrok.io, *.ngrok-free.app, *.ngrok.app (Ngrok)" -ForegroundColor White
Write-Host ""
Write-Host "Try accessing your tunnel URL again." -ForegroundColor Yellow
