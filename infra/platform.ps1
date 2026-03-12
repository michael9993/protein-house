# ============================================================================
# platform.ps1 — Aura E-Commerce Platform CLI
# ============================================================================
# Single entry point for all platform operations.
#
# Usage:
#   .\infra\platform.ps1 <command> [options]
#
# Commands:
#   new-store               Rebrand platform for a new store (wizard)
#   status                  Health dashboard for all services
#   up                      Start platform (Docker + tunnels)
#   down                    Stop platform (containers + tunnels)
#   restart <service|all>   Restart service(s)
#   backup                  Database backup with rotation
#   restore <file>          Restore database from backup file
#   install-apps            Install/reinstall all Saleor apps
#   tunnels                 Start tunnels only (skip Docker)
#   codegen                 Run GraphQL codegen in all containers
#   logs <service>          Tail logs for a service
#   init                    First-time setup checks
#   generate-tunnel-config  Generate cloudflared-config.yml from platform.yml
#   help                    Show this help
#
# Options:
#   -Mode <dev|selfhosted>  Environment mode (default: dev)
#   -Domain <string>        Override domain from platform.yml
#   -SkipTunnel             Skip tunnel startup when running 'up'
#   -SkipDocker             Skip Docker startup when running 'up'
#   -NoBrowser              Don't open browser after 'up'
#   -Compress               Compress backup (overrides platform.yml default)
#   -Retain <int>           Number of backups to keep (default: 30)
#   -Quiet                  Suppress verbose output
#   -Email <string>         Admin email for install-apps
#   -Password <string>      Admin password for install-apps
#   -SkipDelete             Don't delete existing apps before reinstalling
#   -Lines <int>            Number of log lines to tail (default: 100)
# ============================================================================

param(
    [Parameter(Position = 0)]
    [string]$Command = "help",

    [Parameter(Position = 1)]
    [string]$Target = "",

    # Options
    [string]$Mode      = "dev",
    [string]$Domain    = "",
    [switch]$SkipTunnel,
    [switch]$SkipDocker,
    [switch]$NoBrowser,
    [switch]$Compress,
    [int]$Retain       = 0,
    [switch]$Quiet,
    [string]$Email     = "",
    [string]$Password  = "",
    [switch]$SkipDelete,
    [int]$Lines        = 100,

    # New Store options (forwarded to init-new-store.ps1)
    [string]$StoreName     = "",
    [string]$PrimaryColor  = "",
    [string]$Tagline       = "",
    [string]$GtmId         = "",
    [string]$Ga4Id         = ""
)

$ErrorActionPreference = "Stop"
$scriptDir = $PSScriptRoot
$infraDir  = $scriptDir   # platform.ps1 lives inside infra/

# ---------------------------------------------------------------------------
# Load modules
# ---------------------------------------------------------------------------
. "$scriptDir\lib\Config.ps1"
. "$scriptDir\lib\Display.ps1"
. "$scriptDir\lib\Docker.ps1"
. "$scriptDir\lib\Health.ps1"
. "$scriptDir\lib\Tunnels.ps1"
. "$scriptDir\lib\EnvManager.ps1"
. "$scriptDir\lib\Apps.ps1"
. "$scriptDir\lib\Backup.ps1"

# ---------------------------------------------------------------------------
# Load platform config
# ---------------------------------------------------------------------------
$config = Get-PlatformConfig -ConfigPath (Join-Path $scriptDir "platform.yml")
if ($Domain) {
    $config.platform.domain = $Domain
}

$composeFile = Join-Path $scriptDir "docker-compose.dev.yml"
$envFile     = Join-Path $scriptDir ".env"

# ---------------------------------------------------------------------------
# Helper: resolve compose service name for a given service key
# ---------------------------------------------------------------------------
function Resolve-ComposeService {
    param([string]$Key)
    $svc = $config.services[$Key]
    if ($svc -and $svc.compose_service) { return $svc.compose_service }
    # Try direct match as compose service name
    foreach ($k in $config.services.Keys) {
        if ($config.services[$k].compose_service -eq $Key) { return $Key }
    }
    return $Key
}

# ---------------------------------------------------------------------------
# Helper: open browser to storefront + dashboard
# ---------------------------------------------------------------------------
function Open-PlatformBrowser {
    $storefrontUrl = "http://localhost:3000"
    $dashboardUrl  = "http://localhost:9000"

    if ($config.services.storefront.tunnel_env_var) {
        $tu = [System.Environment]::GetEnvironmentVariable($config.services.storefront.tunnel_env_var)
        if ($tu) { $storefrontUrl = $tu }
    }
    if ($config.services.dashboard.tunnel_env_var) {
        $tu = [System.Environment]::GetEnvironmentVariable($config.services.dashboard.tunnel_env_var)
        if ($tu) { $dashboardUrl = $tu }
    }

    Start-Process $storefrontUrl
    Start-Sleep -Seconds 1
    Start-Process $dashboardUrl
}

# ===========================================================================
# Command dispatch
# ===========================================================================
switch ($Command.ToLower()) {

    # =========================================================================
    "status" {
        Write-Banner -Title "Aura Platform Status" -Subtitle $config.platform.name

        # Docker check
        $dockerOk = Test-DockerRunning
        if ($dockerOk) {
            Write-Success "Docker is running"
        } else {
            Write-Err "Docker is NOT running"
        }

        # Service table
        Write-ServiceTable -Services $config.services -Config $config -Mode $Mode

        # Backup info
        $backups = Get-BackupHistory -Config $config
        if ($backups.Count -gt 0) {
            $latest = $backups[0]
            $age    = (Get-Date) - $latest.LastWriteTime
            Write-Info "Latest backup: $($latest.Name) ($([math]::Round($age.TotalHours, 1))h ago)"
        } else {
            Write-Info "No backups found."
        }
    }

    # =========================================================================
    "up" {
        Write-Banner -Title "Starting Aura Platform" -Subtitle "Mode: $Mode"

        $step  = 0
        $total = 5
        if ($SkipDocker)  { $total-- }
        if ($SkipTunnel)  { $total-- }

        # Step 1 — Docker
        if (-not $SkipDocker) {
            $step++
            Write-Step -Current $step -Total $total -Message "Checking Docker"
            if (-not (Test-DockerRunning -AutoStart)) {
                Write-Err "Docker is not running. Aborting."
                exit 1
            }

            # Switch env mode if selfhosted
            if ($Mode -eq "selfhosted") {
                Switch-EnvMode -InfraDir $infraDir -Mode "selfhosted"
            }

            $step++
            Write-Step -Current $step -Total $total -Message "Starting containers"
            Start-Containers -ComposeFile $composeFile

            # Step 3 — Wait for core services
            $step++
            Write-Step -Current $step -Total $total -Message "Waiting for core services"
            $coreOrder = @("postgres", "redis", "api")
            foreach ($svcKey in $coreOrder) {
                $svc = $config.services[$svcKey]
                if ($svc -and $svc.container -and $svc.health_check) {
                    Wait-ForHealthy -ContainerName $svc.container -MaxWaitSeconds 120 | Out-Null
                }
            }
        }

        # Step 4 — Tunnels
        if (-not $SkipTunnel) {
            $step++
            Write-Step -Current $step -Total $total -Message "Starting tunnels (mode: $Mode)"

            try {
                $cf = Find-Cloudflared
            } catch {
                Write-Warn "cloudflared not found — skipping tunnels. Install with: winget install Cloudflare.cloudflared"
                $cf = $null
            }

            if ($cf) {
                if ($Mode -eq "selfhosted") {
                    $tunnelConfig = Join-Path $infraDir "cloudflared-config.yml"
                    if (Test-Path $tunnelConfig) {
                        Start-NamedTunnel -CloudflaredCmd $cf -TunnelConfigPath $tunnelConfig | Out-Null
                    } else {
                        Write-Warn "cloudflared-config.yml not found. Run: platform.ps1 generate-tunnel-config"
                    }
                } else {
                    # Dev mode — ephemeral tunnels for all tunnel-eligible services
                    $tunnelUrls = @{}
                    $tunnelSvcs = Get-TunnelServices -Config $config

                    foreach ($key in $tunnelSvcs.Keys) {
                        $svc    = $tunnelSvcs[$key]
                        $result = Start-EphemeralTunnel -CloudflaredCmd $cf `
                            -Port $svc.port -ServiceName $key

                        if ($result.URL -and $svc.tunnel_env_var) {
                            $tunnelUrls[$svc.tunnel_env_var] = $result.URL
                        }
                    }

                    if ($tunnelUrls.Count -gt 0 -and (Test-Path $envFile)) {
                        Update-TunnelUrls -EnvPath $envFile -TunnelUrls $tunnelUrls
                        Write-Success "Tunnel URLs written to .env"
                    }
                }
            }
        }

        # Step 5 — Done
        $step++
        Write-Step -Current $step -Total $total -Message "Platform ready"
        Write-ServiceTable -Services $config.services -Config $config -Mode $Mode

        if (-not $NoBrowser) {
            Write-Info "Opening browser..."
            Open-PlatformBrowser
        }
    }

    # =========================================================================
    "down" {
        Write-Banner -Title "Stopping Aura Platform"

        Write-Step -Current 1 -Total 2 -Message "Stopping tunnels"
        Stop-AllTunnels

        Write-Step -Current 2 -Total 2 -Message "Stopping containers"
        Stop-Containers -ComposeFile $composeFile

        # Restore dev .env if we were in selfhosted mode
        if ($Mode -eq "selfhosted") {
            Switch-EnvMode -InfraDir $infraDir -Mode "dev"
        }

        Write-Success "Platform stopped."
    }

    # =========================================================================
    "restart" {
        if (-not $Target) {
            Write-Err "Usage: platform.ps1 restart <service|all|apps>"
            Write-Info "Examples:"
            Write-Info "  platform.ps1 restart storefront"
            Write-Info "  platform.ps1 restart all"
            Write-Info "  platform.ps1 restart apps"
            exit 1
        }

        Write-Banner -Title "Restarting: $Target"

        switch ($Target.ToLower()) {
            "all" {
                Stop-Containers -ComposeFile $composeFile
                Start-Containers -ComposeFile $composeFile
            }
            "apps" {
                $appSvcs = Get-SaleorApps -Config $config
                foreach ($key in $appSvcs.Keys) {
                    $composeSvc = $appSvcs[$key].compose_service
                    Restart-Container -ComposeFile $composeFile -ServiceName $composeSvc
                }
            }
            default {
                # Look up by service key or compose_service name
                $svc = $config.services[$Target]
                if ($svc) {
                    Restart-Container -ComposeFile $composeFile -ServiceName $svc.compose_service
                } else {
                    # Try direct compose service name
                    Restart-Container -ComposeFile $composeFile -ServiceName $Target
                }
            }
        }
    }

    # =========================================================================
    "backup" {
        Write-Banner -Title "Database Backup"

        $params = @{ Config = $config }
        if ($Compress)    { $params.Compress = $true }
        if ($Quiet)       { $params.Quiet    = $true }

        # Override retain if specified
        if ($Retain -gt 0) {
            $config.backup.retain = $Retain
        }

        $file = New-DatabaseBackup @params
        Write-Success "Backup saved: $file"
    }

    # =========================================================================
    "restore" {
        if (-not $Target) {
            Write-Err "Usage: platform.ps1 restore <backup-file>"
            Write-Info "Run 'platform.ps1 status' to see backup history."
            exit 1
        }
        Write-Banner -Title "Database Restore"
        Restore-Database -BackupFile $Target
    }

    # =========================================================================
    "install-apps" {
        Write-Banner -Title "Install Saleor Apps"

        if (-not $Email) {
            $Email = Read-Host "Admin email"
        }
        if (-not $Password) {
            $securePass = Read-Host "Admin password" -AsSecureString
            $bstr       = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
            $Password   = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
        }

        $installParams = @{
            Config   = $config
            Email    = $Email
            Password = $Password
            EnvPath  = $envFile
        }
        if ($SkipDelete) { $installParams.SkipDelete = $true }

        Install-AllApps @installParams
    }

    # =========================================================================
    "tunnels" {
        Write-Banner -Title "Starting Tunnels Only"

        try {
            $cf = Find-Cloudflared
        } catch {
            Write-Err $_
            exit 1
        }

        if ($Mode -eq "selfhosted") {
            $tunnelConfig = Join-Path $infraDir "cloudflared-config.yml"
            Start-NamedTunnel -CloudflaredCmd $cf -TunnelConfigPath $tunnelConfig | Out-Null
        } else {
            $tunnelUrls = @{}
            $tunnelSvcs = Get-TunnelServices -Config $config

            foreach ($key in $tunnelSvcs.Keys) {
                $svc    = $tunnelSvcs[$key]
                $result = Start-EphemeralTunnel -CloudflaredCmd $cf `
                    -Port $svc.port -ServiceName $key

                if ($result.URL -and $svc.tunnel_env_var) {
                    $tunnelUrls[$svc.tunnel_env_var] = $result.URL
                }
            }

            if ($tunnelUrls.Count -gt 0 -and (Test-Path $envFile)) {
                Update-TunnelUrls -EnvPath $envFile -TunnelUrls $tunnelUrls
                Write-Success "Tunnel URLs written to .env"
            }
        }
    }

    # =========================================================================
    "codegen" {
        Write-Banner -Title "GraphQL Codegen"

        $sfContainer   = $config.services.storefront.container
        $dashContainer = $config.services.dashboard.container

        Write-Step -Current 1 -Total 2 -Message "Storefront codegen"
        docker exec $sfContainer pnpm generate
        if ($LASTEXITCODE -ne 0) { Write-Warn "Storefront codegen returned errors." }
        else                      { Write-Success "Storefront codegen done." }

        Write-Step -Current 2 -Total 2 -Message "Dashboard codegen"
        docker exec $dashContainer pnpm generate
        if ($LASTEXITCODE -ne 0) { Write-Warn "Dashboard codegen returned errors." }
        else                      { Write-Success "Dashboard codegen done." }
    }

    # =========================================================================
    "logs" {
        if (-not $Target) {
            Write-Err "Usage: platform.ps1 logs <service>"
            Write-Info "Service keys: $($config.services.Keys -join ', ')"
            exit 1
        }

        $svc = $config.services[$Target]
        $composeSvc = if ($svc -and $svc.compose_service) { $svc.compose_service } else { $Target }

        Write-Host "Tailing logs for $composeSvc (last $Lines lines)..." -ForegroundColor Cyan
        & docker compose -f $composeFile logs --tail=$Lines -f $composeSvc
    }

    # =========================================================================
    "init" {
        Write-Banner -Title "First-Time Setup" -Subtitle "Checking prerequisites..."

        $ok = $true

        # Docker
        Write-Host "Checking Docker..." -ForegroundColor Yellow
        if (Get-Command "docker" -ErrorAction SilentlyContinue) {
            Write-Success "docker found"
        } else {
            Write-Err "docker not found. Install Docker Desktop from https://www.docker.com/products/docker-desktop/"
            $ok = $false
        }

        # cloudflared
        Write-Host "Checking cloudflared..." -ForegroundColor Yellow
        try {
            $cf = Find-Cloudflared
            Write-Success "cloudflared found: $cf"
        } catch {
            Write-Warn "cloudflared not found. Install with: winget install Cloudflare.cloudflared"
        }

        # powershell-yaml
        Write-Host "Checking powershell-yaml..." -ForegroundColor Yellow
        if (Get-Module -ListAvailable -Name powershell-yaml) {
            Write-Success "powershell-yaml module available"
        } else {
            Write-Warn "powershell-yaml not found. Installing..."
            try {
                Install-Module powershell-yaml -Scope CurrentUser -Force -AllowClobber
                Write-Success "powershell-yaml installed"
            } catch {
                Write-Err "Failed to install powershell-yaml: $_"
                $ok = $false
            }
        }

        # .env file
        Write-Host "Checking .env file..." -ForegroundColor Yellow
        if (Test-Path $envFile) {
            Write-Success ".env file exists"
        } else {
            $envTemplate = Join-Path $infraDir ".env.example"
            if (Test-Path $envTemplate) {
                Copy-Item $envTemplate $envFile
                Write-Success ".env created from .env.example"
            } else {
                Write-Warn ".env not found and no .env.example template. Run setup-env.ps1 or create manually."
            }
        }

        # Generate RSA key for JWT (if openssl is available)
        Write-Host "Checking RSA key for JWT..." -ForegroundColor Yellow
        $rsaKey = Join-Path $infraDir "rsa_private_key.pem"
        if (Test-Path $rsaKey) {
            Write-Success "RSA key exists: $rsaKey"
        } else {
            if (Get-Command "openssl" -ErrorAction SilentlyContinue) {
                openssl genrsa -out $rsaKey 2048 2>$null
                Write-Success "RSA key generated: $rsaKey"
            } else {
                Write-Warn "openssl not found — cannot generate RSA key. Add it to PATH or generate manually."
            }
        }

        Write-Host ""
        if ($ok) {
            Write-Success "Init complete. Run: platform.ps1 up"
        } else {
            Write-Warn "Some prerequisites are missing. Resolve the errors above before running 'up'."
        }
    }

    # =========================================================================
    "generate-tunnel-config" {
        Write-Banner -Title "Generate Cloudflared Config" `
            -Subtitle "Domain: $($config.platform.domain)"

        $tunnelName = $config.platform.tunnel_name
        $domain     = $config.platform.domain
        $outputPath = Join-Path $infraDir "cloudflared-config.yml"

        # Build ingress rules for all services with a subdomain
        $ingressLines = @()
        $tunnelSvcs   = Get-TunnelServices -Config $config

        # Deterministic order: api, dashboard, storefront first, then apps
        $orderPreference = @("api", "dashboard", "storefront", "stripe", "smtp", "invoices",
                             "control", "newsletter", "analytics", "bulk", "studio", "dropship", "tax")

        $orderedKeys = @()
        foreach ($k in $orderPreference) {
            if ($tunnelSvcs.ContainsKey($k)) { $orderedKeys += $k }
        }
        # Any remaining keys not in preference list
        foreach ($k in $tunnelSvcs.Keys) {
            if ($k -notin $orderedKeys) { $orderedKeys += $k }
        }

        foreach ($key in $orderedKeys) {
            $svc = $tunnelSvcs[$key]
            $ingressLines += "  - hostname: $($svc.subdomain).$domain"
            $ingressLines += "    service: http://localhost:$($svc.port)"
        }

        # Catch-all rule (required by cloudflared)
        $ingressLines += "  - service: http_status:404"

        $yamlContent = @"
# cloudflared-config.yml — Generated by platform.ps1 generate-tunnel-config
# Tunnel: $tunnelName
# Domain: $domain
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
#
# To use:
#   1. Ensure tunnel '$tunnelName' is created: cloudflared tunnel create $tunnelName
#   2. Route DNS:  cloudflared tunnel route dns $tunnelName "*.$domain"
#   3. Start:      cloudflared tunnel --config cloudflared-config.yml run
#   Or use:        platform.ps1 up -Mode selfhosted

tunnel: $tunnelName
# IMPORTANT: Replace <TUNNEL_ID> below with your actual tunnel UUID from 'cloudflared tunnel create'
credentials-file: $($env:USERPROFILE)\.cloudflared\<TUNNEL_ID>.json

ingress:
$($ingressLines -join "`n")
"@

        $yamlContent | Set-Content $outputPath -Encoding UTF8
        Write-Success "Generated: $outputPath"
        Write-Host ""
        Write-Info "Ingress rules:"
        foreach ($key in $orderedKeys) {
            $svc = $tunnelSvcs[$key]
            Write-Info "  $($svc.subdomain).$domain -> localhost:$($svc.port)"
        }
    }

    # =========================================================================
    "new-store" {
        Write-Banner -Title "New Store Setup" -Subtitle "Configure a new store identity"

        # Build params to forward to init-new-store.ps1
        $storeParams = @{}
        if ($StoreName)    { $storeParams.StoreName    = $StoreName }
        if ($PrimaryColor) { $storeParams.PrimaryColor = $PrimaryColor }
        if ($Domain)       { $storeParams.Domain       = $Domain }
        if ($Tagline)      { $storeParams.Tagline      = $Tagline }
        if ($GtmId)        { $storeParams.GtmId        = $GtmId }
        if ($Ga4Id)        { $storeParams.Ga4Id        = $Ga4Id }

        # Run the store wizard
        & "$scriptDir\scripts\init-new-store.ps1" @storeParams

        # Run setup-environment.ps1 if .env doesn't exist
        if (-not (Test-Path $envFile)) {
            $setupScript = Join-Path $scriptDir "scripts\setup-environment.ps1"
            if (Test-Path $setupScript) {
                Write-Step -Current 1 -Total 1 -Message "Setting up environment..."
                & $setupScript
            }
        }

        # Print next steps
        Write-Host ""
        Write-Success "Store configured! Next steps:"
        Write-Info "  1. .\infra\platform.ps1 up              # Start services"
        Write-Info "  2. .\infra\platform.ps1 install-apps     # Install Saleor apps"
        Write-Info "  3. Open http://localhost:3000             # View storefront"
        Write-Host ""
    }

    # =========================================================================
    "help" {
        Write-Host ""
        Write-Host "Aura E-Commerce Platform CLI" -ForegroundColor Cyan
        Write-Host "=============================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Usage: .\infra\platform.ps1 <command> [target] [options]" -ForegroundColor White
        Write-Host ""
        Write-Host "Commands:" -ForegroundColor Yellow
        Write-Host "  new-store                Rebrand platform for a new store (wizard)"
        Write-Host "  status                   Health dashboard for all services"
        Write-Host "  up                       Start platform (Docker + tunnels)"
        Write-Host "  down                     Stop platform (containers + tunnels)"
        Write-Host "  restart <service|all>    Restart specific service, 'all', or 'apps'"
        Write-Host "  backup                   Create database backup with rotation"
        Write-Host "  restore <file>           Restore database from backup file"
        Write-Host "  install-apps             Install/reinstall all Saleor apps"
        Write-Host "  tunnels                  Start tunnels only (skip Docker)"
        Write-Host "  codegen                  Run GraphQL codegen (storefront + dashboard)"
        Write-Host "  logs <service>           Tail logs for a service"
        Write-Host "  init                     First-time setup / prerequisite check"
        Write-Host "  generate-tunnel-config   Generate cloudflared-config.yml from platform.yml"
        Write-Host "  help                     Show this help"
        Write-Host ""
        Write-Host "Options:" -ForegroundColor Yellow
        Write-Host "  -Mode <dev|selfhosted>   Environment mode (default: dev)"
        Write-Host "  -Domain <string>         Override domain from platform.yml"
        Write-Host "  -SkipTunnel              Skip tunnel startup with 'up'"
        Write-Host "  -SkipDocker              Skip Docker startup with 'up'"
        Write-Host "  -NoBrowser               Don't open browser after 'up'"
        Write-Host "  -Compress                Gzip-compress backup"
        Write-Host "  -Retain <int>            Backups to retain (default: 30)"
        Write-Host "  -Quiet                   Suppress verbose output"
        Write-Host "  -Email <string>          Admin email for install-apps"
        Write-Host "  -Password <string>       Admin password for install-apps"
        Write-Host "  -SkipDelete              Skip deleting existing apps before reinstall"
        Write-Host "  -Lines <int>             Log lines to tail (default: 100)"
        Write-Host ""
        Write-Host "Service keys (for restart/logs):" -ForegroundColor Yellow
        $keys = ($config.services.Keys | Sort-Object) -join ", "
        Write-Host "  $keys" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Yellow
        Write-Host "  .\infra\platform.ps1 new-store                                  # Interactive wizard"
        Write-Host "  .\infra\platform.ps1 new-store -StoreName 'Pet Shop' -PrimaryColor '#E11D48'"
        Write-Host "  .\infra\platform.ps1 up"
        Write-Host "  .\infra\platform.ps1 up -Mode selfhosted -SkipTunnel"
        Write-Host "  .\infra\platform.ps1 restart storefront"
        Write-Host "  .\infra\platform.ps1 backup -Compress"
        Write-Host "  .\infra\platform.ps1 restore ~/saleor-backups/saleor-2026-03-12.sql.gz"
        Write-Host "  .\infra\platform.ps1 install-apps -Email admin@example.com"
        Write-Host "  .\infra\platform.ps1 logs api"
        Write-Host "  .\infra\platform.ps1 generate-tunnel-config"
        Write-Host ""
    }

    # =========================================================================
    default {
        Write-Err "Unknown command: '$Command'"
        Write-Host "Run '.\infra\platform.ps1 help' for usage." -ForegroundColor Gray
        exit 1
    }
}
