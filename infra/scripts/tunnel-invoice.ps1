# PowerShell script to create a tunnel for the Invoice app
# This allows external access to your local Invoice app for webhook testing

param(
    [string]$Port = "3003",
    [string]$Tool = "cloudflared"  # Options: "cloudflared" or "ngrok"
)

Write-Host "Creating tunnel for Invoice app on port $Port using $Tool..." -ForegroundColor Green

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
            Write-Host "Or manually run: cloudflared tunnel --url http://localhost:$Port" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "Found cloudflared at: $cloudflaredExe" -ForegroundColor Green
        $cloudflaredCmd = $cloudflaredExe
    }
    else {
        $cloudflaredCmd = "cloudflared"
    }
    
    Write-Host "Starting cloudflared tunnel..." -ForegroundColor Cyan
    Write-Host "Your Invoice app will be accessible at the URL shown below" -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
    Write-Host ""
    
    & $cloudflaredCmd tunnel --url http://localhost:$Port
}
elseif ($Tool -eq "ngrok") {
    # Check if ngrok is installed
    $ngrok = Get-Command ngrok -ErrorAction SilentlyContinue
    if (-not $ngrok) {
        Write-Host "ngrok not found. Please install from https://ngrok.com/download" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Starting ngrok tunnel..." -ForegroundColor Cyan
    Write-Host "Your Invoice app will be accessible at the URL shown below" -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
    Write-Host ""
    
    ngrok http $Port
}
else {
    Write-Host "Unknown tool: $Tool. Use 'cloudflared' or 'ngrok'" -ForegroundColor Red
    exit 1
}

