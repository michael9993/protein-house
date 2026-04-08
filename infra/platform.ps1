# ============================================================================
# platform.ps1 -- Aura E-Commerce Platform CLI
# ============================================================================
# Single entry point for all platform operations.
#
# Usage:
#   .\infra\platform.ps1 <command> [options]
#
# Commands:
#   setup                   Full guided setup (init + new-store + db-init + install-apps)
#   new-store               Rebrand platform for a new store (wizard)
#   status                  Health dashboard for all services
#   up                      Start platform (Docker + tunnels)
#   down                    Stop platform (containers + tunnels)
#   restart <service|all>   Restart service(s)
#   backup                  Database backup with rotation
#   restore <file>          Restore database from backup file
#   install-apps            Install/reinstall all Saleor apps
#   db-init                 Initialize database (migrate + admin user + schema)
#   tunnels                 Start tunnels only (skip Docker)
#   codegen                 Run GraphQL codegen in all containers
#   logs <service>          Tail logs for a service
#   init                    First-time setup (prereqs + .env + secrets)
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
    [string]$Mode = "dev",
    [string]$Domain = "",
    [switch]$SkipTunnel,
    [switch]$SkipDocker,
    [switch]$NoBrowser,
    [switch]$Compress,
    [int]$Retain = 0,
    [switch]$Quiet,
    [string]$Email = "",
    [string]$Password = "",
    [switch]$SkipDelete,
    [string[]]$Exclude = @(),
    [string[]]$Include = @(),
    [int]$Lines = 100,
    [switch]$SkipDbInit,
    [switch]$SeedData,
    [switch]$NonInteractive,
    [switch]$Reset,
    [string]$Profile = "dev",

    # New Store options (forwarded to init-new-store.ps1)
    [string]$StoreName = "",
    [string]$PrimaryColor = "",
    [string]$Tagline = "",
    [string]$GtmId = "",
    [string]$Ga4Id = ""
)

$ErrorActionPreference = "Stop"
$scriptDir = $PSScriptRoot
$infraDir = $scriptDir   # platform.ps1 lives inside infra/

# ---------------------------------------------------------------------------
# Load modules (validate all exist before loading)
# ---------------------------------------------------------------------------
$requiredLibs = @("Config", "Display", "Docker", "Health", "Tunnels", "EnvManager", "Apps", "Backup")
foreach ($lib in $requiredLibs) {
    $libPath = Join-Path $scriptDir "lib\$lib.ps1"
    if (-not (Test-Path $libPath)) {
        Write-Host "[ERROR] Missing library: lib/$lib.ps1" -ForegroundColor Red
        Write-Host "  The platform CLI is incomplete. Re-clone the repository or check your installation." -ForegroundColor Gray
        exit 1
    }
}

. "$scriptDir\lib\Config.ps1"
. "$scriptDir\lib\Display.ps1"
. "$scriptDir\lib\Docker.ps1"
. "$scriptDir\lib\Health.ps1"
. "$scriptDir\lib\Tunnels.ps1"
. "$scriptDir\lib\EnvManager.ps1"
. "$scriptDir\lib\Apps.ps1"
. "$scriptDir\lib\Backup.ps1"
. "$scriptDir\lib\Ports.ps1"

# ---------------------------------------------------------------------------
# Load platform config
# ---------------------------------------------------------------------------
$config = Get-PlatformConfig -ConfigPath (Join-Path $scriptDir "platform.yml")
if ($Domain) {
    $config.platform.domain = $Domain
}

$composeFile = if ($Profile -eq "prod") {
    Join-Path $scriptDir "docker-compose.prod.yml"
}
else {
    Join-Path $scriptDir "docker-compose.dev.yml"
}
$envFile = Join-Path $scriptDir ".env"

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
    $storefrontUrl = "http://localhost:3100"
    $dashboardUrl = "http://localhost:9100"

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
    "setup" {
        Write-Banner -Title "Aura Platform Setup" `
            -Subtitle "Full guided setup for a new project"

        # Graceful cancellation — don't mark incomplete steps as done
        $setupCancelled = $false
        $null = Register-EngineEvent -SourceIdentifier "PowerShell.Exiting" -Action {
            $script:setupCancelled = $true
        } -SupportEvent 2>$null
        trap {
            Write-Host ""
            Write-Warn "Setup interrupted. Progress has been saved — re-run 'platform.ps1 setup' to continue."
            break
        }

        # Reset state if requested
        if ($Reset) {
            Reset-SetupState -InfraDir $infraDir
            Write-Info "Setup state cleared. Starting fresh."
        }

        $setupSteps = @("init", "port_check", "new_store", "docker_up", "db_init", "tunnels", "apps_installed")
        $totalSetupSteps = $setupSteps.Count
        $currentSetupStep = 0

        # ---- Step 1: Init (prereqs + .env + secrets) ----
        $currentSetupStep++
        if (Test-SetupStep -InfraDir $infraDir -Step "init") {
            Write-Step -Current $currentSetupStep -Total $totalSetupSteps -Message "Prerequisites (already done)"
            Write-Success "Skipping init (already completed)"
        }
        else {
            Write-Step -Current $currentSetupStep -Total $totalSetupSteps -Message "Checking prerequisites & creating .env"
            # Delegate to init command logic by re-invoking
            & $PSCommandPath init
            Set-SetupState -InfraDir $infraDir -Step "init"
        }

        # ---- Step 2: Port allocation & instance detection ----
        $currentSetupStep++
        Write-Step -Current $currentSetupStep -Total $totalSetupSteps -Message "Checking port availability"

        # Warn about existing Aura instances
        Show-ExistingInstances

        # Find free port block
        $allocatedPorts = Find-FreePorts
        Show-PortTable -Ports $allocatedPorts

        if (-not $NonInteractive) {
            $confirmPorts = Read-Host "  Use these ports? (y/n, default: y)"
            if ($confirmPorts -match "^n") {
                $customOffset = Read-Host "  Enter port offset (e.g. 100, 200, 300)"
                if ($customOffset -match '^\d+$') {
                    $allocatedPorts = Find-FreePorts -StartOffset ([int]$customOffset)
                    Show-PortTable -Ports $allocatedPorts
                }
            }
        }

        # Write allocated ports to .env if they differ from defaults
        $portsChanged = $false
        foreach ($key in $allocatedPorts.Keys) {
            $currentVal = Get-EnvValue -Path $envFile -Key $key
            $newVal = "$($allocatedPorts[$key])"
            if ($currentVal -ne $newVal) {
                Set-EnvValue -Path $envFile -Key $key -Value $newVal
                $portsChanged = $true
            }
        }
        if ($portsChanged) {
            Write-Success "Port assignments saved to .env"
        }
        else {
            Write-Success "Ports are using defaults (all free)"
        }

        # Update all URL-based env vars to use the actual allocated ports
        $apiPort = $allocatedPorts["AURA_API_PORT"]
        $dashPort = $allocatedPorts["DASHBOARD_PORT"]
        $sfPort = $allocatedPorts["STOREFRONT_PORT"]
        $smtpPort = $allocatedPorts["SMTP_APP_PORT"]
        $stripePort = $allocatedPorts["STRIPE_APP_PORT"]
        $invoicePort = $allocatedPorts["INVOICE_APP_PORT"]
        $controlPort = $allocatedPorts["STOREFRONT_CONTROL_APP_PORT"]
        $newsletterPort = $allocatedPorts["NEWSLETTER_APP_PORT"]
        $analyticsPort = $allocatedPorts["SALES_ANALYTICS_APP_PORT"]
        $bulkPort = $allocatedPorts["BULK_MANAGER_APP_PORT"]
        $studioPort = $allocatedPorts["IMAGE_STUDIO_APP_PORT"]
        $dropshipPort = $allocatedPorts["DROPSHIP_APP_PORT"]
        $taxPort = $allocatedPorts["TAX_MANAGER_APP_PORT"]
        $paypalPort = $allocatedPorts["PAYPAL_APP_PORT"]

        # Core URLs
        Set-EnvValue -Path $envFile -Key "NEXT_PUBLIC_AURA_API_URL" -Value "http://localhost:$apiPort/graphql/"
        Set-EnvValue -Path $envFile -Key "NEXT_PUBLIC_AURA_HOST_URL" -Value "http://localhost:$apiPort"
        Set-EnvValue -Path $envFile -Key "NEXT_PUBLIC_STOREFRONT_URL" -Value "http://localhost:$sfPort"
        Set-EnvValue -Path $envFile -Key "PUBLIC_URL" -Value "http://localhost:$apiPort"
        Set-EnvValue -Path $envFile -Key "AURA_API_URL" -Value "http://localhost:$apiPort/graphql/"
        Set-EnvValue -Path $envFile -Key "DASHBOARD_URL" -Value "http://localhost:$dashPort"
        Set-EnvValue -Path $envFile -Key "STOREFRONT_URL" -Value "http://localhost:$sfPort"

        # Dashboard build-time vars
        Set-EnvValue -Path $envFile -Key "API_URL" -Value "http://localhost:$apiPort/graphql/"
        Set-EnvValue -Path $envFile -Key "VITE_API_URL" -Value "http://localhost:$apiPort/graphql/"

        # ALLOWED_CLIENT_HOSTS with correct ports
        Set-EnvValue -Path $envFile -Key "ALLOWED_CLIENT_HOSTS" -Value "localhost:$sfPort,localhost:$dashPort,127.0.0.1:$dashPort"
        Set-EnvValue -Path $envFile -Key "ALLOWED_GRAPHQL_ORIGINS" -Value "http://localhost:$sfPort,http://localhost:$dashPort"
        Set-EnvValue -Path $envFile -Key "CSRF_TRUSTED_ORIGINS" -Value "http://localhost:$sfPort,http://localhost:$dashPort"

        Write-Success "URLs updated to match allocated ports"

        # ---- Step 3: New Store wizard ----
        $currentSetupStep++
        if (Test-SetupStep -InfraDir $infraDir -Step "new_store") {
            Write-Step -Current $currentSetupStep -Total $totalSetupSteps -Message "Store branding (already done)"
            Write-Success "Skipping new-store (already completed)"
        }
        else {
            Write-Step -Current $currentSetupStep -Total $totalSetupSteps -Message "Configuring store brand"
            # Build forwarded params
            $storeParams = @{}
            if ($StoreName) { $storeParams.StoreName = $StoreName }
            if ($PrimaryColor) { $storeParams.PrimaryColor = $PrimaryColor }
            if ($Domain) { $storeParams.Domain = $Domain }
            if ($Tagline) { $storeParams.Tagline = $Tagline }
            if ($GtmId) { $storeParams.GtmId = $GtmId }
            if ($Ga4Id) { $storeParams.Ga4Id = $Ga4Id }

            if ($NonInteractive -and -not $StoreName) {
                Write-Info "Non-interactive mode: using default store name 'My Store'"
                $storeParams.StoreName = "My Store"
            }

            & "$scriptDir\scripts\init-new-store.ps1" @storeParams
            Set-SetupState -InfraDir $infraDir -Step "new_store"
        }

        # ---- Step 3: Docker up ----
        $currentSetupStep++
        Write-Step -Current $currentSetupStep -Total $totalSetupSteps -Message "Starting Docker containers"

        if (-not (Test-DockerRunning -AutoStart)) {
            Write-Err "Docker is not running. Please start Docker Desktop and re-run setup."
            exit 1
        }

        # Switch env mode if selfhosted
        if ($Mode -eq "selfhosted") {
            Switch-EnvMode -InfraDir $infraDir -Mode "selfhosted"
        }

        Start-Containers -ComposeFile $composeFile

        # Wait for core services
        Write-Info "Waiting for core services (postgres, redis, api)..."
        $coreOrder = @("postgres", "redis", "api")
        foreach ($svcKey in $coreOrder) {
            $svc = $config.services[$svcKey]
            if ($svc -and $svc.container -and $svc.health_check) {
                $healthy = Wait-ForHealthy -ContainerName $svc.container -MaxWaitSeconds 180
                if (-not $healthy) {
                    Write-Err "$svcKey ($($svc.container)) did not become healthy within 180s."
                    Write-Info "Check logs: docker compose -f $composeFile logs $($svc.compose_service)"
                    exit 1
                }
                Write-Success "$svcKey is healthy"
            }
        }
        Set-SetupState -InfraDir $infraDir -Step "docker_up"

        # ---- Step 4: Database initialization ----
        $currentSetupStep++
        if (Test-SetupStep -InfraDir $infraDir -Step "db_init") {
            Write-Step -Current $currentSetupStep -Total $totalSetupSteps -Message "Database (already initialized)"
            Write-Success "Skipping db-init (already completed)"
        }
        else {
            Write-Step -Current $currentSetupStep -Total $totalSetupSteps -Message "Initializing database"
            & $PSCommandPath db-init -Email $Email -Password $Password
            Set-SetupState -InfraDir $infraDir -Step "db_init"
        }

        # ---- Step 5: Tunnels ----
        $currentSetupStep++
        if (-not $SkipTunnel) {
            Write-Step -Current $currentSetupStep -Total $totalSetupSteps -Message "Starting tunnels (mode: $Mode)"

            try {
                $cf = Find-Cloudflared
            }
            catch {
                Write-Warn "cloudflared not found -- skipping tunnels"
                $cf = $null
            }

            if ($cf) {
                # Determine tunnel mode: custom domain → named tunnel, no domain → ephemeral
                $hasDomain = $config.platform.domain -and $config.platform.domain -ne "" -and $config.platform.domain -ne "__SET_BY_WIZARD__"
                $useNamedTunnel = $hasDomain -or ($Mode -eq "selfhosted")

                if ($useNamedTunnel) {
                    $tunnelConfig = Join-Path $infraDir "cloudflared-config.yml"
                    if (Test-Path $tunnelConfig) {
                        Start-NamedTunnel -CloudflaredCmd $cf -TunnelConfigPath $tunnelConfig | Out-Null
                    }
                    else {
                        Write-Warn "Domain '$($config.platform.domain)' configured but cloudflared-config.yml not found."
                        Write-Warn "Run: platform.ps1 generate-tunnel-config"
                        Write-Warn "Skipping tunnels — your store will only be accessible via localhost."
                    }
                }
                else {
                    $tunnelUrls = @{}
                    $tunnelSvcs = Get-TunnelServices -Config $config

                    foreach ($key in $tunnelSvcs.Keys) {
                        $svc = $tunnelSvcs[$key]
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
            Set-SetupState -InfraDir $infraDir -Step "tunnels"
        }
        else {
            Write-Step -Current $currentSetupStep -Total $totalSetupSteps -Message "Tunnels (skipped)"
        }

        # ---- Step 6: Install Saleor Apps ----
        $currentSetupStep++
        if (Test-SetupStep -InfraDir $infraDir -Step "apps_installed") {
            Write-Step -Current $currentSetupStep -Total $totalSetupSteps -Message "Saleor apps (already installed)"
            Write-Success "Skipping app install (already completed)"
        }
        else {
            Write-Step -Current $currentSetupStep -Total $totalSetupSteps -Message "Installing Saleor apps"

            # Read admin credentials from .env for app install
            $appEmail = if ($Email) { $Email } else { Get-EnvValue -Path $envFile -Key "AURA_ADMIN_EMAIL" }
            $appPass = if ($Password) { $Password } else { Get-EnvValue -Path $envFile -Key "AURA_ADMIN_PASSWORD" }

            if ($appEmail -and $appPass) {
                & $PSCommandPath install-apps -Email $appEmail -Password $appPass
                Set-SetupState -InfraDir $infraDir -Step "apps_installed"
            }
            else {
                Write-Warn "No admin credentials found. Run 'platform.ps1 install-apps -Email <email> -Password <pass>' manually."
            }
        }

        # ================================================================
        # POST-INSTALL CONFIGURATION (interactive prompts)
        # ================================================================
        Write-Host ""
        Write-Banner -Title "Post-Install Configuration" `
            -Subtitle "Let's configure your store services"

        # ---- Payment: Stripe ----
        Write-Host ""
        Write-Host "  PAYMENT PROCESSING (Stripe)" -ForegroundColor Cyan
        Write-Host "  Stripe handles credit/debit card payments." -ForegroundColor Gray
        $currentStripeKey = Get-EnvValue -Path $envFile -Key "STRIPE_SECRET_KEY"
        if ($currentStripeKey) {
            Write-Success "Stripe keys already configured"
        }
        elseif ($NonInteractive) {
            Write-Info "Skipping Stripe (non-interactive mode). Configure later in infra/.env"
        }
        else {
            $setupStripe = Read-Host "  Do you have Stripe API keys? (y/n, default: n)"
            if ($setupStripe -match "^y") {
                Write-Info "  Get test keys from: https://dashboard.stripe.com/test/apikeys"
                $pk = Read-Host "  Publishable Key (pk_test_...)"
                $sk = Read-Host "  Secret Key (sk_test_...)"
                $wh = Read-Host "  Webhook Secret (whsec_..., press Enter to skip)"
                if ($pk) { Set-EnvValue -Path $envFile -Key "STRIPE_PUBLISHABLE_KEY" -Value $pk }
                if ($sk) { Set-EnvValue -Path $envFile -Key "STRIPE_SECRET_KEY" -Value $sk }
                if ($wh) { Set-EnvValue -Path $envFile -Key "STRIPE_WEBHOOK_SECRET" -Value $wh }
                Write-Success "Stripe keys saved to .env"
                Write-Info "  Restart Stripe app after setup: platform.ps1 restart aura-stripe-app"
            }
            else {
                Write-Info "  Skipped. Add keys to infra/.env later (STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY)"
            }
        }

        # ---- Payment: PayPal ----
        Write-Host ""
        Write-Host "  PAYMENT PROCESSING (PayPal)" -ForegroundColor Cyan
        Write-Host "  PayPal handles PayPal wallet + card payments." -ForegroundColor Gray
        if ($NonInteractive) {
            Write-Info "Skipping PayPal (non-interactive mode)"
        }
        else {
            $setupPaypal = Read-Host "  Do you have PayPal API credentials? (y/n, default: n)"
            if ($setupPaypal -match "^y") {
                Write-Info "  PayPal uses file-based config. See: apps/apps/paypal/README.md"
                Write-Info "  Configure in Dashboard > Apps > PayPal after setup"
            }
            else {
                Write-Info "  Skipped. Configure later via Dashboard > Apps > PayPal"
            }
        }

        # ---- Email: SMTP ----
        Write-Host ""
        Write-Host "  EMAIL DELIVERY (SMTP)" -ForegroundColor Cyan
        Write-Host "  Without SMTP, emails print to console only." -ForegroundColor Gray
        $currentSmtpHost = Get-EnvValue -Path $envFile -Key "SMTP_HOST"
        if ($currentSmtpHost) {
            Write-Success "SMTP already configured ($currentSmtpHost)"
        }
        elseif ($NonInteractive) {
            Write-Info "Skipping SMTP (non-interactive mode). Emails will print to console."
        }
        else {
            $setupSmtp = Read-Host "  Do you want to configure email delivery? (y/n, default: n)"
            if ($setupSmtp -match "^y") {
                $smtpHost = Read-Host "  SMTP Host (e.g., smtp.gmail.com)"
                $smtpPort = Read-Host "  SMTP Port (default: 587)"
                $smtpUser = Read-Host "  SMTP Username (e.g., your-email@gmail.com)"
                $smtpPass = Read-Host "  SMTP Password (App Password for Gmail)"
                $smtpFrom = Read-Host "  From Email (e.g., noreply@yourdomain.com)"
                if (-not $smtpPort) { $smtpPort = "587" }
                if ($smtpHost) { Set-EnvValue -Path $envFile -Key "SMTP_HOST" -Value $smtpHost }
                if ($smtpPort) { Set-EnvValue -Path $envFile -Key "SMTP_PORT" -Value $smtpPort }
                if ($smtpUser) { Set-EnvValue -Path $envFile -Key "SMTP_USER" -Value $smtpUser }
                if ($smtpPass) { Set-EnvValue -Path $envFile -Key "SMTP_PASSWORD" -Value $smtpPass }
                if ($smtpFrom) { Set-EnvValue -Path $envFile -Key "SMTP_FROM_EMAIL" -Value $smtpFrom }
                Write-Success "SMTP settings saved to .env"
                Write-Info "  Restart SMTP app after setup: platform.ps1 restart aura-smtp-app"
            }
            else {
                Write-Info "  Skipped. Emails will print to console. Configure later in infra/.env"
            }
        }

        # ---- Error Monitoring: Sentry ----
        Write-Host ""
        Write-Host "  ERROR MONITORING (Sentry — optional)" -ForegroundColor Cyan
        $currentSentry = Get-EnvValue -Path $envFile -Key "SENTRY_DSN"
        if ($currentSentry) {
            Write-Success "Sentry already configured"
        }
        elseif ($NonInteractive) {
            Write-Info "Skipping Sentry (non-interactive mode)"
        }
        else {
            $setupSentry = Read-Host "  Do you have a Sentry DSN? (y/n, default: n)"
            if ($setupSentry -match "^y") {
                $sentryDsn = Read-Host "  Sentry DSN (https://...@ingest.sentry.io/...)"
                if ($sentryDsn) {
                    Set-EnvValue -Path $envFile -Key "SENTRY_DSN" -Value $sentryDsn
                    Set-EnvValue -Path $envFile -Key "NEXT_PUBLIC_SENTRY_DSN" -Value $sentryDsn
                    Write-Success "Sentry DSN saved to .env"
                }
            }
            else {
                Write-Info "  Skipped. Free tier at https://sentry.io"
            }
        }

        # ---- Store Infrastructure + Catalog ----
        Write-Host ""
        Write-Host "  STORE CATALOG (Products, Categories, Shipping)" -ForegroundColor Cyan
        Write-Host "  Your store is empty — no products, categories, or shipping yet." -ForegroundColor Gray

        $catalogDir = Join-Path (Split-Path $infraDir -Parent) "scripts\catalog-generator"
        if ($NonInteractive) {
            Write-Info "Skipping catalog generation (non-interactive mode)"
            Write-Info "  Run manually: cd scripts/catalog-generator && npm install && npm run setup"
        }
        elseif (Test-Path $catalogDir) {
            $setupCatalog = Read-Host "  Deploy store infrastructure + generate product catalog? (y/n, default: y)"
            if ($setupCatalog -notmatch "^n") {
                # Check Node.js is available
                if (Get-Command "node" -ErrorAction SilentlyContinue) {
                    Write-Info "Running catalog generator (this may take a few minutes)..."

                    # Create catalog-generator .env with API URL and token
                    $catalogEnvPath = Join-Path $catalogDir ".env"
                    $apiPort = if ($env:AURA_API_PORT) { $env:AURA_API_PORT } else { "8000" }
                    $AuraUrl = "http://localhost:$apiPort/graphql/"

                    # Generate an API token for the catalog generator
                    $adminEmail = $env:AURA_ADMIN_EMAIL
                    $adminPassword = $env:AURA_ADMIN_PASSWORD
                    if (-not $adminEmail) {
                        . "$infraDir\lib\EnvManager.ps1"
                        $envVars = Read-EnvFile (Join-Path $infraDir ".env")
                        $adminEmail = $envVars["AURA_ADMIN_EMAIL"]
                        $adminPassword = $envVars["AURA_ADMIN_PASSWORD"]
                        $apiPort = $envVars["AURA_API_PORT"]
                        if ($apiPort) { $AuraUrl = "http://localhost:$apiPort/graphql/" }
                    }

                    $AuraToken = ""
                    if ($adminEmail -and $adminPassword) {
                        Write-Info "  Generating API token for catalog generator..."
                        try {
                            $tokenQuery = '{"query":"mutation { tokenCreate(email: \"' + $adminEmail + '\", password: \"' + $adminPassword + '\") { token errors { field message } } }"}'
                            $tokenResult = Invoke-RestMethod -Uri $AuraUrl -Method Post -ContentType "application/json" -Body $tokenQuery -ErrorAction Stop
                            $AuraToken = $tokenResult.data.tokenCreate.token
                            if ($AuraToken) {
                                Write-Success "  API token generated"
                            }
                            else {
                                Write-Warn "  Could not generate token. Set AURA_TOKEN manually in scripts/catalog-generator/.env"
                            }
                        }
                        catch {
                            Write-Warn "  Could not reach API for token. Set AURA_TOKEN manually in scripts/catalog-generator/.env"
                        }
                    }

                    $catalogEnvContent = "AURA_URL=$AuraUrl`nAURA_TOKEN=$AuraToken`n"
                    [System.IO.File]::WriteAllText($catalogEnvPath, $catalogEnvContent, [System.Text.UTF8Encoding]::new($false))
                    Write-Info "  Created scripts/catalog-generator/.env"

                    Push-Location $catalogDir
                    try {
                        & npm install --silent 2>$null
                        & npm run setup
                        if ($LASTEXITCODE -eq 0) {
                            Write-Success "Store infrastructure deployed + catalog generated!"
                            Write-Info "  Import products via Dashboard > Apps > Bulk Manager"
                        }
                        else {
                            Write-Warn "Catalog generator had issues. Run manually: cd scripts/catalog-generator && npm run setup"
                        }
                    }
                    catch {
                        Write-Warn "Catalog generator failed: $_"
                        Write-Info "  Run manually: cd scripts/catalog-generator && npm run setup"
                    }
                    Pop-Location
                }
                else {
                    Write-Warn "Node.js not found on host. Install Node.js 22+ and run:"
                    Write-Info "  cd scripts/catalog-generator && npm install && npm run setup"
                }
            }
            else {
                Write-Info "  Skipped. Run later: cd scripts/catalog-generator && npm install && npm run setup"
            }
        }
        else {
            Write-Info "Catalog generator not found at: $catalogDir"
        }

        # ================================================================
        # FINAL SUMMARY
        # ================================================================
        Write-Host ""
        Write-Banner -Title "Setup Complete!" -Subtitle "Your platform is ready"
        Write-Host ""
        Write-ServiceTable -Services $config.services -Config $config -Mode $Mode

        Write-Host ""
        Write-Host "  REMAINING MANUAL STEPS:" -ForegroundColor Yellow
        Write-Host "  ─────────────────────────────────────────────" -ForegroundColor Gray
        Write-Host "  1. Log into Dashboard: " -NoNewline; Write-Host "http://localhost:9100" -ForegroundColor Cyan
        Write-Host "  2. Import Storefront Control configs:" -ForegroundColor White
        Write-Host "     Dashboard > Apps > Storefront Control > Import/Export" -ForegroundColor Gray
        Write-Host "     - USD channel: apps/apps/storefront-control/sample-config-import-en.json" -ForegroundColor Gray
        Write-Host "     - ILS channel: apps/apps/storefront-control/sample-config-import.json" -ForegroundColor Gray
        Write-Host "  3. Import products (if catalog was generated):" -ForegroundColor White
        Write-Host "     Dashboard > Apps > Bulk Manager > Import Excel" -ForegroundColor Gray
        Write-Host "  4. Replace logo: storefront/public/logo.svg" -ForegroundColor White
        Write-Host "  5. Replace favicon: storefront/public/favicon.ico" -ForegroundColor White
        Write-Host "  ─────────────────────────────────────────────" -ForegroundColor Gray
        Write-Host ""

        if (-not $NoBrowser) {
            Write-Info "Opening browser..."
            Open-PlatformBrowser
        }

        Write-Host ""
        Write-Info "Run 'platform.ps1 status' anytime to check service health."
        Write-Host ""
    }

    # =========================================================================
    "status" {
        Write-Banner -Title "Aura Platform Status" -Subtitle $config.platform.name

        # Docker check
        $dockerOk = Test-DockerRunning
        if ($dockerOk) {
            Write-Success "Docker is running"
        }
        else {
            Write-Err "Docker is NOT running"
        }

        # Service table
        Write-ServiceTable -Services $config.services -Config $config -Mode $Mode

        # Backup info
        $backups = Get-BackupHistory -Config $config
        if ($backups.Count -gt 0) {
            $latest = $backups[0]
            $age = (Get-Date) - $latest.LastWriteTime
            Write-Info "Latest backup: $($latest.Name) ($([math]::Round($age.TotalHours, 1))h ago)"
        }
        else {
            Write-Info "No backups found."
        }
    }

    # =========================================================================
    "up" {
        Write-Banner -Title "Starting Aura Platform" -Subtitle "Mode: $Mode"

        $step = 0
        $total = 5
        if ($SkipDocker) { $total-- }
        if ($SkipTunnel) { $total-- }
        if (-not $SkipDbInit -and -not $SkipDocker) { $total++ }

        # Step 1 -- Docker
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

            # Step 3 -- Wait for core services
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

        # Step: Fresh DB detection -- auto-run db-init if needed
        if (-not $SkipDbInit -and -not $SkipDocker) {
            $apiContainer = $config.services.api.container
            if (-not $apiContainer) {
                $prefix = if ($env:COMPOSE_PREFIX) { $env:COMPOSE_PREFIX } else { "aura" }
                $apiContainer = "$prefix-api-dev"
            }

            # Check if migrations are unapplied (fresh database)
            # Use Select-String to count only migration lines (format: " [ ] 0001_..." or " [X] 0001_...")
            $migrationCheck = docker exec $apiContainer python manage.py showmigrations --plan 2>$null
            if ($LASTEXITCODE -ne 0) {
                Write-Warn "Could not check migration status (API container may still be starting)"
                $unapplied = 0
                $total_migrations = 0
            }
            else {
                $migrationLines = $migrationCheck | Where-Object { $_ -match "^\s*\[" }
                $unapplied = ($migrationLines | Where-Object { $_ -match "^\s*\[ \]" }).Count
                $total_migrations = ($migrationLines | Measure-Object).Count
            }

            if ($unapplied -gt 0 -and $total_migrations -gt 0 -and $unapplied -eq $total_migrations) {
                $step++
                Write-Step -Current $step -Total $total -Message "Fresh database detected -- initializing"
                Write-Info "Running migrations and creating admin user..."

                # Delegate to db-init logic inline (avoid recursive script call)
                $migrated = Invoke-InContainer -ContainerName $apiContainer `
                    -Command "python manage.py migrate --noinput" `
                    -Description "Applying migrations"
                if ($migrated) {
                    Write-Success "Migrations applied"
                }
                else {
                    Write-Warn "Migration had issues -- run 'platform.ps1 db-init' manually"
                }

                # Create admin from .env defaults
                $adminEmail = Get-EnvValue -Path $envFile -Key "AURA_ADMIN_EMAIL"
                $adminPass = Get-EnvValue -Path $envFile -Key "AURA_ADMIN_PASSWORD"
                if ($adminEmail -and $adminPass) {
                    $null = docker exec -e DJANGO_SUPERUSER_PASSWORD="$adminPass" $apiContainer `
                        python manage.py createsuperuser --noinput --email "$adminEmail" 2>$null
                    Write-Success "Admin user created: $adminEmail"
                }

                # Build schema
                $null = Invoke-InContainer -ContainerName $apiContainer `
                    -Command "python manage.py build_schema 2>/dev/null" -Silent
                Write-Success "GraphQL schema exported"
            }
            elseif ($unapplied -gt 0) {
                $step++
                Write-Step -Current $step -Total $total -Message "Pending migrations detected ($unapplied unapplied)"
                Write-Info "Run 'platform.ps1 db-init' to apply migrations"
            }
        }

        # Step -- Tunnels
        if (-not $SkipTunnel) {
            $step++
            Write-Step -Current $step -Total $total -Message "Starting tunnels (mode: $Mode)"

            try {
                $cf = Find-Cloudflared
            }
            catch {
                Write-Warn "cloudflared not found -- skipping tunnels. Install with: winget install Cloudflare.cloudflared"
                $cf = $null
            }

            if ($cf) {
                if ($Mode -eq "selfhosted") {
                    $tunnelConfig = Join-Path $infraDir "cloudflared-config.yml"
                    if (Test-Path $tunnelConfig) {
                        Start-NamedTunnel -CloudflaredCmd $cf -TunnelConfigPath $tunnelConfig | Out-Null
                    }
                    else {
                        Write-Warn "cloudflared-config.yml not found. Run: platform.ps1 generate-tunnel-config"
                    }
                }
                else {
                    # Dev mode -- ephemeral tunnels for all tunnel-eligible services
                    $tunnelUrls = @{}
                    $tunnelSvcs = Get-TunnelServices -Config $config

                    foreach ($key in $tunnelSvcs.Keys) {
                        $svc = $tunnelSvcs[$key]
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

        # Step 5 -- Done
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
                }
                else {
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
        if ($Compress) { $params.Compress = $true }
        if ($Quiet) { $params.Quiet = $true }

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
            $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
            $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
        }

        $installParams = @{
            Config   = $config
            Email    = $Email
            Password = $Password
            EnvPath  = $envFile
        }
        if ($SkipDelete) { $installParams.SkipDelete = $true }
        if ($Exclude.Count -gt 0) { $installParams.Exclude = $Exclude }
        if ($Include.Count -gt 0) { $installParams.Include = $Include }

        Install-AllApps @installParams
    }

    # =========================================================================
    "cleanup-apps" {
        Write-Banner -Title "Cleanup Duplicate Apps"

        if (-not $Email) {
            $Email = Read-Host "Admin email"
        }
        if (-not $Password) {
            $securePass = Read-Host "Admin password" -AsSecureString
            $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
            $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
        }

        $apiUrl = "http://localhost:$($config.services.api.port)/graphql/"
        Write-Host "Connecting to Saleor API at $apiUrl..." -ForegroundColor Yellow
        $token = Get-AuthToken -GraphQLUrl $apiUrl -Email $Email -Password $Password
        Write-Host "[OK] Authenticated." -ForegroundColor Green

        Remove-DuplicateApps -GraphQLUrl $apiUrl -Token $token -Config $config
    }

    # =========================================================================
    "tunnels" {
        Write-Banner -Title "Starting Tunnels Only"

        try {
            $cf = Find-Cloudflared
        }
        catch {
            Write-Err $_
            exit 1
        }

        if ($Mode -eq "selfhosted") {
            $tunnelConfig = Join-Path $infraDir "cloudflared-config.yml"
            Start-NamedTunnel -CloudflaredCmd $cf -TunnelConfigPath $tunnelConfig | Out-Null
        }
        else {
            $tunnelUrls = @{}
            $tunnelSvcs = Get-TunnelServices -Config $config

            foreach ($key in $tunnelSvcs.Keys) {
                $svc = $tunnelSvcs[$key]
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

        $sfContainer = $config.services.storefront.container
        $dashContainer = $config.services.dashboard.container

        Write-Step -Current 1 -Total 2 -Message "Storefront codegen"
        docker exec $sfContainer pnpm generate
        if ($LASTEXITCODE -ne 0) { Write-Warn "Storefront codegen returned errors." }
        else { Write-Success "Storefront codegen done." }

        Write-Step -Current 2 -Total 2 -Message "Dashboard codegen"
        docker exec $dashContainer pnpm generate
        if ($LASTEXITCODE -ne 0) { Write-Warn "Dashboard codegen returned errors." }
        else { Write-Success "Dashboard codegen done." }
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
        }
        else {
            Write-Err "docker not found. Install Docker Desktop from https://www.docker.com/products/docker-desktop/"
            $ok = $false
        }

        # cloudflared
        Write-Host "Checking cloudflared..." -ForegroundColor Yellow
        try {
            $cf = Find-Cloudflared
            Write-Success "cloudflared found: $cf"
        }
        catch {
            Write-Warn "cloudflared not found. Install with: winget install Cloudflare.cloudflared"
        }

        # powershell-yaml
        Write-Host "Checking powershell-yaml..." -ForegroundColor Yellow
        if (Get-Module -ListAvailable -Name powershell-yaml) {
            Write-Success "powershell-yaml module available"
        }
        else {
            Write-Warn "powershell-yaml not found. Installing..."
            try {
                Install-Module powershell-yaml -Scope CurrentUser -Force -AllowClobber
                Write-Success "powershell-yaml installed"
            }
            catch {
                Write-Err "Failed to install powershell-yaml: $_"
                $ok = $false
            }
        }

        # .env file
        Write-Host "Checking .env file..." -ForegroundColor Yellow
        $envCreated = $false
        if (Test-Path $envFile) {
            Write-Success ".env file exists"
        }
        else {
            $envTemplate = Join-Path $infraDir ".env.example"
            if (Test-Path $envTemplate) {
                Copy-Item $envTemplate $envFile
                Write-Success ".env created from .env.example"
                $envCreated = $true
            }
            else {
                Write-Warn ".env not found and no .env.example template. Create manually from env-template.txt."
            }
        }

        # --- Auto-generate secrets in .env ---
        if (Test-Path $envFile) {
            # Helper: generate cryptographically random hex string
            function New-RandomHex([int]$Bytes = 32) {
                $buf = [byte[]]::new($Bytes)
                [System.Security.Cryptography.RandomNumberGenerator]::Fill($buf)
                return ($buf | ForEach-Object { $_.ToString("x2") }) -join ""
            }

            # Helper: check if a value is a placeholder that needs replacing
            function Test-IsPlaceholder([string]$Value) {
                if (-not $Value) { return $true }
                if ($Value -match "^__.*__$") { return $true }
                if ($Value -match "^changeme") { return $true }
                return $false
            }

            # SECRET_KEY
            Write-Host "Checking SECRET_KEY..." -ForegroundColor Yellow
            $currentSecret = Get-EnvValue -Path $envFile -Key "SECRET_KEY"
            if (Test-IsPlaceholder $currentSecret) {
                $newSecret = New-RandomHex -Bytes 32
                Set-EnvValue -Path $envFile -Key "SECRET_KEY" -Value $newSecret
                Write-Success "SECRET_KEY auto-generated (64 hex chars)"
            }
            else {
                Write-Success "SECRET_KEY already set"
            }

            # APP_SECRET_KEY
            Write-Host "Checking APP_SECRET_KEY..." -ForegroundColor Yellow
            $currentAppSecret = Get-EnvValue -Path $envFile -Key "APP_SECRET_KEY"
            if (Test-IsPlaceholder $currentAppSecret) {
                $newAppSecret = New-RandomHex -Bytes 32
                Set-EnvValue -Path $envFile -Key "APP_SECRET_KEY" -Value $newAppSecret
                Write-Success "APP_SECRET_KEY auto-generated (64 hex chars)"
            }
            else {
                Write-Success "APP_SECRET_KEY already set"
            }

            # RSA_PRIVATE_KEY (using .NET — no openssl dependency)
            Write-Host "Checking RSA_PRIVATE_KEY..." -ForegroundColor Yellow
            $currentRsa = Get-EnvValue -Path $envFile -Key "RSA_PRIVATE_KEY"
            if (Test-IsPlaceholder $currentRsa) {
                try {
                    Add-Type -AssemblyName System.Security 2>$null
                    $rsa = [System.Security.Cryptography.RSA]::Create(2048)
                    $privateKeyBytes = $rsa.ExportRSAPrivateKey()
                    $b64 = [Convert]::ToBase64String($privateKeyBytes)
                    $pem = "-----BEGIN RSA PRIVATE KEY-----`n"
                    $offset = 0
                    while ($offset -lt $b64.Length) {
                        $lineEnd = [Math]::Min($offset + 64, $b64.Length)
                        $pem += $b64.Substring($offset, $lineEnd - $offset) + "`n"
                        $offset = $lineEnd
                    }
                    $pem += "-----END RSA PRIVATE KEY-----"
                    $oneLine = $pem -replace "`r?`n", "\n"
                    Set-EnvValue -Path $envFile -Key "RSA_PRIVATE_KEY" -Value $oneLine
                    Write-Success "RSA_PRIVATE_KEY auto-generated (2048-bit, injected into .env)"

                    # Also save .pem file for reference/debugging
                    $rsaPemFile = Join-Path $infraDir "rsa_private_key.pem"
                    if (-not (Test-Path $rsaPemFile)) {
                        $pem -replace "\\n", "`n" | Set-Content $rsaPemFile -NoNewline
                        Write-Info "  RSA key also saved to: $rsaPemFile"
                    }
                }
                catch {
                    Write-Warn "Failed to generate RSA key via .NET: $_"
                    Write-Info "  Generate manually: .\infra\scripts\generate-rsa-key-for-env.ps1"
                }
            }
            else {
                Write-Success "RSA_PRIVATE_KEY already set"
            }

            # Print summary of what still needs manual configuration
            if ($envCreated) {
                Write-Host ""
                Write-Info "Auto-configured: SECRET_KEY, APP_SECRET_KEY, RSA_PRIVATE_KEY"
                Write-Info "Still needs manual setup (optional):"
                Write-Info "  - Stripe keys:  STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET"
                Write-Info "  - SMTP:         SMTP_HOST, SMTP_USER, SMTP_PASSWORD (for real email delivery)"
                Write-Info "  - Sentry:       SENTRY_DSN (for error monitoring)"
                Write-Info "  - Brand:        Run 'platform.ps1 new-store' to set store name, colors, domain"
            }
        }

        Write-Host ""
        if ($ok) {
            Write-Success "Init complete. Next: platform.ps1 new-store (or platform.ps1 setup for full guided flow)"
        }
        else {
            Write-Warn "Some prerequisites are missing. Resolve the errors above before continuing."
        }
    }

    # =========================================================================
    "db-init" {
        Write-Banner -Title "Database Initialization" -Subtitle "Migrate, create admin, export schema"

        $apiContainer = $config.services.api.container
        if (-not $apiContainer) {
            $prefix = if ($env:COMPOSE_PREFIX) { $env:COMPOSE_PREFIX } else { "aura" }
            $apiContainer = "$prefix-api-dev"
        }

        # Step 1: Wait for postgres
        Write-Step -Current 1 -Total 4 -Message "Waiting for database..."
        $pgContainer = $config.services.postgres.container
        if (-not $pgContainer) {
            $prefix = if ($env:COMPOSE_PREFIX) { $env:COMPOSE_PREFIX } else { "aura" }
            $pgContainer = "$prefix-postgres-dev"
        }
        $pgReady = Wait-ForHealthy -ContainerName $pgContainer -MaxWaitSeconds 60
        if (-not $pgReady) {
            Write-Err "PostgreSQL container ($pgContainer) not healthy. Is Docker running?"
            exit 1
        }
        Write-Success "Database is ready"

        # Step 2: Run migrations
        Write-Step -Current 2 -Total 4 -Message "Running database migrations..."
        $migrated = Invoke-InContainer -ContainerName $apiContainer `
            -Command "python manage.py migrate --noinput" `
            -Description "Applying migrations"
        if ($migrated) {
            Write-Success "Migrations applied"
        }
        else {
            Write-Err "Migration failed. Check API container logs: docker compose -f $composeFile logs aura-api"
            exit 1
        }

        # Step 3: Create superuser
        Write-Step -Current 3 -Total 4 -Message "Creating admin user..."
        $adminEmail = if ($Email) { $Email } else { Get-EnvValue -Path $envFile -Key "AURA_ADMIN_EMAIL" }
        $adminPass = if ($Password) { $Password } else { Get-EnvValue -Path $envFile -Key "AURA_ADMIN_PASSWORD" }

        if (-not $adminEmail -or -not $adminPass -or $adminEmail -eq "admin@localhost") {
            if (-not $NonInteractive) {
                Write-Host ""
                Write-Host "  Admin account setup:" -ForegroundColor Cyan
                if (-not $adminEmail -or $adminEmail -eq "admin@localhost") {
                    $input = Read-Host "    Email (default: admin@localhost)"
                    if ($input) { $adminEmail = $input }
                    elseif (-not $adminEmail) { $adminEmail = "admin@localhost" }
                }
                if (-not $adminPass -or $adminPass -eq "admin") {
                    $input = Read-Host "    Password (default: admin)"
                    if ($input) { $adminPass = $input }
                    elseif (-not $adminPass) { $adminPass = "admin" }
                }
            }
            else {
                if (-not $adminEmail) { $adminEmail = "admin@localhost" }
                if (-not $adminPass) { $adminPass = "admin" }
            }
        }

        # Check if user already exists (escape email for Python string)
        $safeEmail = $adminEmail -replace "'", "\'"
        $checkCmd = "from django.contrib.auth import get_user_model; User = get_user_model(); print('EXISTS' if User.objects.filter(email='$safeEmail').exists() else 'MISSING')"
        $checkOutput = docker exec $apiContainer python manage.py shell -c "$checkCmd" 2>$null

        if ($checkOutput -match "EXISTS") {
            Write-Success "Admin user '$adminEmail' already exists (skipping)"
        }
        else {
            $createResult = docker exec -e DJANGO_SUPERUSER_PASSWORD="$adminPass" $apiContainer `
                python manage.py createsuperuser --noinput --email "$adminEmail" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Admin user created: $adminEmail"
            }
            else {
                Write-Warn "Could not create admin user (may already exist): $createResult"
            }
        }

        # Step 4: Export GraphQL schema
        Write-Step -Current 4 -Total 4 -Message "Exporting GraphQL schema..."
        $schemaExported = Invoke-InContainer -ContainerName $apiContainer `
            -Command "python manage.py build_schema 2>/dev/null" `
            -Description "Building schema"
        if ($schemaExported) {
            Write-Success "GraphQL schema exported"
        }
        else {
            Write-Warn "Schema export had warnings (non-critical)"
        }

        # Optional: Seed data
        if ($SeedData) {
            Write-Host ""
            Write-Info "Seeding demo data (populatedb)..."
            Invoke-InContainer -ContainerName $apiContainer `
                -Command "python manage.py populatedb --createsuperuser" `
                -Description "Populating database with demo data"
            Write-Success "Demo data seeded"
        }

        Write-Host ""
        Write-Success "Database initialized! Admin: $adminEmail"
    }

    # =========================================================================
    "generate-tunnel-config" {
        Write-Banner -Title "Generate Cloudflared Config" `
            -Subtitle "Domain: $($config.platform.domain)"

        $tunnelName = $config.platform.tunnel_name
        $domain = $config.platform.domain
        $outputPath = Join-Path $infraDir "cloudflared-config.yml"

        # Build ingress rules for all services with a subdomain
        $ingressLines = @()
        $tunnelSvcs = Get-TunnelServices -Config $config

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
# cloudflared-config.yml -- Generated by platform.ps1 generate-tunnel-config
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

        # Attempt to auto-detect tunnel UUID
        try {
            $tunnelList = cloudflared tunnel list -o json 2>$null | ConvertFrom-Json
            $matchedTunnel = $tunnelList | Where-Object { $_.name -eq $tunnelName } | Select-Object -First 1
            if ($matchedTunnel) {
                $tunnelId = $matchedTunnel.id
                $content = Get-Content $outputPath -Raw
                $content = $content -replace '<TUNNEL_ID>', $tunnelId
                $content | Set-Content $outputPath -Encoding UTF8
                Write-Success "Tunnel UUID auto-detected: $tunnelId"
                Write-Info "Credentials file: $($env:USERPROFILE)\.cloudflared\$tunnelId.json"
            }
            else {
                Write-Warn "Tunnel '$tunnelName' not found. Create it with: cloudflared tunnel create $tunnelName"
                Write-Info "Then replace <TUNNEL_ID> in cloudflared-config.yml with the UUID"
            }
        }
        catch {
            Write-Info "Could not auto-detect tunnel UUID. Replace <TUNNEL_ID> manually in cloudflared-config.yml"
        }

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
        if ($StoreName) { $storeParams.StoreName = $StoreName }
        if ($PrimaryColor) { $storeParams.PrimaryColor = $PrimaryColor }
        if ($Domain) { $storeParams.Domain = $Domain }
        if ($Tagline) { $storeParams.Tagline = $Tagline }
        if ($GtmId) { $storeParams.GtmId = $GtmId }
        if ($Ga4Id) { $storeParams.Ga4Id = $Ga4Id }

        # Run the store wizard
        & "$scriptDir\scripts\init-new-store.ps1" @storeParams

        # Create .env from template if it doesn't exist
        if (-not (Test-Path $envFile)) {
            $templateFile = Join-Path $scriptDir ".env.example"
            if (-not (Test-Path $templateFile)) {
                $templateFile = Join-Path $scriptDir "env-template.txt"
            }
            if (Test-Path $templateFile) {
                Write-Step -Current 1 -Total 1 -Message "Creating .env from template..."
                Copy-Item $templateFile $envFile
                Write-Info "Created .env from template. Run 'platform.ps1 init' to auto-generate secrets."
            }
        }

        # Print next steps
        Write-Host ""
        Write-Success "Store configured! Next steps:"
        Write-Info "  1. .\infra\platform.ps1 up              # Start services"
        Write-Info "  2. .\infra\platform.ps1 install-apps     # Install Saleor apps"
        Write-Info "  3. Open http://localhost:3100             # View storefront"
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
        Write-Host "  setup                    Full guided setup (init + brand + DB + apps)" -ForegroundColor White
        Write-Host "  new-store                Rebrand platform for a new store (wizard)"
        Write-Host "  status                   Health dashboard for all services"
        Write-Host "  up                       Start platform (Docker + tunnels)"
        Write-Host "  down                     Stop platform (containers + tunnels)"
        Write-Host "  restart <service|all>    Restart specific service, 'all', or 'apps'"
        Write-Host "  backup                   Create database backup with rotation"
        Write-Host "  restore <file>           Restore database from backup file"
        Write-Host "  install-apps             Install/reinstall all Saleor apps"
        Write-Host "  db-init                  Initialize database (migrate + admin + schema)" -ForegroundColor White
        Write-Host "  tunnels                  Start tunnels only (skip Docker)"
        Write-Host "  codegen                  Run GraphQL codegen (storefront + dashboard)"
        Write-Host "  logs <service>           Tail logs for a service"
        Write-Host "  init                     First-time setup (prereqs + .env + secrets)"
        Write-Host "  generate-tunnel-config   Generate cloudflared-config.yml from platform.yml"
        Write-Host "  sync                     Pull platform improvements from upstream template"
        Write-Host "  refresh-urls             Regenerate tunnel URLs and update .env + apps"
        Write-Host "  help                     Show this help"
        Write-Host ""
        Write-Host "Options:" -ForegroundColor Yellow
        Write-Host "  -Mode <dev|selfhosted>   Environment mode (default: dev)"
        Write-Host "  -Profile <dev|prod>      Compose profile (default: dev)"
        Write-Host "  -Domain <string>         Override domain from platform.yml"
        Write-Host "  -SkipTunnel              Skip tunnel startup with 'up' or 'setup'"
        Write-Host "  -SkipDocker              Skip Docker startup with 'up'"
        Write-Host "  -SkipDbInit              Skip fresh-DB auto-init with 'up'"
        Write-Host "  -NoBrowser               Don't open browser after 'up' or 'setup'"
        Write-Host "  -NonInteractive          Use defaults (no prompts) for 'setup'"
        Write-Host "  -Reset                   Clear setup state and start fresh"
        Write-Host "  -SeedData                Populate demo data with 'db-init'"
        Write-Host "  -Compress                Gzip-compress backup"
        Write-Host "  -Retain <int>            Backups to retain (default: 30)"
        Write-Host "  -Quiet                   Suppress verbose output"
        Write-Host "  -Email <string>          Admin email for install-apps / db-init"
        Write-Host "  -Password <string>       Admin password for install-apps / db-init"
        Write-Host "  -SkipDelete              Skip deleting existing apps before reinstall"
        Write-Host "  -Lines <int>             Log lines to tail (default: 100)"
        Write-Host ""
        Write-Host "Service keys (for restart/logs):" -ForegroundColor Yellow
        $keys = ($config.services.Keys | Sort-Object) -join ", "
        Write-Host "  $keys" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Yellow
        Write-Host "  .\infra\platform.ps1 setup                                      # Full guided setup (recommended for new projects)"
        Write-Host "  .\infra\platform.ps1 setup -NonInteractive                      # Automated setup with defaults"
        Write-Host "  .\infra\platform.ps1 setup -Reset                               # Clear state and restart setup"
        Write-Host "  .\infra\platform.ps1 new-store                                  # Interactive branding wizard"
        Write-Host "  .\infra\platform.ps1 new-store -StoreName 'Pet Shop' -PrimaryColor '#E11D48'"
        Write-Host "  .\infra\platform.ps1 up"
        Write-Host "  .\infra\platform.ps1 up -Mode selfhosted -SkipTunnel"
        Write-Host "  .\infra\platform.ps1 up -Profile prod                           # Production compose"
        Write-Host "  .\infra\platform.ps1 db-init                                    # Initialize DB manually"
        Write-Host "  .\infra\platform.ps1 db-init -SeedData                          # DB + demo products"
        Write-Host "  .\infra\platform.ps1 restart storefront"
        Write-Host "  .\infra\platform.ps1 backup -Compress"
        Write-Host "  .\infra\platform.ps1 restore ~/aura-backups/aura-2026-03-12.sql.gz"
        Write-Host "  .\infra\platform.ps1 install-apps -Email admin@example.com"
        Write-Host "  .\infra\platform.ps1 logs api"
        Write-Host "  .\infra\platform.ps1 generate-tunnel-config"
        Write-Host ""
    }

    # =========================================================================
    "sync" {
        Write-Banner -Title "Upstream Sync" -Subtitle "Pull platform improvements from template repo"

        $repoRoot = Split-Path -Parent $PSScriptRoot
        Push-Location $repoRoot

        try {
            # 1. Read .aura-sync config
            $syncFile = Join-Path $repoRoot ".aura-sync"
            if (-not (Test-Path $syncFile)) {
                Write-Err ".aura-sync not found. Is this a downstream clone?"
                exit 1
            }

            # Parse upstream URL from .aura-sync (simple grep, no YAML module needed)
            $upstreamUrl = (Get-Content $syncFile | Where-Object { $_ -match '^\s+url:' } | Select-Object -First 1) -replace '.*"(.+)".*', '$1'
            $upstreamBranch = (Get-Content $syncFile | Where-Object { $_ -match '^\s+branch:' } | Select-Object -First 1) -replace '.*"(.+)".*', '$1'
            if (-not $upstreamBranch) { $upstreamBranch = "main" }

            # 2. Ensure upstream remote exists
            $remotes = git remote 2>$null
            if ("upstream" -notin $remotes) {
                if (-not $upstreamUrl) {
                    Write-Err "No upstream URL configured in .aura-sync"
                    exit 1
                }
                git remote add upstream $upstreamUrl
                Write-Success "Added upstream remote: $upstreamUrl"
            }

            # 3. Ensure merge=ours driver is configured
            $driver = git config merge.ours.driver 2>$null
            if ($driver -ne "true") {
                git config merge.ours.driver true
                Write-Success "Configured merge=ours driver for store file protection"
            }

            # 4. Fetch upstream
            Write-Step -Current 1 -Total 5 -Message "Fetching upstream changes..."
            git fetch upstream $upstreamBranch 2>$null
            if ($LASTEXITCODE -ne 0) {
                Write-Err "Failed to fetch upstream. Check your network connection."
                exit 1
            }

            # 5. Check how far behind
            $behind = git rev-list --count "HEAD..upstream/$upstreamBranch" 2>$null
            if ($behind -eq 0) {
                Write-Success "Already up to date with upstream."
                return
            }
            Write-Host "  $behind commits available from upstream" -ForegroundColor Cyan
            Write-Host ""

            # Show changed files summary
            Write-Step -Current 2 -Total 5 -Message "Analyzing changes..."
            git --no-pager diff --stat "HEAD...upstream/$upstreamBranch" 2>$null
            Write-Host ""

            if ($DryRun) {
                Write-Host "Dry run -- no changes applied." -ForegroundColor Yellow
                return
            }

            # 6. Merge upstream (merge=ours protects store files via .gitattributes)
            Write-Step -Current 3 -Total 5 -Message "Merging upstream changes..."
            git merge "upstream/$upstreamBranch" --no-edit 2>$null

            if ($LASTEXITCODE -ne 0) {
                Write-Warn "Merge conflicts detected. Resolve manually:"
                git diff --name-only --diff-filter=U 2>$null
                Write-Host ""
                Write-Host "After resolving: git add . && git commit" -ForegroundColor Gray
                return
            }

            # 7. Detect what changed for post-merge automation
            $changedFiles = git diff --name-only "HEAD~$behind" HEAD 2>$null

            # 7a. Dependencies changed?
            $depsChanged = $changedFiles | Where-Object { $_ -match 'package\.json|pnpm-lock\.yaml' }
            if ($depsChanged) {
                Write-Step -Current 4 -Total 5 -Message "Post-merge: updating dependencies..."
                $prefix = if ($env:COMPOSE_PREFIX) { $env:COMPOSE_PREFIX } else { "aura" }
                docker compose -f "$PSScriptRoot/docker-compose.dev.yml" exec "$prefix-storefront" pnpm install 2>$null
                docker compose -f "$PSScriptRoot/docker-compose.dev.yml" exec "$prefix-dashboard" pnpm install 2>$null
            }

            # 7b. Backend changed? Run migrations + codegen
            $backendChanged = $changedFiles | Where-Object { $_ -match '^Aura/' }
            if ($backendChanged) {
                Write-Step -Current 4 -Total 5 -Message "Post-merge: running migrations + codegen..."
                $apiContainer = $config.services.api.container
                if ($apiContainer) {
                    docker exec $apiContainer python manage.py migrate 2>$null
                    docker exec $apiContainer python manage.py build_schema 2>$null
                }
                docker compose -f "$PSScriptRoot/docker-compose.dev.yml" exec aura-storefront pnpm generate 2>$null
                docker compose -f "$PSScriptRoot/docker-compose.dev.yml" exec aura-dashboard pnpm generate 2>$null
            }

            # 7c. Check for new env vars in .env.example
            $envExampleChanged = $changedFiles | Where-Object { $_ -match '\.env\.example$' }
            if ($envExampleChanged) {
                $envPath = Join-Path $PSScriptRoot ".env"
                $examplePath = Join-Path $PSScriptRoot ".env.example"
                if ((Test-Path $envPath) -and (Test-Path $examplePath)) {
                    . "$PSScriptRoot\lib\EnvManager.ps1"
                    $template = Read-EnvFile $examplePath
                    $local = Read-EnvFile $envPath
                    $missing = @()
                    foreach ($key in $template.Keys) {
                        if (-not $local.ContainsKey($key)) {
                            $missing += "$key=$($template[$key])"
                        }
                    }
                    if ($missing.Count -gt 0) {
                        Write-Warn "New environment variables added by upstream ($($missing.Count) vars):"
                        foreach ($m in $missing) { Write-Host "  + $m" -ForegroundColor Yellow }
                        Write-Host ""
                        Write-Host "Add these to your infra/.env file." -ForegroundColor Gray
                    }
                }
            }

            # 7d. Restart containers
            Write-Step -Current 5 -Total 5 -Message "Post-merge: restarting containers..."
            $infraChanged = $changedFiles | Where-Object { $_ -match 'Dockerfile|docker-compose|\.env\.example' }
            $frontendChanged = $changedFiles | Where-Object { $_ -match '^storefront/|^dashboard/' }

            if ($infraChanged) {
                Write-Host "  Infrastructure changed -- rebuilding containers..." -ForegroundColor Yellow
                docker compose -f "$PSScriptRoot/docker-compose.dev.yml" up -d --build 2>$null
            }
            elseif ($frontendChanged) {
                Write-Host "  Frontend changed -- rebuilding storefront + dashboard..." -ForegroundColor Yellow
                docker compose -f "$PSScriptRoot/docker-compose.dev.yml" up -d --build aura-storefront aura-dashboard 2>$null
            }
            else {
                docker compose -f "$PSScriptRoot/docker-compose.dev.yml" restart 2>$null
            }

            Write-Success "Upstream sync complete! $behind commits merged."
        }
        finally {
            Pop-Location
        }
    }

    # =========================================================================
    "refresh-urls" {
        Write-Banner -Title "Refresh URLs" -Subtitle "Re-register apps with current tunnel/domain URLs"

        Write-Host "This will delete and re-install all Saleor apps so webhooks" -ForegroundColor Yellow
        Write-Host "are registered with the current URLs from .env." -ForegroundColor Yellow
        Write-Host ""

        $confirm = Read-Host "Continue? (y/n)"
        if ($confirm -ne "y" -and $confirm -ne "yes") {
            Write-Host "Cancelled." -ForegroundColor Gray
            return
        }

        # Reuse existing install-apps logic which already does delete + reinstall
        Write-Host ""
        & $PSCommandPath install-apps
    }

    # =========================================================================
    default {
        Write-Err "Unknown command: '$Command'"
        Write-Host "Run '.\infra\platform.ps1 help' for usage." -ForegroundColor Gray
        exit 1
    }
}
