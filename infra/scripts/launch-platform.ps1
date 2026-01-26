# ========================================
# Saleor Platform - Complete Launch Script
# ========================================
# This script launches all Cloudflare tunnels, captures URLs,
# and updates configuration files automatically
#
# Usage: .\infra\scripts\launch-platform.ps1

param(
    [string]$Tool = "cloudflared"  # Options: "cloudflared" or "ngrok"
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Saleor Platform - Complete Launch" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Service definitions
$services = @(
    @{Port = 8000; Name = "Saleor API"; EnvVar = "SALEOR_API_TUNNEL_URL"; Script = "tunnel-api.ps1" },
    @{Port = 9000; Name = "Dashboard"; EnvVar = "DASHBOARD_TUNNEL_URL"; Script = "tunnel-dashboard.ps1" },
    @{Port = 3000; Name = "Storefront"; EnvVar = "STOREFRONT_TUNNEL_URL"; Script = "tunnel-storefront.ps1" },
    @{Port = 3002; Name = "Stripe App"; EnvVar = "STRIPE_APP_TUNNEL_URL"; Script = "tunnel-stripe.ps1" },
    @{Port = 3001; Name = "SMTP App"; EnvVar = "SMTP_APP_TUNNEL_URL"; Script = "tunnel-smtp.ps1" },
    @{Port = 3003; Name = "Invoice App"; EnvVar = "INVOICE_APP_TUNNEL_URL"; Script = "tunnel-invoice.ps1" },
    @{Port = 3004; Name = "Storefront Control App"; EnvVar = "STOREFRONT_CONTROL_APP_TUNNEL_URL"; Script = "tunnel-storefront-control.ps1" },
    @{Port = 3005; Name = "Newsletter App"; EnvVar = "NEWSLETTER_APP_TUNNEL_URL"; Script = "tunnel-newsletter.ps1" },
    @{Port = 3006; Name = "Sales Analytics App"; EnvVar = "SALES_ANALYTICS_APP_TUNNEL_URL"; Script = "tunnel-sales-analytics.ps1" }
)

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$infraDir = Split-Path -Parent $scriptDir
$envFile = Join-Path $infraDir ".env"
$viteConfigFile = Join-Path (Split-Path -Parent $infraDir) "dashboard\vite.config.js"

# Function to find cloudflared
function Get-CloudflaredCommand {
    $cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
    
    if (-not $cloudflared) {
        Write-Host "cloudflared not found. Installing via winget..." -ForegroundColor Yellow
        winget install --id Cloudflare.cloudflared -e | Out-Null
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        
        # Try to find cloudflared in common locations
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
        
        Write-Host "Found cloudflared at: $cloudflaredExe" -ForegroundColor Green
        return $cloudflaredExe
    }
    
    return "cloudflared"
}

# Function to extract URL from cloudflared output
function Get-TunnelUrl {
    param(
        [string]$Output
    )
    
    if (-not $Output) {
        return $null
    }
    
    # Cloudflared outputs URLs in various formats:
    # - https://xxx.trycloudflare.com
    # - + https://xxx.trycloudflare.com
    # - | https://xxx.trycloudflare.com
    # - https://xxx.trycloudflare.com (standalone)
    # Try multiple patterns
    $patterns = @(
        "https://([a-z0-9-]+)\.trycloudflare\.com",
        "https://([a-z0-9-]+)\.trycloudflare\.com",
        "`"https://([a-z0-9-]+)\.trycloudflare\.com`""
    )
    
    foreach ($pattern in $patterns) {
        if ($Output -match $pattern) {
            $url = $matches[0]
            # Clean up URL if it has quotes
            $url = $url -replace '["\x27]', ''
            return $url
        }
    }
    
    return $null
}

# Function to start tunnel and capture URL
function Start-TunnelWithUrlCapture {
    param(
        [string]$CloudflaredCmd,
        [int]$Port,
        [string]$ServiceName
    )
    
    Write-Host "Starting tunnel for $ServiceName (port $Port)..." -ForegroundColor Cyan
    
    # Create unique log files for this tunnel
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    $logFile = Join-Path $env:TEMP "cloudflared-$Port-$timestamp.log"
    $errorLogFile = Join-Path $env:TEMP "cloudflared-$Port-$timestamp-err.log"
    
    # Remove old log files if they exist
    if (Test-Path $logFile) { Remove-Item $logFile -Force -ErrorAction SilentlyContinue }
    if (Test-Path $errorLogFile) { Remove-Item $errorLogFile -Force -ErrorAction SilentlyContinue }
    
    # Start cloudflared process with file redirection
    $process = Start-Process -FilePath $CloudflaredCmd -ArgumentList "tunnel", "--url", "http://localhost:$Port" `
        -RedirectStandardOutput $logFile `
        -RedirectStandardError $errorLogFile `
        -PassThru `
        -WindowStyle Hidden
    
    # Wait for URL to appear (cloudflared outputs it quickly, usually within 2-3 seconds)
    $maxWait = 10 # seconds
    $waited = 0
    $url = $null
    
    while ($waited -lt $maxWait -and -not $url) {
        Start-Sleep -Milliseconds 500
        $waited += 0.5
        
        # Check error log first (cloudflared outputs URL to stderr)
        if (Test-Path $errorLogFile) {
            $errorContent = Get-Content $errorLogFile -Raw -ErrorAction SilentlyContinue
            if ($errorContent) {
                $url = Get-TunnelUrl -Output $errorContent
                if ($url) {
                    break
                }
            }
        }
        
        # Also check stdout log
        if (-not $url -and (Test-Path $logFile)) {
            $outputContent = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
            if ($outputContent) {
                $url = Get-TunnelUrl -Output $outputContent
                if ($url) {
                    break
                }
            }
        }
    }
    
    if ($url) {
        Write-Host "  ✓ URL captured: $url" -ForegroundColor Green
        return @{
            Process      = $process
            URL          = $url
            LogFile      = $logFile
            ErrorLogFile = $errorLogFile
        }
    }
    else {
        Write-Host "  ⚠ URL not captured after $maxWait seconds" -ForegroundColor Yellow
        Write-Host "  Process is still running (PID: $($process.Id))" -ForegroundColor Gray
        Write-Host "  Check logs: $errorLogFile" -ForegroundColor Gray
        
        # Try one final read
        if (Test-Path $errorLogFile) {
            Start-Sleep -Seconds 1
            $errorContent = Get-Content $errorLogFile -Raw -ErrorAction SilentlyContinue
            if ($errorContent) {
                $url = Get-TunnelUrl -Output $errorContent
                if ($url) {
                    Write-Host "  ✓ URL found on final check: $url" -ForegroundColor Green
                    return @{
                        Process      = $process
                        URL          = $url
                        LogFile      = $logFile
                        ErrorLogFile = $errorLogFile
                    }
                }
            }
        }
        
        Write-Host "  ⚠ Could not auto-capture URL. Check the log file or enter manually." -ForegroundColor Yellow
        return @{
            Process      = $process
            URL          = $null
            LogFile      = $logFile
            ErrorLogFile = $errorLogFile
        }
    }
}

# Main execution
if ($Tool -ne "cloudflared") {
    Write-Host "Only cloudflared is currently supported for auto-URL capture." -ForegroundColor Red
    Write-Host "For ngrok, please use the individual tunnel scripts manually." -ForegroundColor Yellow
    exit 1
}

# Get cloudflared command
$cloudflaredCmd = Get-CloudflaredCommand

Write-Host "`nStarting all tunnels..." -ForegroundColor Yellow
Write-Host "This may take a few seconds...`n" -ForegroundColor Gray

# Start all tunnels
$tunnelJobs = @{}
$tunnelUrls = @{}

foreach ($service in $services) {
    $result = Start-TunnelWithUrlCapture -CloudflaredCmd $cloudflaredCmd -Port $service.Port -ServiceName $service.Name
    
    $tunnelJobs[$service.Port] = $result
    
    if ($result.URL) {
        $tunnelUrls[$service.EnvVar] = $result.URL
        Write-Host "  $($service.Name): $($result.URL)" -ForegroundColor White
    }
    else {
        Write-Host "  $($service.Name): URL not captured" -ForegroundColor Yellow
        Write-Host "    Process is running (PID: $($result.Process.Id))" -ForegroundColor Gray
        if ($result.ErrorLogFile) {
            Write-Host "    Check log: $($result.ErrorLogFile)" -ForegroundColor Gray
        }
        
        # Prompt for manual entry
        Write-Host ""
        $manualUrl = Read-Host "    Enter tunnel URL manually (or press Enter to skip)"
        if ($manualUrl -and $manualUrl -match "https://[a-z0-9-]+\.trycloudflare\.com") {
            $tunnelUrls[$service.EnvVar] = $manualUrl.Trim()
            Write-Host "    ✓ Using manual URL: $($tunnelUrls[$service.EnvVar])" -ForegroundColor Green
        }
        else {
            Write-Host "    ⚠ Skipping URL for $($service.Name)" -ForegroundColor Yellow
        }
    }
    
    # Small delay between tunnel starts
    Start-Sleep -Milliseconds 500
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Tunnel Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

foreach ($service in $services) {
    if ($tunnelUrls.ContainsKey($service.EnvVar)) {
        Write-Host "$($service.Name):" -ForegroundColor Yellow
        Write-Host "  $($tunnelUrls[$service.EnvVar])" -ForegroundColor White
    }
    else {
        Write-Host "$($service.Name):" -ForegroundColor Yellow
        Write-Host "  ⚠ URL not captured" -ForegroundColor Red
    }
}

# Update .env file
if ($tunnelUrls.Count -gt 0) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Updating .env file..." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
    if (-not (Test-Path $envFile)) {
        Write-Host "Creating .env file from template..." -ForegroundColor Yellow
        $envTemplate = Join-Path $infraDir "env-template.txt"
        if (Test-Path $envTemplate) {
            Copy-Item $envTemplate $envFile
        }
        else {
            # Create minimal .env
            "# Saleor Platform Configuration`n" | Out-File -FilePath $envFile -Encoding utf8
        }
    }
    
    # Read current .env
    $envContent = Get-Content $envFile -Raw -ErrorAction SilentlyContinue
    if (-not $envContent) {
        $envContent = "# Saleor Platform Configuration`n"
    }
    
    # Update each tunnel URL
    foreach ($envVar in $tunnelUrls.Keys) {
        $url = $tunnelUrls[$envVar]
        
        if ($envContent -match "$envVar=(.+?)(?:\r?\n|$)") {
            # Replace existing value
            $envContent = $envContent -replace "$envVar=.*", "$envVar=$url"
            Write-Host "  Updated $envVar" -ForegroundColor Green
        }
        else {
            # Add new variable
            $envContent += "`n$envVar=$url"
            Write-Host "  Added $envVar" -ForegroundColor Green
        }
    }
    
    # Write updated .env
    $envContent | Set-Content $envFile -Encoding utf8
    Write-Host "✓ .env file updated!" -ForegroundColor Green
}

# Update vite.config.js with dashboard tunnel URL
if ($tunnelUrls.ContainsKey("DASHBOARD_TUNNEL_URL") -and (Test-Path $viteConfigFile)) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Updating vite.config.js..." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
    $dashboardUrl = $tunnelUrls["DASHBOARD_TUNNEL_URL"]
    try {
        $dashboardDomain = ([System.Uri]$dashboardUrl).Host
    }
    catch {
        Write-Host "  ⚠ Could not parse dashboard URL: $dashboardUrl" -ForegroundColor Yellow
        $dashboardDomain = $null
    }
    
    if ($dashboardDomain) {
        $viteContent = Get-Content $viteConfigFile -Raw
        $updatedServer = $false
        $updatedPreview = $false
        
        # Check if domain already exists anywhere in the file
        if ($viteContent -match [regex]::Escape($dashboardDomain)) {
            Write-Host "  Domain already exists in vite.config.js" -ForegroundColor Gray
        }
        else {
            # Replace ALL .trycloudflare.com domains with the new one
            # This handles both server.allowedHosts and preview.allowedHosts
            
            # Count how many replacements we'll make
            $matches = [regex]::Matches($viteContent, '["\x27][a-z0-9-]+\.trycloudflare\.com["\x27]')
            
            if ($matches.Count -gt 0) {
                # Replace all occurrences of trycloudflare.com domains
                $viteContent = [regex]::Replace($viteContent, '(["\x27])[a-z0-9-]+\.trycloudflare\.com(["\x27])', "`$1$dashboardDomain`$2")
                Write-Host "  Replaced $($matches.Count) tunnel domain(s) with: $dashboardDomain" -ForegroundColor Green
                $updatedServer = $true
                $updatedPreview = $true
            }
            else {
                # No existing tunnel domains, try to add to server allowedHosts
                if ($viteContent -match '(allowedHosts:\s*isDev\s*\?[\s\S]*?\[[\s\S]*?)(\s+)(// Add more tunnel domains)') {
                    $viteContent = $viteContent -replace '(allowedHosts:\s*isDev\s*\?[\s\S]*?\[[\s\S]*?)(\s+)(// Add more tunnel domains)', "`$1`$2`"$dashboardDomain`",`n`$2`$3"
                    Write-Host "  Added tunnel domain to server.allowedHosts" -ForegroundColor Green
                    $updatedServer = $true
                }
                
                # Try to add to preview.allowedHosts
                if ($viteContent -match '(preview:\s*\{[\s\S]*?allowedHosts:\s*\[[\s\S]*?"127\.0\.0\.1",)') {
                    $viteContent = $viteContent -replace '(preview:\s*\{[\s\S]*?allowedHosts:\s*\[[\s\S]*?"127\.0\.0\.1",)', "`$1`n        `"$dashboardDomain`","
                    Write-Host "  Added tunnel domain to preview.allowedHosts" -ForegroundColor Green
                    $updatedPreview = $true
                }
            }
        }
        
        $viteContent | Set-Content $viteConfigFile -Encoding utf8
        
        if ($updatedServer -or $updatedPreview) {
            Write-Host "✓ vite.config.js updated with domain: $dashboardDomain" -ForegroundColor Green
        }
        else {
            Write-Host "✓ vite.config.js - no changes needed" -ForegroundColor Gray
        }
    }
}

# Run update-urls-from-tunnels.ps1 if it exists
$updateScript = Join-Path $infraDir "update-urls-from-tunnels.ps1"
if (Test-Path $updateScript) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Running update-urls-from-tunnels.ps1..." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
    try {
        & $updateScript
    }
    catch {
        Write-Host "  ⚠ Error running update-urls-from-tunnels.ps1: $_" -ForegroundColor Yellow
        Write-Host "  You may need to run it manually later." -ForegroundColor Gray
    }
}
else {
    Write-Host "`nNote: update-urls-from-tunnels.ps1 not found, skipping URL propagation." -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Platform Launch Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nAll tunnels are running in the background." -ForegroundColor White
Write-Host "To stop all tunnels, press Ctrl+C or close this window." -ForegroundColor Yellow
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Verify tunnel URLs in .env file" -ForegroundColor White
Write-Host "  2. Restart Docker containers if needed:" -ForegroundColor White
Write-Host "     docker compose -f infra/docker-compose.dev.yml up -d --force-recreate" -ForegroundColor Gray
Write-Host "`n"

# Keep script running and monitor tunnels
try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Check if any tunnel process has exited
        foreach ($port in $tunnelJobs.Keys) {
            $job = $tunnelJobs[$port]
            if ($job.Process -and $job.Process.HasExited) {
                $service = $services | Where-Object { $_.Port -eq $port }
                Write-Host "⚠ Tunnel for $($service.Name) (port $port) has exited!" -ForegroundColor Red
            }
        }
    }
}
finally {
    Write-Host "`nStopping all tunnels..." -ForegroundColor Yellow
    
    # Clean up processes
    foreach ($port in $tunnelJobs.Keys) {
        $job = $tunnelJobs[$port]
        if ($job.Process -and -not $job.Process.HasExited) {
            try {
                $job.Process.Kill()
            }
            catch {
                # Process might have already exited
            }
        }
    }
    
    Write-Host "All tunnels stopped." -ForegroundColor Green
}
