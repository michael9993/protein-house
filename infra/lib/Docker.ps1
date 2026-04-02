# ============================================================================
# Docker.ps1 -- Docker Container Management
# ============================================================================
# Functions for starting, stopping, and querying Docker containers.
#
# Usage:
#   . "$PSScriptRoot\lib\Docker.ps1"
#   if (Test-DockerRunning) { Start-Containers -ComposeFile "docker-compose.dev.yml" }
# ============================================================================

function Test-DockerRunning {
    <#
    .SYNOPSIS
    Checks if Docker is running. Optionally attempts to start Docker Desktop.
    Returns $true if Docker is available, $false otherwise.
    #>
    param(
        [switch]$AutoStart
    )

    try {
        $null = docker info 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
    } catch { }

    if ($AutoStart) {
        Write-Host "Docker is not running. Attempting to start Docker Desktop..." -ForegroundColor Yellow
        $dockerDesktop = @(
            "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
            "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
            "$env:LOCALAPPDATA\Programs\Docker\Docker\Docker Desktop.exe"
        ) | Where-Object { Test-Path $_ } | Select-Object -First 1

        if ($dockerDesktop) {
            Start-Process $dockerDesktop
            Write-Host "Waiting for Docker to start (up to 60s)..." -ForegroundColor Gray
            $waited = 0
            while ($waited -lt 60) {
                Start-Sleep -Seconds 3
                $waited += 3
                try {
                    $null = docker info 2>$null
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "[OK] Docker is now running." -ForegroundColor Green
                        return $true
                    }
                } catch { }
                Write-Host "  Still waiting... ($waited s)" -ForegroundColor Gray
            }
            Write-Host "[ERROR] Docker did not start within 60 seconds." -ForegroundColor Red
        } else {
            Write-Host "[ERROR] Docker Desktop not found. Please start Docker manually." -ForegroundColor Red
        }
    }

    return $false
}

function Start-Containers {
    <#
    .SYNOPSIS
    Runs docker compose up -d, optionally with --force-recreate.
    #>
    param(
        [string]$ComposeFile = "docker-compose.dev.yml",
        [switch]$ForceRecreate
    )

    $dockerArgs = @("compose", "-f", $ComposeFile, "up", "-d")
    if ($ForceRecreate) {
        $dockerArgs += "--force-recreate"
    }

    Write-Host "Starting containers ($ComposeFile)..." -ForegroundColor Yellow
    & docker @dockerArgs
    if ($LASTEXITCODE -ne 0) {
        # docker compose up -d can exit 1 if a healthcheck is still pending (slow build).
        # Warn instead of aborting -- the caller can wait for health separately.
        Write-Host "[WARN] docker compose up exited with code $LASTEXITCODE (some containers may still be starting)." -ForegroundColor Yellow
    } else {
        Write-Host "[OK] Containers started." -ForegroundColor Green
    }
}

function Stop-Containers {
    <#
    .SYNOPSIS
    Runs docker compose down to stop all containers.
    #>
    param(
        [string]$ComposeFile = "docker-compose.dev.yml"
    )

    Write-Host "Stopping containers ($ComposeFile)..." -ForegroundColor Yellow
    & docker compose -f $ComposeFile down
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[WARN] docker compose down exited with code $LASTEXITCODE" -ForegroundColor Yellow
    } else {
        Write-Host "[OK] Containers stopped." -ForegroundColor Green
    }
}

function Restart-Container {
    <#
    .SYNOPSIS
    Restarts a single service by its compose service name.
    #>
    param(
        [string]$ComposeFile = "docker-compose.dev.yml",
        [string]$ServiceName
    )

    Write-Host "Restarting $ServiceName..." -ForegroundColor Yellow
    & docker compose -f $ComposeFile restart $ServiceName
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to restart $ServiceName (exit code $LASTEXITCODE)"
    }
    Write-Host "[OK] $ServiceName restarted." -ForegroundColor Green
}

function Get-ContainerStatus {
    <#
    .SYNOPSIS
    Returns the status of a Docker container: "running", "stopped", "not-found", or raw state string.
    #>
    param(
        [string]$ContainerName
    )

    try {
        $state = docker inspect --format "{{.State.Status}}" $ContainerName 2>$null
        if ($LASTEXITCODE -ne 0 -or -not $state) {
            return "not-found"
        }
        $state = $state.Trim()
        $result = switch ($state) {
            "running" { "running" }
            "exited"  { "stopped" }
            default   { $state }
        }
        return $result
    } catch {
        return "not-found"
    }
}

function Invoke-InContainer {
    <#
    .SYNOPSIS
    Runs a command inside a Docker container via `docker exec`.
    Returns $true on success, $false on failure. Writes output to host.
    Last command output is stored in $global:LastContainerOutput for callers that need it.
    #>
    param(
        [string]$ContainerName,
        [string]$Command,
        [string]$Description = "",
        [switch]$Silent
    )

    if ($Description -and -not $Silent) {
        Write-Host "  $Description..." -ForegroundColor Gray
    }

    $global:LastContainerOutput = $null
    $outputLines = [System.Collections.Generic.List[string]]::new()

    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = "docker"
    $psi.Arguments = "exec $ContainerName sh -c `"$Command`""
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    $proc = [System.Diagnostics.Process]::Start($psi)
    while (-not $proc.StandardOutput.EndOfStream) {
        $line = $proc.StandardOutput.ReadLine()
        $outputLines.Add($line)
        if (-not $Silent) { Write-Host "    $line" -ForegroundColor Gray }
    }
    $errOutput = $proc.StandardError.ReadToEnd()
    if ($errOutput -and -not $Silent) {
        $errOutput -split "`n" | ForEach-Object { if ($_) { Write-Host "    $_" -ForegroundColor Gray } }
    }
    $proc.WaitForExit()
    $exitCode = $proc.ExitCode
    $global:LastContainerOutput = $outputLines -join "`n"

    return ($exitCode -eq 0)
}

# Functions are auto-exported when dot-sourced (Export-ModuleMember removed -- only valid in .psm1)
