# ========================================
# Saleor Platform - Self-Hosted Launch Script
# ========================================
# Launches the full Aura E-Commerce Platform via Cloudflare Named Tunnel
# Domain: halacosmetics.org
#
# What this does:
#   1. Verifies Docker Desktop is running
#   2. Switches to self-hosted .env configuration
#   3. Starts all Docker containers
#   4. Waits for core services (DB, Redis, API) to be healthy
#   5. Starts Cloudflare named tunnel
#   6. Prints all service URLs
#   7. Optionally opens dashboard/storefront in browser
#
# Usage:
#   .\infra\scripts\launch-self-hosted.ps1                    # Full launch
#   .\infra\scripts\launch-self-hosted.ps1 -SkipTunnel        # Docker only (no tunnel)
#   .\infra\scripts\launch-self-hosted.ps1 -Ephemeral         # Use ephemeral tunnels instead of named
#   .\infra\scripts\launch-self-hosted.ps1 -NoBrowser         # Don't open browser
#
# Prerequisites:
#   1. Docker Desktop installed and running
#   2. cloudflared installed: winget install Cloudflare.cloudflared
#   3. Named tunnel created: cloudflared tunnel create aura-platform
#   4. DNS CNAME records configured in Cloudflare Dashboard
#   5. infra/.env.self-hosted configured with secrets (SECRET_KEY, RSA_PRIVATE_KEY, etc.)

param(
    [switch]$SkipTunnel,     # Skip starting Cloudflare tunnel
    [switch]$Ephemeral,      # Use ephemeral tunnels instead of named tunnel
    [switch]$NoBrowser,      # Don't open browser after launch
    [switch]$SkipEnvSwap     # Don't swap .env (use current .env as-is)
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$infraDir = Split-Path -Parent $scriptDir
$rootDir = Split-Path -Parent $infraDir
$composeFile = Join-Path $infraDir "docker-compose.dev.yml"
$envFile = Join-Path $infraDir ".env"
$envSelfHosted = Join-Path $infraDir ".env.self-hosted"
$envDevBackup = Join-Path $infraDir ".env.dev-backup"
$tunnelConfig = Join-Path $infraDir "cloudflared-config.yml"

# Service URLs (for display)
$domain = "halacosmetics.org"
$urls = @{
    Storefront          = "https://shop.$domain"
    API                 = "https://api.$domain"
    Dashboard           = "https://dash.$domain"
    "GraphQL Playground"= "https://api.$domain/graphql/"
    "Stripe App"        = "https://stripe.$domain"
    "SMTP App"          = "https://smtp.$domain"
    "Invoice App"       = "https://invoices.$domain"
    "Control App"       = "https://control.$domain"
    "Newsletter App"    = "https://newsletter.$domain"
    "Analytics App"     = "https://analytics.$domain"
    "Bulk Manager App"  = "https://bulk.$domain"
    "Image Studio App"  = "https://studio.$domain"
    "Dropship App"      = "https://dropship.$domain"
}

function Write-Banner {
    Write-Host ""
    Write-Host "  ========================================" -ForegroundColor Cyan
    Write-Host "   Aura E-Commerce Platform" -ForegroundColor White
    Write-Host "   Self-Hosted Launch" -ForegroundColor Green
    Write-Host "   Domain: $domain" -ForegroundColor Yellow
    Write-Host "  ========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-DockerRunning {
    Write-Host "[1/6] Checking Docker Desktop..." -ForegroundColor Cyan
    try {
        $info = docker info 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Docker not responding"
        }
        Write-Host "  Docker Desktop is running" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  Docker Desktop is not running!" -ForegroundColor Red
        Write-Host "  Please start Docker Desktop and try again." -ForegroundColor Yellow

        # Try to start Docker Desktop
        $dockerPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
        if (Test-Path $dockerPath) {
            Write-Host "  Attempting to start Docker Desktop..." -ForegroundColor Yellow
            Start-Process $dockerPath
            Write-Host "  Waiting for Docker to start (this may take 30-60 seconds)..." -ForegroundColor Gray

            $maxWait = 120
            $waited = 0
            while ($waited -lt $maxWait) {
                Start-Sleep -Seconds 5
                $waited += 5
                try {
                    docker info 2>&1 | Out-Null
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "  Docker Desktop started successfully!" -ForegroundColor Green
                        return $true
                    }
                }
                catch {
                    Write-Host "  Still waiting... ($waited/$maxWait seconds)" -ForegroundColor Gray
                }
            }

            Write-Host "  Timed out waiting for Docker Desktop to start." -ForegroundColor Red
        }

        return $false
    }
}

function Switch-EnvToSelfHosted {
    Write-Host "[2/6] Switching to self-hosted environment..." -ForegroundColor Cyan

    if (-not (Test-Path $envSelfHosted)) {
        Write-Host "  .env.self-hosted not found!" -ForegroundColor Red
        Write-Host "  Create it from the template: copy infra/env-template.txt to infra/.env.self-hosted" -ForegroundColor Yellow
        Write-Host "  Or use the provided template at: infra/.env.self-hosted" -ForegroundColor Yellow
        exit 1
    }

    # Validate that critical values have been set (not still placeholder)
    $envContent = Get-Content $envSelfHosted -Raw
    if ($envContent -match "CHANGE-ME") {
        Write-Host "  WARNING: .env.self-hosted contains placeholder values!" -ForegroundColor Yellow
        Write-Host "  Please update these before going live:" -ForegroundColor Yellow

        $placeholders = @()
        foreach ($line in (Get-Content $envSelfHosted)) {
            if ($line -match "CHANGE-ME") {
                $varName = ($line -split "=")[0].Trim()
                $placeholders += "    - $varName"
            }
        }
        $placeholders | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
        Write-Host ""

        $continue = Read-Host "  Continue anyway? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Host "  Aborted. Please update .env.self-hosted first." -ForegroundColor Red
            exit 1
        }
    }

    # Backup current .env (only if it's not already a self-hosted version)
    if (Test-Path $envFile) {
        $currentContent = Get-Content $envFile -Raw -ErrorAction SilentlyContinue
        if ($currentContent -and -not ($currentContent -match "SELF-HOSTED CONFIGURATION")) {
            Copy-Item $envFile $envDevBackup -Force
            Write-Host "  Backed up current .env to .env.dev-backup" -ForegroundColor Gray
        }
    }

    # Copy self-hosted env
    Copy-Item $envSelfHosted $envFile -Force
    Write-Host "  Activated self-hosted configuration" -ForegroundColor Green
}

function Start-DockerContainers {
    Write-Host "[3/6] Starting Docker containers..." -ForegroundColor Cyan

    # Use --force-recreate to ensure containers pick up new env vars
    docker compose -f $composeFile up -d --force-recreate 2>&1 | ForEach-Object {
        if ($_ -match "Started|Created|Running") {
            Write-Host "  $_" -ForegroundColor Gray
        }
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Failed to start containers!" -ForegroundColor Red
        Write-Host "  Check logs: docker compose -f $composeFile logs" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "  All containers started" -ForegroundColor Green
}

function Wait-ForHealthChecks {
    Write-Host "[4/6] Waiting for services to be healthy..." -ForegroundColor Cyan

    $services = @(
        @{Name = "PostgreSQL"; Container = "saleor-postgres-dev"; MaxWait = 30},
        @{Name = "Redis"; Container = "saleor-redis-dev"; MaxWait = 15},
        @{Name = "Saleor API"; Container = "saleor-api-dev"; MaxWait = 300}
    )

    foreach ($svc in $services) {
        Write-Host "  Waiting for $($svc.Name)..." -ForegroundColor Gray -NoNewline
        $waited = 0
        $healthy = $false

        while ($waited -lt $svc.MaxWait) {
            $status = docker inspect --format '{{.State.Health.Status}}' $svc.Container 2>&1

            if ($status -eq "healthy") {
                $healthy = $true
                break
            }

            Start-Sleep -Seconds 5
            $waited += 5
            Write-Host "." -NoNewline -ForegroundColor Gray
        }

        if ($healthy) {
            Write-Host " healthy" -ForegroundColor Green
        }
        else {
            Write-Host " not healthy after $($svc.MaxWait)s" -ForegroundColor Yellow
            Write-Host "    Check logs: docker logs $($svc.Container) --tail 20" -ForegroundColor Gray
        }
    }

    # Wait a moment for other services to start
    Write-Host "  Waiting for remaining services to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 10

    # Quick check on storefront and dashboard
    $otherServices = @("saleor-storefront-dev", "saleor-dashboard-dev")
    foreach ($container in $otherServices) {
        $status = docker inspect --format '{{.State.Status}}' $container 2>&1
        if ($status -eq "running") {
            Write-Host "  $container : running" -ForegroundColor Green
        }
        else {
            Write-Host "  $container : $status" -ForegroundColor Yellow
        }
    }
}

function Start-NamedTunnel {
    Write-Host "[5/6] Starting Cloudflare named tunnel..." -ForegroundColor Cyan

    if (-not (Test-Path $tunnelConfig)) {
        Write-Host "  Tunnel config not found: $tunnelConfig" -ForegroundColor Red
        Write-Host "  Create it from the template and update the tunnel ID." -ForegroundColor Yellow
        return $null
    }

    # Check if cloudflared is installed
    $cloudflaredCmd = $null
    try {
        $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
        if ($cmd) {
            $cloudflaredCmd = "cloudflared"
        }
    }
    catch {}

    if (-not $cloudflaredCmd) {
        # Check common install locations
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
    }

    if (-not $cloudflaredCmd) {
        Write-Host "  cloudflared not found! Install with: winget install Cloudflare.cloudflared" -ForegroundColor Red
        return $null
    }

    # Validate tunnel config doesn't have placeholder
    $configContent = Get-Content $tunnelConfig -Raw
    if ($configContent -match "<TUNNEL_ID>") {
        Write-Host "  Tunnel config still has <TUNNEL_ID> placeholder!" -ForegroundColor Red
        Write-Host "  Run these steps first:" -ForegroundColor Yellow
        Write-Host "    1. cloudflared tunnel login" -ForegroundColor White
        Write-Host "    2. cloudflared tunnel create aura-platform" -ForegroundColor White
        Write-Host "    3. Update the credentials-file path in cloudflared-config.yml" -ForegroundColor White
        return $null
    }

    # Start tunnel in background
    $logFile = Join-Path $env:TEMP "cloudflared-named-tunnel.log"
    $process = Start-Process -FilePath $cloudflaredCmd `
        -ArgumentList "tunnel", "--config", $tunnelConfig, "run" `
        -RedirectStandardError $logFile `
        -PassThru `
        -WindowStyle Hidden

    Write-Host "  Named tunnel started (PID: $($process.Id))" -ForegroundColor Green
    Write-Host "  Log file: $logFile" -ForegroundColor Gray

    # Wait a moment for tunnel to connect
    Start-Sleep -Seconds 5

    # Check if process is still running
    if ($process.HasExited) {
        Write-Host "  Tunnel process exited unexpectedly!" -ForegroundColor Red
        if (Test-Path $logFile) {
            Write-Host "  Last 10 lines of log:" -ForegroundColor Yellow
            Get-Content $logFile -Tail 10 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
        }
        return $null
    }

    Write-Host "  Tunnel connected to Cloudflare edge" -ForegroundColor Green
    return $process
}

function Start-EphemeralTunnels {
    Write-Host "[5/6] Starting ephemeral tunnels (fallback mode)..." -ForegroundColor Cyan
    Write-Host "  Using existing launch-platform.ps1 for ephemeral tunnels" -ForegroundColor Gray

    $launchScript = Join-Path $scriptDir "launch-platform.ps1"
    if (Test-Path $launchScript) {
        & $launchScript
    }
    else {
        Write-Host "  launch-platform.ps1 not found!" -ForegroundColor Red
    }
}

function Show-ServiceUrls {
    Write-Host ""
    Write-Host "  ========================================" -ForegroundColor Cyan
    Write-Host "   All Services Online" -ForegroundColor Green
    Write-Host "  ========================================" -ForegroundColor Cyan
    Write-Host ""

    # Primary URLs
    Write-Host "  Customer Storefront:" -ForegroundColor Yellow
    Write-Host "    $($urls.Storefront)" -ForegroundColor White
    Write-Host ""
    Write-Host "  Admin Dashboard:" -ForegroundColor Yellow
    Write-Host "    $($urls.Dashboard)" -ForegroundColor White
    Write-Host ""
    Write-Host "  GraphQL API:" -ForegroundColor Yellow
    Write-Host "    $($urls.API)/graphql/" -ForegroundColor White
    Write-Host ""

    # App URLs
    Write-Host "  Saleor Apps:" -ForegroundColor Yellow
    $appKeys = @("Stripe App", "SMTP App", "Invoice App", "Control App", "Newsletter App", "Analytics App", "Bulk Manager App", "Image Studio App", "Dropship App")
    foreach ($key in $appKeys) {
        Write-Host "    $($key): $($urls[$key])" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "  ========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Open-Browser {
    if (-not $NoBrowser) {
        Write-Host "[6/6] Opening in browser..." -ForegroundColor Cyan
        Start-Process $urls.Dashboard
        Start-Sleep -Milliseconds 500
        Start-Process $urls.Storefront
        Write-Host "  Opened dashboard and storefront in browser" -ForegroundColor Green
    }
    else {
        Write-Host "[6/6] Skipping browser launch (--NoBrowser flag)" -ForegroundColor Gray
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Banner

# Step 1: Check Docker
if (-not (Test-DockerRunning)) {
    Write-Host "`nAborted: Docker Desktop is required." -ForegroundColor Red
    exit 1
}

# Step 2: Switch to self-hosted env
if (-not $SkipEnvSwap) {
    Switch-EnvToSelfHosted
}
else {
    Write-Host "[2/6] Using current .env (--SkipEnvSwap flag)" -ForegroundColor Gray
}

# Step 3: Start containers
Start-DockerContainers

# Step 4: Wait for health
Wait-ForHealthChecks

# Step 5: Start tunnel
$tunnelProcess = $null
if (-not $SkipTunnel) {
    if ($Ephemeral) {
        Start-EphemeralTunnels
        # Ephemeral mode takes over the process — won't reach here
        exit 0
    }
    else {
        $tunnelProcess = Start-NamedTunnel
    }
}
else {
    Write-Host "[5/6] Skipping tunnel (--SkipTunnel flag)" -ForegroundColor Gray
    Write-Host "  Services available on localhost only" -ForegroundColor Gray
}

# Step 6: Show URLs and open browser
Show-ServiceUrls
Open-Browser

# Keep running and monitor
if ($tunnelProcess) {
    Write-Host "  Platform is running. Press Ctrl+C to stop tunnel." -ForegroundColor Yellow
    Write-Host "  Containers will keep running after tunnel stops." -ForegroundColor Gray
    Write-Host "  To stop everything: .\infra\scripts\stop-self-hosted.ps1" -ForegroundColor Gray
    Write-Host ""

    try {
        while (-not $tunnelProcess.HasExited) {
            Start-Sleep -Seconds 10
        }

        Write-Host ""
        Write-Host "  Tunnel process exited (code: $($tunnelProcess.ExitCode))" -ForegroundColor Yellow
        Write-Host "  Containers are still running on localhost." -ForegroundColor Gray
        Write-Host "  To restart tunnel: cloudflared tunnel --config $tunnelConfig run" -ForegroundColor Gray
    }
    catch {
        # Ctrl+C pressed
        Write-Host ""
        Write-Host "  Stopping tunnel..." -ForegroundColor Yellow
        if (-not $tunnelProcess.HasExited) {
            $tunnelProcess.Kill()
        }
        Write-Host "  Tunnel stopped. Containers still running on localhost." -ForegroundColor Green
    }
}
else {
    Write-Host "  Platform is running on localhost (no tunnel)." -ForegroundColor Yellow
    Write-Host "  To stop: .\infra\scripts\stop-self-hosted.ps1" -ForegroundColor Gray
}
