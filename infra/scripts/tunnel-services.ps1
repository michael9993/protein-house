# PowerShell script to create tunnels for Saleor services
# Supports tunneling Saleor API (8000), Dashboard (9000), and Stripe App (3002)

param(
    [string[]]$Ports = @("8000", "9000", "3002"),
    [string]$Tool = "cloudflared"  # Options: "cloudflared" or "ngrok"
)

Write-Host "Creating tunnels for Saleor services..." -ForegroundColor Green
Write-Host "Ports: $($Ports -join ', ')" -ForegroundColor Cyan
Write-Host "Tool: $Tool" -ForegroundColor Cyan
Write-Host ""

if ($Tool -eq "cloudflared") {
    # Check if cloudflared is installed
    $cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
    
    if (-not $cloudflared) {
        Write-Host "cloudflared not found. Installing via winget..." -ForegroundColor Yellow
        winget install --id Cloudflare.cloudflared -e | Out-Null
        
        # Refresh PATH environment variable in current session
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        
        # Try to find cloudflared in common installation locations
        $cloudflaredExe = $null
        
        # Check Program Files locations
        $programFilesPaths = @(
            "${env:ProgramFiles}\Cloudflare\cloudflared\cloudflared.exe",
            "${env:ProgramFiles(x86)}\Cloudflare\cloudflared\cloudflared.exe"
        )
        
        foreach ($path in $programFilesPaths) {
            if (Test-Path $path) {
                $cloudflaredExe = $path
                break
            }
        }
        
        # Check WinGet packages location (with wildcard search)
        if (-not $cloudflaredExe) {
            $wingetPath = "${env:LOCALAPPDATA}\Microsoft\WinGet\Packages"
            if (Test-Path $wingetPath) {
                $cloudflaredDirs = Get-ChildItem -Path $wingetPath -Filter "Cloudflare.cloudflared_*" -Directory -ErrorAction SilentlyContinue
                foreach ($dir in $cloudflaredDirs) {
                    $exePath = Join-Path $dir.FullName "cloudflared.exe"
                    if (Test-Path $exePath) {
                        $cloudflaredExe = $exePath
                        break
                    }
                }
            }
        }
        
        # Also check PATH again after refresh
        if (-not $cloudflaredExe) {
            $cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
            if ($cloudflared) {
                $cloudflaredExe = $cloudflared.Source
            }
        }
        
        if (-not $cloudflaredExe) {
            Write-Host "cloudflared was installed but could not be found. Please restart PowerShell and try again." -ForegroundColor Red
            Write-Host "Or manually run: cloudflared tunnel --url http://localhost:PORT" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "Found cloudflared at: $cloudflaredExe" -ForegroundColor Green
        $cloudflaredCmd = $cloudflaredExe
    }
    else {
        $cloudflaredCmd = "cloudflared"
    }
    
    # Cloudflared can tunnel multiple ports, but we need separate tunnels
    # We'll create a tunnel for each port
    Write-Host "Starting cloudflared tunnels..." -ForegroundColor Cyan
    Write-Host "Your services will be accessible at the URLs shown below" -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop all tunnels" -ForegroundColor Yellow
    Write-Host ""
    
    # For multiple ports, we need to run cloudflared in a way that handles multiple tunnels
    # Cloudflared supports multiple URLs in one command
    $urls = $Ports | ForEach-Object { "http://localhost:$_" }
    $urlsString = $urls -join " "
    
    Write-Host "Tunneling ports: $($Ports -join ', ')" -ForegroundColor Cyan
    Write-Host "URLs: $urlsString" -ForegroundColor Gray
    Write-Host ""
    
    # Note: cloudflared can handle multiple URLs, but each gets its own tunnel URL
    # We'll use the multi-URL feature
    & $cloudflaredCmd tunnel --url $urlsString
}
elseif ($Tool -eq "ngrok") {
    # Check if ngrok is installed
    $ngrok = Get-Command ngrok -ErrorAction SilentlyContinue
    if (-not $ngrok) {
        Write-Host "ngrok not found. Please install from https://ngrok.com/download" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Starting ngrok tunnels..." -ForegroundColor Cyan
    Write-Host "Note: ngrok requires separate processes for each port" -ForegroundColor Yellow
    Write-Host "Starting tunnels for ports: $($Ports -join ', ')" -ForegroundColor Cyan
    Write-Host ""
    
    # Ngrok can handle multiple ports with a config file, but for simplicity
    # we'll start the first port and note that others need separate terminals
    if ($Ports.Count -eq 1) {
        Write-Host "Starting ngrok tunnel for port $($Ports[0])..." -ForegroundColor Cyan
        Write-Host "Your service will be accessible at the URL shown below" -ForegroundColor Yellow
        Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
        Write-Host ""
        ngrok http $Ports[0]
    }
    else {
        Write-Host "For multiple ports with ngrok, you need to:" -ForegroundColor Yellow
        Write-Host "1. Run this script multiple times with different ports, OR" -ForegroundColor White
        Write-Host "2. Create an ngrok config file with multiple tunnels" -ForegroundColor White
        Write-Host ""
        Write-Host "Starting tunnel for first port ($($Ports[0]))..." -ForegroundColor Cyan
        Write-Host "For other ports, run: ngrok http PORT" -ForegroundColor Yellow
        Write-Host ""
        ngrok http $Ports[0]
    }
}
else {
    Write-Host "Unknown tool: $Tool. Use 'cloudflared' or 'ngrok'" -ForegroundColor Red
    exit 1
}
