# Simple script to tunnel all services with CLEAR labels
# This runs each tunnel separately so you can see which URL is for which service

param(
    [string]$Tool = "cloudflared"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Saleor Services Tunnel Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find cloudflared
$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflared) {
    Write-Host "Installing cloudflared..." -ForegroundColor Yellow
    winget install --id Cloudflare.cloudflared -e | Out-Null
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    $cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
}

if (-not $cloudflared) {
    $paths = @(
        "${env:ProgramFiles}\Cloudflare\cloudflared\cloudflared.exe",
        "${env:ProgramFiles(x86)}\Cloudflare\cloudflared\cloudflared.exe"
    )
    foreach ($path in $paths) {
        if (Test-Path $path) {
            $cloudflaredCmd = $path
            break
        }
    }
    if (-not $cloudflaredCmd) {
        Write-Host "cloudflared not found. Please restart PowerShell." -ForegroundColor Red
        exit 1
    }
}
else {
    $cloudflaredCmd = "cloudflared"
}

Write-Host "This script will create 3 tunnels, one for each service." -ForegroundColor Yellow
Write-Host "Watch carefully - each tunnel will show its URL." -ForegroundColor Yellow
Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
Write-Host "  1. Saleor API (Port 8000)" -ForegroundColor White
Write-Host "  2. Dashboard (Port 9000)" -ForegroundColor White
Write-Host "  3. Stripe App (Port 3002)" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter to start creating tunnels..." -ForegroundColor Yellow
Read-Host

# Create tunnels one at a time
$tunnels = @(
    @{Port = 8000; Name = "Saleor API" },
    @{Port = 9000; Name = "Dashboard" },
    @{Port = 3002; Name = "Stripe App" }
)

$results = @{}

foreach ($tunnel in $tunnels) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Creating tunnel for: $($tunnel.Name) (Port $($tunnel.Port))" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Look for the URL in the output below:" -ForegroundColor Yellow
    Write-Host ""
    
    # Run cloudflared and let user see the output
    & $cloudflaredCmd tunnel --url "http://localhost:$($tunnel.Port)"
    
    Write-Host ""
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host "Did you see the URL for $($tunnel.Name)? (y/n)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "Great! Moving to next service..." -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All tunnels created!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
