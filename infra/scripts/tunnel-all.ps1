# PowerShell script to create tunnels for all Saleor services
# Tunnels: Saleor API (8000), Dashboard (9000), and Stripe App (3002)

param(
    [string]$Tool = "cloudflared"  # Options: "cloudflared" or "ngrok"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Saleor Services Tunnel Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Service mappings
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
    Write-Host "Using cloudflared (recommended - handles multiple ports)" -ForegroundColor Green
    Write-Host ""
    
    # Check if cloudflared is installed
    $cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
    
    if (-not $cloudflared) {
        Write-Host "cloudflared not found. Installing via winget..." -ForegroundColor Yellow
        winget install --id Cloudflare.cloudflared -e | Out-Null
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        
        # Find cloudflared
        $cloudflaredExe = $null
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
        
        if (-not $cloudflaredExe) {
            $cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
            if ($cloudflared) {
                $cloudflaredExe = $cloudflared.Source
            }
        }
        
        if (-not $cloudflaredExe) {
            Write-Host "cloudflared was installed but could not be found. Please restart PowerShell." -ForegroundColor Red
            exit 1
        }
        
        $cloudflaredCmd = $cloudflaredExe
    }
    else {
        $cloudflaredCmd = "cloudflared"
    }
    
    Write-Host "Starting cloudflared tunnels for all services..." -ForegroundColor Cyan
    Write-Host "Each service will get its own tunnel URL" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Note: We'll create tunnels sequentially so you can see which URL is for which service." -ForegroundColor Gray
    Write-Host "Press Ctrl+C to stop all tunnels" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Create tunnels sequentially with clear labels
    $tunnels = @(
        @{Port = 8000; Name = "Saleor API (GraphQL)" },
        @{Port = 9000; Name = "Dashboard" },
        @{Port = 3002; Name = "Stripe App" }
    )
    
    $tunnelUrls = @{}
    
    foreach ($tunnel in $tunnels) {
        Write-Host "Creating tunnel for: $($tunnel.Name) (Port $($tunnel.Port))" -ForegroundColor Cyan
        Write-Host "----------------------------------------" -ForegroundColor Gray
        
        # Run cloudflared in background and capture output
        $job = Start-Job -ScriptBlock {
            param($cloudflaredCmd, $port)
            & $cloudflaredCmd tunnel --url "http://localhost:$port" 2>&1
        } -ArgumentList $cloudflaredCmd, $tunnel.Port
        
        # Wait a bit for the tunnel to be created
        Start-Sleep -Seconds 3
        
        # Get the output and look for the URL
        $output = Receive-Job -Job $job
        $url = $null
        
        foreach ($line in $output) {
            if ($line -match "https://[a-z0-9-]+\.trycloudflare\.com") {
                $url = $matches[0]
                break
            }
        }
        
        if ($url) {
            $tunnelUrls[$tunnel.Port] = $url
            Write-Host "✓ $($tunnel.Name):" -ForegroundColor Green
            Write-Host "  $url" -ForegroundColor White
            Write-Host ""
        }
        else {
            Write-Host "⚠ Could not extract URL for $($tunnel.Name)" -ForegroundColor Yellow
            Write-Host "  Check the output above for the tunnel URL" -ForegroundColor Gray
            Write-Host ""
        }
        
        # Keep the job running
        $job | Out-Null
    }
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Tunnel Summary:" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    foreach ($port in $tunnelUrls.Keys) {
        $service = ($tunnels | Where-Object { $_.Port -eq $port }).Name
        Write-Host "$service (Port $port):" -ForegroundColor Yellow
        Write-Host "  $($tunnelUrls[$port])" -ForegroundColor White
    }
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "All tunnels are running. Press Ctrl+C to stop all tunnels." -ForegroundColor Yellow
    Write-Host ""
    
    # Keep the script running and show job output
    try {
        while ($true) {
            Start-Sleep -Seconds 5
            # Show any new output from jobs
            Get-Job | Receive-Job -ErrorAction SilentlyContinue | Out-Null
        }
    }
    finally {
        # Clean up jobs on exit
        Get-Job | Stop-Job
        Get-Job | Remove-Job
    }
}
elseif ($Tool -eq "ngrok") {
    Write-Host "Using ngrok" -ForegroundColor Green
    Write-Host "Note: ngrok requires separate processes for each port" -ForegroundColor Yellow
    Write-Host ""
    
    $ngrok = Get-Command ngrok -ErrorAction SilentlyContinue
    if (-not $ngrok) {
        Write-Host "ngrok not found. Please install from https://ngrok.com/download" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "For multiple ports with ngrok, you need separate terminals." -ForegroundColor Yellow
    Write-Host "Starting tunnel for Saleor API (port 8000)..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "For other ports, open new terminals and run:" -ForegroundColor White
    Write-Host "  ngrok http 9000  # Dashboard" -ForegroundColor Gray
    Write-Host "  ngrok http 3002  # Stripe App" -ForegroundColor Gray
    Write-Host ""
    
    ngrok http 8000
}
else {
    Write-Host "Unknown tool: $Tool. Use 'cloudflared' or 'ngrok'" -ForegroundColor Red
    exit 1
}
