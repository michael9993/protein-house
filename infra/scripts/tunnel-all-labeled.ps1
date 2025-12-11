# PowerShell script to create tunnels for all Saleor services with CLEAR LABELS
# This version creates tunnels sequentially so you can see which URL is for which service

param(
    [string]$Tool = "cloudflared"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Saleor Services Tunnel Setup (Labeled)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$services = @{
    "8000" = "Saleor API (GraphQL)"
    "9000" = "Dashboard"
    "3002" = "Stripe App"
}

Write-Host "Services to tunnel:" -ForegroundColor Yellow
foreach ($port in $services.Keys) {
    Write-Host "  Port $port : $($services[$port])" -ForegroundColor White
}
Write-Host ""

if ($Tool -eq "cloudflared") {
    $cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
    
    if (-not $cloudflared) {
        Write-Host "cloudflared not found. Installing..." -ForegroundColor Yellow
        winget install --id Cloudflare.cloudflared -e | Out-Null
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        
        $cloudflaredExe = $null
        $paths = @(
            "${env:ProgramFiles}\Cloudflare\cloudflared\cloudflared.exe",
            "${env:ProgramFiles(x86)}\Cloudflare\cloudflared\cloudflared.exe"
        )
        
        foreach ($path in $paths) {
            if (Test-Path $path) {
                $cloudflaredExe = $path
                break
            }
        }
        
        if (-not $cloudflaredExe) {
            $wingetPath = "${env:LOCALAPPDATA}\Microsoft\WinGet\Packages"
            if (Test-Path $wingetPath) {
                $dirs = Get-ChildItem -Path $wingetPath -Filter "Cloudflare.cloudflared_*" -Directory -ErrorAction SilentlyContinue
                foreach ($dir in $dirs) {
                    $exePath = Join-Path $dir.FullName "cloudflared.exe"
                    if (Test-Path $exePath) {
                        $cloudflaredExe = $exePath
                        break
                    }
                }
            }
        }
        
        if (-not $cloudflaredExe) {
            $cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
            if ($cloudflared) {
                $cloudflaredExe = $cloudflared.Source
            }
        }
        
        if (-not $cloudflaredExe) {
            Write-Host "cloudflared not found. Please restart PowerShell." -ForegroundColor Red
            exit 1
        }
        
        $cloudflaredCmd = $cloudflaredExe
    }
    else {
        $cloudflaredCmd = "cloudflared"
    }
    
    Write-Host "Creating tunnels one at a time with clear labels..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $tunnelInfo = @{}
    
    # Create each tunnel and capture its URL
    foreach ($port in @("8000", "9000", "3002")) {
        $serviceName = $services[$port]
        Write-Host "[$serviceName - Port $port]" -ForegroundColor Cyan
        Write-Host "Creating tunnel... (this may take a few seconds)" -ForegroundColor Gray
        Write-Host ""
        
        # Run cloudflared and capture output
        $process = Start-Process -FilePath $cloudflaredCmd -ArgumentList "tunnel", "--url", "http://localhost:$port" -NoNewWindow -RedirectStandardOutput "tunnel-$port.log" -RedirectStandardError "tunnel-$port-err.log" -PassThru
        
        # Wait for tunnel to be created
        Start-Sleep -Seconds 5
        
        # Try to read the log file to find the URL
        $url = $null
        if (Test-Path "tunnel-$port.log") {
            $logContent = Get-Content "tunnel-$port.log" -ErrorAction SilentlyContinue
            foreach ($line in $logContent) {
                if ($line -match "https://([a-z0-9-]+)\.trycloudflare\.com") {
                    $url = $matches[0]
                    break
                }
            }
        }
        
        if ($url) {
            $tunnelInfo[$port] = @{
                Service = $serviceName
                URL     = $url
            }
            Write-Host "✓ TUNNEL CREATED!" -ForegroundColor Green
            Write-Host "  Service: $serviceName" -ForegroundColor White
            Write-Host "  URL: $url" -ForegroundColor White
        }
        else {
            Write-Host "⚠ Tunnel created but URL not captured" -ForegroundColor Yellow
            Write-Host "  Check the cloudflared output window for the URL" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "----------------------------------------" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "TUNNEL SUMMARY" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($port in @("8000", "9000", "3002")) {
        if ($tunnelInfo.ContainsKey($port)) {
            $info = $tunnelInfo[$port]
            Write-Host "$($info.Service) (Port $port):" -ForegroundColor Yellow
            Write-Host "  $($info.URL)" -ForegroundColor White
            Write-Host ""
        }
    }
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "All tunnels are running in background." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop this script (tunnels will continue running)." -ForegroundColor Yellow
    Write-Host "To stop tunnels, close the cloudflared windows or kill the processes." -ForegroundColor Yellow
    Write-Host ""
    
    # Keep script running
    try {
        while ($true) {
            Start-Sleep -Seconds 10
        }
    }
    finally {
        # Clean up log files
        Remove-Item "tunnel-*.log" -ErrorAction SilentlyContinue
    }
}
else {
    Write-Host "Only cloudflared is supported in this labeled version." -ForegroundColor Red
    Write-Host "Use tunnel-all.ps1 for ngrok support." -ForegroundColor Yellow
}
