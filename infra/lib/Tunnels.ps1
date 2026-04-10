# ============================================================================
# Tunnels.ps1 -- Cloudflare Tunnel Management
# ============================================================================
# Handles both ephemeral (trycloudflare.com) and named tunnel modes.
#
# Usage:
#   . "$PSScriptRoot\lib\Tunnels.ps1"
#   $cf = Find-Cloudflared
#   $tunnel = Start-EphemeralTunnel -CloudflaredCmd $cf -Port 8000 -ServiceName "api"
#   Write-Host "URL: $($tunnel.URL)"
# ============================================================================

function Find-Cloudflared {
    <#
    .SYNOPSIS
    Locates the cloudflared executable.
    Returns the command/path string, or throws if not found.
    #>

    # 1. Check PATH
    $inPath = Get-Command "cloudflared" -ErrorAction SilentlyContinue
    if ($inPath) {
        return "cloudflared"
    }

    # 2. Common install locations
    $candidates = @(
        "$env:ProgramFiles\cloudflared\cloudflared.exe",
        "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe",
        "$env:LOCALAPPDATA\Programs\cloudflared\cloudflared.exe",
        "$env:USERPROFILE\.cloudflared\cloudflared.exe",
        # WinGet installs here
        "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe"
    )

    foreach ($path in $candidates) {
        if (Test-Path $path) {
            return $path
        }
    }

    # 3. Try WinGet dynamic search
    try {
        $wingetResult = winget list cloudflared 2>$null
        if ($LASTEXITCODE -eq 0 -and $wingetResult -match "cloudflared") {
            # It's installed via WinGet, try to resolve
            $resolved = Get-Command "cloudflared" -ErrorAction SilentlyContinue
            if ($resolved) { return "cloudflared" }
        }
    } catch { }

    throw "cloudflared not found. Install it with: winget install Cloudflare.cloudflared"
}

function Get-TunnelUrl {
    <#
    .SYNOPSIS
    Extracts a trycloudflare.com or custom domain URL from cloudflared output text.
    #>
    param([string]$Output)

    # Match https://xxx.trycloudflare.com or https://sub.domain.tld
    if ($Output -match "https://[a-zA-Z0-9\-]+\.trycloudflare\.com") {
        return $matches[0]
    }
    if ($Output -match "https://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}") {
        return $matches[0]
    }
    return $null
}

function Start-EphemeralTunnel {
    <#
    .SYNOPSIS
    Starts a cloudflared quick tunnel (no account needed) for a given local port.
    Captures the assigned URL from cloudflared's stderr output.
    Returns @{ Process, URL, LogFile }.
    #>
    param(
        [string]$CloudflaredCmd,
        [int]$Port,
        [string]$ServiceName = "service"
    )

    $logFile = [System.IO.Path]::GetTempFileName()
    $logFile = [System.IO.Path]::ChangeExtension($logFile, ".log")

    Write-Host "  Starting ephemeral tunnel for $ServiceName (port $Port)..." -ForegroundColor Gray

    # cloudflared tunnel --url writes to stderr; redirect to log file via cmd
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "cmd.exe"
    $psi.Arguments = "/c `"$CloudflaredCmd`" tunnel --url http://localhost:$Port 2>`"$logFile`""
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden

    $process = [System.Diagnostics.Process]::Start($psi)

    # Wait for URL to appear in log (up to 30 seconds)
    $url = $null
    $waited = 0
    while ($waited -lt 30) {
        Start-Sleep -Seconds 2
        $waited += 2
        if (Test-Path $logFile) {
            $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
            if ($content) {
                $url = Get-TunnelUrl -Output $content
                if ($url) { break }
            }
        }
    }

    if (-not $url) {
        Write-Host "  [WARN] Could not capture tunnel URL for $ServiceName after 30s." -ForegroundColor Yellow
        # Return process so caller can kill it later
    } else {
        Write-Host "  [OK] $ServiceName tunnel: $url" -ForegroundColor Green
    }

    return @{
        Process = $process
        URL     = $url
        LogFile = $logFile
    }
}

function Start-NamedTunnel {
    <#
    .SYNOPSIS
    Starts a cloudflared named tunnel using a config file (e.g., cloudflared-config.yml).
    Returns the process object.
    #>
    param(
        [string]$CloudflaredCmd,
        [string]$TunnelConfigPath
    )

    if (-not (Test-Path $TunnelConfigPath)) {
        throw "Tunnel config not found: $TunnelConfigPath"
    }

    Write-Host "Starting named tunnel with config: $TunnelConfigPath" -ForegroundColor Yellow

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $CloudflaredCmd
    $psi.Arguments = "tunnel --config `"$TunnelConfigPath`" run"
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $false

    $process = [System.Diagnostics.Process]::Start($psi)
    Write-Host "[OK] Named tunnel started (PID $($process.Id))." -ForegroundColor Green
    return $process
}

function Stop-AllTunnels {
    <#
    .SYNOPSIS
    Kills only the cloudflared process(es) belonging to THIS project (protein-house tunnel).
    Uses command-line matching so Pawzen or other tunnels running simultaneously are NOT affected.
    #>
    $ourMarker = "cloudflared-config.yml"   # unique path fragment in our tunnel's command line
    $allCf = Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" -ErrorAction SilentlyContinue
    if (-not $allCf) {
        Write-Host "No cloudflared processes found." -ForegroundColor Gray
        return
    }

    $ours = $allCf | Where-Object { $_.CommandLine -like "*$ourMarker*" }
    if ($ours) {
        Write-Host "Stopping $(@($ours).Count) protein-house cloudflared process(es)..." -ForegroundColor Yellow
        foreach ($p in $ours) {
            Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
        }
        Write-Host "[OK] protein-house tunnel stopped." -ForegroundColor Green
    } else {
        Write-Host "No protein-house cloudflared tunnel found running." -ForegroundColor Gray
    }
}

# Functions are auto-exported when dot-sourced (Export-ModuleMember removed -- only valid in .psm1)
