# ========================================
# Saleor Platform - Self-Hosted Launch Script
# ========================================
# Launches the full Aura E-Commerce Platform via Cloudflare Named Tunnel
# Domain: halacosmetics.org
#
# What this does:
#   1. Verifies Docker Desktop is running
#   2. Switches to self-hosted .env configuration
#   3. Injects all tunnel URLs into .env (so containers know their public URLs)
#   4. Updates vite.config.js with self-hosted dashboard domain
#   5. Starts all Docker containers (with --force-recreate for new env vars)
#   6. Waits for core services (DB, Redis, API) to be healthy
#   7. Checks all app containers are running
#   8. Starts Cloudflare named tunnel
#   9. Runs update-urls-from-tunnels.ps1 if it exists
#  10. Prints all service URLs
#  11. Optionally opens dashboard/storefront in browser
#
# Usage:
#   .\infra\scripts\launch-self-hosted.ps1                    # Full launch
#   .\infra\scripts\launch-self-hosted.ps1 -SkipTunnel        # Docker only (no tunnel)
#   .\infra\scripts\launch-self-hosted.ps1 -Ephemeral         # Use ephemeral tunnels instead of named
#   .\infra\scripts\launch-self-hosted.ps1 -NoBrowser         # Don't open browser
#   .\infra\scripts\launch-self-hosted.ps1 -SkipDocker        # Skip Docker start (containers already running)
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
    [switch]$SkipEnvSwap,    # Don't swap .env (use current .env as-is)
    [switch]$SkipDocker,     # Skip Docker start (assume containers are already running)
    [string]$Domain = ""     # Override domain (default: PLATFORM_DOMAIN env var or halacosmetics.org)
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
$viteConfigFile = Join-Path $rootDir "dashboard\vite.config.js"

# ============================================================================
# DOMAIN & URL CONFIGURATION
# ============================================================================
$domain = if ($Domain) { $Domain } elseif ($env:PLATFORM_DOMAIN) { $env:PLATFORM_DOMAIN } else { "halacosmetics.org" }

# Display URLs (for summary output)
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
    "Tax Manager App"   = "https://tax.$domain"
}

# Tunnel URL env vars — injected into .env so containers know their public URLs
# These are the SAME vars that launch-platform.ps1 captures from ephemeral tunnels
$tunnelEnvVars = @{
    "SALEOR_API_TUNNEL_URL"              = "https://api.$domain"
    "DASHBOARD_TUNNEL_URL"               = "https://dash.$domain"
    "STOREFRONT_TUNNEL_URL"              = "https://shop.$domain"
    "STRIPE_APP_TUNNEL_URL"              = "https://stripe.$domain"
    "SMTP_APP_TUNNEL_URL"                = "https://smtp.$domain"
    "INVOICE_APP_TUNNEL_URL"             = "https://invoices.$domain"
    "STOREFRONT_CONTROL_APP_TUNNEL_URL"  = "https://control.$domain"
    "NEWSLETTER_APP_TUNNEL_URL"          = "https://newsletter.$domain"
    "SALES_ANALYTICS_APP_TUNNEL_URL"     = "https://analytics.$domain"
    "BULK_MANAGER_APP_TUNNEL_URL"        = "https://bulk.$domain"
    "IMAGE_STUDIO_APP_TUNNEL_URL"        = "https://studio.$domain"
    "DROPSHIP_APP_TUNNEL_URL"            = "https://dropship.$domain"
    "TAX_MANAGER_APP_TUNNEL_URL"         = "https://tax.$domain"
}

# Core API URLs that must point to the self-hosted domain
# NOTE: SALEOR_API_URL is intentionally EXCLUDED — it must remain as the Docker
# internal URL (http://saleor-api:8000/graphql/) because containers use it for
# server-side communication (codegen, SSR, etc.). The public domain doesn't
# resolve inside the Docker network.
$coreEnvVars = @{
    "PUBLIC_URL"                   = "https://api.$domain"
    "API_URL"                      = "https://api.$domain/graphql/"
    "VITE_API_URL"                 = "https://api.$domain/graphql/"
    "NEXT_PUBLIC_SALEOR_API_URL"   = "https://api.$domain/graphql/"
    "NEXT_PUBLIC_STOREFRONT_URL"   = "https://shop.$domain"
    # Disable Django SSL redirect — TLS is terminated at Cloudflare tunnel,
    # internal Docker traffic must remain HTTP
    "SECURE_SSL_REDIRECT"          = "False"
}

# All containers to check status (beyond the core health-checked ones)
$appContainers = @(
    @{Name = "Storefront";          Container = "saleor-storefront-dev"},
    @{Name = "Dashboard";           Container = "saleor-dashboard-dev"},
    @{Name = "Worker";              Container = "saleor-worker-dev"},
    @{Name = "Scheduler";           Container = "saleor-scheduler-dev"},
    @{Name = "Stripe App";          Container = "saleor-stripe-app-dev"},
    @{Name = "SMTP App";            Container = "saleor-smtp-app-dev"},
    @{Name = "Invoice App";         Container = "saleor-invoice-app-dev"},
    @{Name = "Storefront Control";  Container = "saleor-storefront-control-app-dev"},
    @{Name = "Newsletter App";      Container = "saleor-newsletter-app-dev"},
    @{Name = "Analytics App";       Container = "saleor-sales-analytics-app-dev"},
    @{Name = "Bulk Manager";        Container = "saleor-bulk-manager-app-dev"},
    @{Name = "Image Studio";        Container = "saleor-image-studio-app-dev"},
    @{Name = "Dropship App";        Container = "saleor-dropship-app-dev"},
    @{Name = "Tax Manager App";    Container = "saleor-tax-manager-app-dev"}
)

# ============================================================================
# FUNCTIONS
# ============================================================================

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
    Write-Host "[1/8] Checking Docker Desktop..." -ForegroundColor Cyan
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
    Write-Host "[2/8] Switching to self-hosted environment..." -ForegroundColor Cyan

    if (-not (Test-Path $envSelfHosted)) {
        Write-Host "  .env.self-hosted not found!" -ForegroundColor Red
        Write-Host "  Create it from the template: copy infra/env-template.txt to infra/.env.self-hosted" -ForegroundColor Yellow
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

function Update-EnvWithTunnelUrls {
    Write-Host "[3/8] Injecting tunnel URLs into .env..." -ForegroundColor Cyan

    if (-not (Test-Path $envFile)) {
        Write-Host "  .env file not found — skipping URL injection" -ForegroundColor Yellow
        return
    }

    $envContent = Get-Content $envFile -Raw -ErrorAction SilentlyContinue
    if (-not $envContent) {
        Write-Host "  .env file is empty — skipping URL injection" -ForegroundColor Yellow
        return
    }

    $updated = 0
    $added = 0

    # Inject tunnel URL env vars (same ones launch-platform.ps1 captures)
    foreach ($envVar in $tunnelEnvVars.Keys) {
        $url = $tunnelEnvVars[$envVar]
        if ($envContent -match "$envVar=(.+?)(?:\r?\n|$)") {
            $envContent = $envContent -replace "$envVar=.*", "$envVar=$url"
            $updated++
        }
        else {
            $envContent += "`n$envVar=$url"
            $added++
        }
    }

    # Inject core API URLs
    foreach ($envVar in $coreEnvVars.Keys) {
        $url = $coreEnvVars[$envVar]
        if ($envContent -match "$envVar=(.+?)(?:\r?\n|$)") {
            $envContent = $envContent -replace "$envVar=.*", "$envVar=$url"
            $updated++
        }
        else {
            $envContent += "`n$envVar=$url"
            $added++
        }
    }

    # Ensure ALLOWED_HOSTS includes the domain
    if ($envContent -match "ALLOWED_HOSTS=(.+?)(?:\r?\n|$)") {
        $currentHosts = $Matches[1]
        if ($currentHosts -notmatch [regex]::Escape($domain)) {
            $newHosts = "$currentHosts,$domain,*.$domain"
            $envContent = $envContent -replace "ALLOWED_HOSTS=.*", "ALLOWED_HOSTS=$newHosts"
            $updated++
        }
    }

    # Ensure ALLOWED_CLIENT_HOSTS includes the self-hosted frontends
    if ($envContent -match "ALLOWED_CLIENT_HOSTS=(.+?)(?:\r?\n|$)") {
        $currentClientHosts = $Matches[1]
        $selfHostedHosts = "shop.$domain,dash.$domain,stripe.$domain,smtp.$domain,invoices.$domain,control.$domain,newsletter.$domain,analytics.$domain,bulk.$domain,studio.$domain,dropship.$domain,tax.$domain"
        if ($currentClientHosts -notmatch [regex]::Escape("shop.$domain")) {
            $newClientHosts = "$currentClientHosts,$selfHostedHosts"
            $envContent = $envContent -replace "ALLOWED_CLIENT_HOSTS=.*", "ALLOWED_CLIENT_HOSTS=$newClientHosts"
            $updated++
        }
    }

    # Ensure ALLOWED_GRAPHQL_ORIGINS includes the self-hosted URLs
    if ($envContent -match "ALLOWED_GRAPHQL_ORIGINS=(.+?)(?:\r?\n|$)") {
        $currentOrigins = $Matches[1]
        if ($currentOrigins -ne "*" -and $currentOrigins -notmatch [regex]::Escape("shop.$domain")) {
            $newOrigins = "$currentOrigins,https://shop.$domain,https://dash.$domain"
            $envContent = $envContent -replace "ALLOWED_GRAPHQL_ORIGINS=.*", "ALLOWED_GRAPHQL_ORIGINS=$newOrigins"
            $updated++
        }
    }

    $envContent | Set-Content $envFile -Encoding utf8
    Write-Host "  Updated $updated existing vars, added $added new vars" -ForegroundColor Green

    # Also update .env.self-hosted with the same tunnel URLs (keep in sync)
    if (Test-Path $envSelfHosted) {
        $selfHostedContent = Get-Content $envSelfHosted -Raw -ErrorAction SilentlyContinue
        if ($selfHostedContent) {
            foreach ($envVar in $tunnelEnvVars.Keys) {
                $url = $tunnelEnvVars[$envVar]
                if ($selfHostedContent -match "$envVar=(.+?)(?:\r?\n|$)") {
                    $selfHostedContent = $selfHostedContent -replace "$envVar=.*", "$envVar=$url"
                }
                else {
                    $selfHostedContent += "`n$envVar=$url"
                }
            }
            $selfHostedContent | Set-Content $envSelfHosted -Encoding utf8
            Write-Host "  Also synced tunnel URLs to .env.self-hosted" -ForegroundColor Gray
        }
    }
}

function Update-ViteConfig {
    Write-Host "[4/8] Updating vite.config.js with self-hosted domain..." -ForegroundColor Cyan

    if (-not (Test-Path $viteConfigFile)) {
        Write-Host "  vite.config.js not found — skipping" -ForegroundColor Yellow
        return
    }

    $dashboardDomain = "dash.$domain"
    $viteContent = Get-Content $viteConfigFile -Raw

    # Check if the self-hosted domain already exists
    if ($viteContent -match [regex]::Escape($dashboardDomain)) {
        Write-Host "  Domain '$dashboardDomain' already in vite.config.js" -ForegroundColor Gray
        return
    }

    # Replace ALL .trycloudflare.com domains with the self-hosted domain
    $trycloudflareMatches = [regex]::Matches($viteContent, '["\x27][a-z0-9-]+\.trycloudflare\.com["\x27]')

    if ($trycloudflareMatches.Count -gt 0) {
        $viteContent = [regex]::Replace($viteContent, '(["\x27])[a-z0-9-]+\.trycloudflare\.com(["\x27])', "`$1$dashboardDomain`$2")
        Write-Host "  Replaced $($trycloudflareMatches.Count) tunnel domain(s) with: $dashboardDomain" -ForegroundColor Green
    }
    else {
        # No existing tunnel domains — try to add to server allowedHosts
        if ($viteContent -match '(allowedHosts:\s*isDev\s*\?[\s\S]*?\[[\s\S]*?)(\s+)(// Add more tunnel domains)') {
            $viteContent = $viteContent -replace '(allowedHosts:\s*isDev\s*\?[\s\S]*?\[[\s\S]*?)(\s+)(// Add more tunnel domains)', "`$1`$2`"$dashboardDomain`",`n`$2`$3"
            Write-Host "  Added $dashboardDomain to server.allowedHosts" -ForegroundColor Green
        }
        else {
            Write-Host "  Could not auto-update allowedHosts — add '$dashboardDomain' manually" -ForegroundColor Yellow
        }
    }

    $viteContent | Set-Content $viteConfigFile -Encoding utf8
    Write-Host "  vite.config.js updated" -ForegroundColor Green
}

function Start-DockerContainers {
    Write-Host "[5/8] Starting Docker containers..." -ForegroundColor Cyan

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
    Write-Host "[6/8] Waiting for core services to be healthy..." -ForegroundColor Cyan

    $healthServices = @(
        @{Name = "PostgreSQL"; Container = "saleor-postgres-dev"; MaxWait = 30},
        @{Name = "Redis"; Container = "saleor-redis-dev"; MaxWait = 15},
        @{Name = "Saleor API"; Container = "saleor-api-dev"; MaxWait = 300}
    )

    foreach ($svc in $healthServices) {
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

    # Wait a moment for app services to initialize
    Write-Host "  Waiting for app services to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 10

    # Check ALL containers (storefront, dashboard, worker, scheduler, all apps)
    Write-Host "`n  Container Status:" -ForegroundColor Cyan
    $runningCount = 0
    $totalCount = $appContainers.Count

    foreach ($svc in $appContainers) {
        $status = docker inspect --format '{{.State.Status}}' $svc.Container 2>&1
        if ($status -eq "running") {
            Write-Host "    $($svc.Name): running" -ForegroundColor Green
            $runningCount++
        }
        elseif ($LASTEXITCODE -ne 0) {
            Write-Host "    $($svc.Name): not found" -ForegroundColor Red
        }
        else {
            Write-Host "    $($svc.Name): $status" -ForegroundColor Yellow
        }
    }

    Write-Host "`n  $runningCount/$totalCount containers running" -ForegroundColor $(if ($runningCount -eq $totalCount) { "Green" } else { "Yellow" })
}

function Start-NamedTunnel {
    Write-Host "[7/8] Starting Cloudflare named tunnel..." -ForegroundColor Cyan

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

        # Check WinGet packages location
        if (-not $cloudflaredCmd) {
            $wingetPath = "${env:LOCALAPPDATA}\Microsoft\WinGet\Packages"
            if (Test-Path $wingetPath) {
                $cloudflaredDirs = Get-ChildItem -Path $wingetPath -Filter "Cloudflare.cloudflared_*" -Directory -ErrorAction SilentlyContinue
                foreach ($dir in $cloudflaredDirs) {
                    $exePath = Join-Path $dir.FullName "cloudflared.exe"
                    if (Test-Path $exePath) {
                        $cloudflaredCmd = $exePath
                        break
                    }
                }
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
    Write-Host "[7/8] Starting ephemeral tunnels (fallback mode)..." -ForegroundColor Cyan
    Write-Host "  Using existing launch-platform.ps1 for ephemeral tunnels" -ForegroundColor Gray

    $launchScript = Join-Path $scriptDir "launch-platform.ps1"
    if (Test-Path $launchScript) {
        & $launchScript
    }
    else {
        Write-Host "  launch-platform.ps1 not found!" -ForegroundColor Red
    }
}

function Invoke-UrlUpdateScript {
    # Run update-urls-from-tunnels.ps1 if it exists (propagates URLs to other config files)
    $updateScript = Join-Path $infraDir "update-urls-from-tunnels.ps1"
    if (Test-Path $updateScript) {
        Write-Host "`n  Running update-urls-from-tunnels.ps1..." -ForegroundColor Gray
        try {
            & $updateScript
            Write-Host "  URL propagation complete" -ForegroundColor Green
        }
        catch {
            Write-Host "  Warning: update-urls-from-tunnels.ps1 failed: $_" -ForegroundColor Yellow
        }
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
        Write-Host "[8/8] Opening in browser..." -ForegroundColor Cyan
        Start-Process $urls.Dashboard
        Start-Sleep -Milliseconds 500
        Start-Process $urls.Storefront
        Write-Host "  Opened dashboard and storefront in browser" -ForegroundColor Green
    }
    else {
        Write-Host "[8/8] Skipping browser launch (--NoBrowser flag)" -ForegroundColor Gray
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
    Write-Host "[2/8] Using current .env (--SkipEnvSwap flag)" -ForegroundColor Gray
}

# Step 3: Inject tunnel URLs into .env (BEFORE starting containers)
Update-EnvWithTunnelUrls

# Step 4: Update vite.config.js with self-hosted dashboard domain
Update-ViteConfig

# Step 5: Start containers (with new env vars)
if (-not $SkipDocker) {
    Start-DockerContainers
}
else {
    Write-Host "[5/8] Skipping Docker start (--SkipDocker flag)" -ForegroundColor Gray
}

# Step 6: Wait for health
Wait-ForHealthChecks

# Step 7: Start tunnel
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
    Write-Host "[7/8] Skipping tunnel (--SkipTunnel flag)" -ForegroundColor Gray
    Write-Host "  Services available on localhost only" -ForegroundColor Gray
}

# Run URL update script if it exists
Invoke-UrlUpdateScript

# Step 8: Show URLs and open browser
Show-ServiceUrls
Open-Browser

# Keep running and monitor
if ($tunnelProcess) {
    Write-Host "  Platform is running. Press Ctrl+C to stop tunnel." -ForegroundColor Yellow
    Write-Host "  Containers will keep running after tunnel stops." -ForegroundColor Gray
    Write-Host "  To stop everything: docker compose -f $composeFile down" -ForegroundColor Gray
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
    Write-Host "  To stop: docker compose -f $composeFile down" -ForegroundColor Gray
}
