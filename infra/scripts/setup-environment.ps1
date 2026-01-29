# ============================================================================
# SALEOR PLATFORM - ENVIRONMENT SETUP SCRIPT
# ============================================================================
# This script helps you configure the unified environment for the entire
# Saleor platform (API, Dashboard, Storefront, Stripe App).
# ============================================================================

param(
    [switch]$WithTunnels,
    [switch]$LocalOnly,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

function Write-Header {
    param([string]$Text)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ️  $Text" -ForegroundColor White
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Text)
    Write-Host "⚠️  $Text" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

if ($Help) {
    Write-Host @"
Saleor Platform - Environment Setup Script

USAGE:
    .\setup-environment.ps1 [-WithTunnels | -LocalOnly] [-Help]

OPTIONS:
    -WithTunnels    Configure for tunneled access (Cloudflare, ngrok, etc.)
    -LocalOnly      Configure for localhost-only development (default)
    -Help           Show this help message

EXAMPLES:
    # Setup for local development only
    .\setup-environment.ps1 -LocalOnly

    # Setup with tunnel support
    .\setup-environment.ps1 -WithTunnels

DESCRIPTION:
    This script creates a .env file with all necessary configuration for:
    - Saleor API (Django/GraphQL backend)
    - Saleor Dashboard (Admin interface)
    - Saleor Storefront (Customer-facing site)
    - Stripe Payment App

    For local development, it will use localhost URLs.
    For tunneled development, it will prompt for your tunnel URLs.

"@
    exit 0
}

Write-Header "Saleor Platform - Environment Setup"

# Check if .env already exists
$envFile = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $envFile) {
    Write-Warning ".env file already exists at $envFile"
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y") {
        Write-Info "Setup cancelled. Existing .env file preserved."
        exit 0
    }
    Write-Warning "Backing up existing .env to .env.backup"
    Copy-Item $envFile "$envFile.backup" -Force
}

# Initialize configuration
$config = @{}

# ============================================================================
# STEP 1: Choose deployment mode
# ============================================================================
Write-Header "Step 1: Deployment Mode"

if (-not $WithTunnels -and -not $LocalOnly) {
    Write-Info "Choose your deployment mode:"
    Write-Host "  1) Local development only (localhost)"
    Write-Host "  2) With tunnels (Cloudflare, ngrok, etc.)"
    $choice = Read-Host "Enter choice (1 or 2)"
    
    if ($choice -eq "2") {
        $WithTunnels = $true
    }
    else {
        $LocalOnly = $true
    }
}

if ($WithTunnels) {
    Write-Success "Using tunnel mode"
    Write-Info "You'll need to provide your tunnel URLs."
}
else {
    Write-Success "Using localhost mode"
    Write-Info "All services will use localhost URLs."
}

# ============================================================================
# STEP 2: Tunnel URLs (if needed)
# ============================================================================
if ($WithTunnels) {
    Write-Header "Step 2: Tunnel URLs"
    
    Write-Info "Please start your tunnels and provide the URLs:"
    Write-Host ""
    Write-Host "Example tunnels setup:" -ForegroundColor Yellow
    Write-Host "  Terminal 1: cloudflared tunnel --url localhost:8000  (Saleor API)" -ForegroundColor Gray
    Write-Host "  Terminal 2: cloudflared tunnel --url localhost:3002  (Stripe App)" -ForegroundColor Gray
    Write-Host "  Terminal 3: cloudflared tunnel --url localhost:9000  (Dashboard - optional)" -ForegroundColor Gray
    Write-Host ""
    
    $config["SALEOR_API_TUNNEL_URL"] = Read-Host "Saleor API tunnel URL (e.g., https://abc123.trycloudflare.com)"
    $config["STRIPE_APP_TUNNEL_URL"] = Read-Host "Stripe App tunnel URL (e.g., https://def456.trycloudflare.com)"
    
    $useDashboardTunnel = Read-Host "Do you need a dashboard tunnel? (y/N)"
    if ($useDashboardTunnel -eq "y") {
        $config["DASHBOARD_TUNNEL_URL"] = Read-Host "Dashboard tunnel URL (e.g., https://variance-dow-rays-antivirus.trycloudflare.com)"
    }
    
    $useStorefrontTunnel = Read-Host "Do you need a storefront tunnel? (y/N)"
    if ($useStorefrontTunnel -eq "y") {
        $config["STOREFRONT_TUNNEL_URL"] = Read-Host "Storefront tunnel URL (e.g., https://ghi789.trycloudflare.com)"
    }
    
    Write-Success "Tunnel URLs configured"
}

# ============================================================================
# STEP 3: Stripe Configuration
# ============================================================================
Write-Header "Step 3: Stripe Configuration"

Write-Info "Enter your Stripe API keys (from https://dashboard.stripe.com/test/apikeys)"
Write-Host ""

$config["STRIPE_PUBLISHABLE_KEY"] = Read-Host "Stripe Publishable Key (pk_test_...)"
$config["STRIPE_SECRET_KEY"] = Read-Host "Stripe Secret Key (sk_test_...)"

Write-Host ""
Write-Info "Stripe Webhook Secret:"
Write-Info "  If using tunnels: Run 'stripe listen --forward-to <your-stripe-app-url>/api/webhooks/stripe'"
Write-Info "  If localhost: Run 'stripe listen --forward-to http://localhost:3002/api/webhooks/stripe'"
Write-Host ""

$config["STRIPE_WEBHOOK_SECRET"] = Read-Host "Stripe Webhook Secret (whsec_...)"

# ============================================================================
# STEP 4: Saleor Cloud Integration (Optional)
# ============================================================================
Write-Header "Step 4: Saleor Cloud Integration"

Write-Info "Saleor Cloud provides an official App Marketplace."
Write-Info "This is OPTIONAL for self-hosted setups."
Write-Host ""
Write-Host "Do you want to enable Saleor Cloud integration? (y/N): " -NoNewline

$enableCloud = Read-Host
if ($enableCloud -eq "y") {
    $config["APPS_MARKETPLACE_API_URL"] = "https://apps.saleor.io/api/v2/saleor-apps"
    $config["EXTENSIONS_API_URL"] = "https://apps.saleor.io/api/v1/extensions"
    Write-Success "Saleor Cloud integration enabled"
}
else {
    $config["APPS_MARKETPLACE_API_URL"] = ""
    $config["EXTENSIONS_API_URL"] = ""
    Write-Info "Saleor Cloud integration disabled (recommended for self-hosted)"
}

# ============================================================================
# STEP 5: Security Keys
# ============================================================================
Write-Header "Step 5: Security Configuration"

Write-Info "Generating secure random keys..."

# Generate SECRET_KEY (for Saleor API)
$saleorSecretKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 50 | ForEach-Object { [char]$_ })
$config["SECRET_KEY"] = $saleorSecretKey

# Generate APP_SECRET_KEY (for Stripe App encryption - 32 bytes = 64 hex chars)
$appSecretKey = -join ((0..31) | ForEach-Object { "{0:X2}" -f (Get-Random -Maximum 256) })
$config["APP_SECRET_KEY"] = $appSecretKey.ToLower()

# Generate RSA_PRIVATE_KEY (for webhook JWS signing; API and Worker must share this)
Add-Type -AssemblyName System.Security
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
$config["RSA_PRIVATE_KEY"] = $pem

Write-Success "Security keys generated"

# ============================================================================
# STEP 6: Write .env file
# ============================================================================
Write-Header "Step 6: Writing Configuration"

$envContent = @"
# ============================================================================
# SALEOR PLATFORM - UNIFIED ENVIRONMENT CONFIGURATION
# ============================================================================
# Generated by setup-environment.ps1
# Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================================================

"@

if ($WithTunnels) {
    $envContent += @"
# ============================================================================
# TUNNEL URLs
# ============================================================================
# Required for webhooks and API access
SALEOR_API_TUNNEL_URL=$($config["SALEOR_API_TUNNEL_URL"])
STRIPE_APP_TUNNEL_URL=$($config["STRIPE_APP_TUNNEL_URL"])

"@
    
    # Add optional tunnel URLs if configured
    if ($config.ContainsKey("DASHBOARD_TUNNEL_URL")) {
        $envContent += "# Optional: Dashboard external access`nDASHBOARD_TUNNEL_URL=$($config["DASHBOARD_TUNNEL_URL"])`n`n"
    }
    
    if ($config.ContainsKey("STOREFRONT_TUNNEL_URL")) {
        $envContent += "# Optional: Storefront external access`nSTOREFRONT_TUNNEL_URL=$($config["STOREFRONT_TUNNEL_URL"])`n`n"
    }
    
    if (-not $config.ContainsKey("DASHBOARD_TUNNEL_URL") -and -not $config.ContainsKey("STOREFRONT_TUNNEL_URL")) {
        $envContent += "`n"
    }
}

# Set default ports if not configured
if (-not $config.ContainsKey("POSTGRES_PORT")) { $config["POSTGRES_PORT"] = "5432" }
if (-not $config.ContainsKey("REDIS_PORT")) { $config["REDIS_PORT"] = "6379" }
if (-not $config.ContainsKey("SALEOR_API_PORT")) { $config["SALEOR_API_PORT"] = "8000" }
if (-not $config.ContainsKey("DASHBOARD_PORT")) { $config["DASHBOARD_PORT"] = "9000" }
if (-not $config.ContainsKey("STOREFRONT_PORT")) { $config["STOREFRONT_PORT"] = "3000" }
if (-not $config.ContainsKey("STRIPE_APP_PORT")) { $config["STRIPE_APP_PORT"] = "3002" }

# Set default database config if not configured
if (-not $config.ContainsKey("POSTGRES_USER")) { $config["POSTGRES_USER"] = "saleor" }
if (-not $config.ContainsKey("POSTGRES_PASSWORD")) { $config["POSTGRES_PASSWORD"] = "saleor" }
if (-not $config.ContainsKey("POSTGRES_DB")) { $config["POSTGRES_DB"] = "saleor" }

# Build URLs based on tunnel or localhost
$apiUrl = if ($WithTunnels -and $config.ContainsKey("SALEOR_API_TUNNEL_URL")) {
    "$($config["SALEOR_API_TUNNEL_URL"])/graphql/"
}
else {
    "http://localhost:$($config["SALEOR_API_PORT"])/graphql/"
}

$publicUrl = if ($WithTunnels -and $config.ContainsKey("SALEOR_API_TUNNEL_URL")) {
    $config["SALEOR_API_TUNNEL_URL"]
}
else {
    "http://localhost:$($config["SALEOR_API_PORT"])"
}

$storefrontUrl = if ($WithTunnels -and $config.ContainsKey("STOREFRONT_TUNNEL_URL")) {
    $config["STOREFRONT_TUNNEL_URL"]
}
else {
    "http://localhost:$($config["STOREFRONT_PORT"])"
}

$stripeAppUrl = if ($WithTunnels -and $config.ContainsKey("STRIPE_APP_TUNNEL_URL")) {
    $config["STRIPE_APP_TUNNEL_URL"]
}
else {
    "http://localhost:$($config["STRIPE_APP_PORT"])"
}

# Build ALLOWED_CLIENT_HOSTS with ports
$allowedClientHosts = "localhost:$($config["STOREFRONT_PORT"]),localhost:$($config["STRIPE_APP_PORT"]),localhost:$($config["DASHBOARD_PORT"]),127.0.0.1:$($config["DASHBOARD_PORT"])"
if ($WithTunnels -and $config.ContainsKey("SALEOR_API_TUNNEL_URL")) {
    $tunnelDomain = ([System.Uri]$config["SALEOR_API_TUNNEL_URL"]).Host
    $allowedClientHosts += ",$tunnelDomain"
}

$envContent += @"
# ============================================================================
# SERVICE PORTS
# ============================================================================
POSTGRES_PORT=$($config["POSTGRES_PORT"])
REDIS_PORT=$($config["REDIS_PORT"])
SALEOR_API_PORT=$($config["SALEOR_API_PORT"])
DASHBOARD_PORT=$($config["DASHBOARD_PORT"])
STOREFRONT_PORT=$($config["STOREFRONT_PORT"])
STRIPE_APP_PORT=$($config["STRIPE_APP_PORT"])

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
POSTGRES_USER=$($config["POSTGRES_USER"])
POSTGRES_PASSWORD=$($config["POSTGRES_PASSWORD"])
POSTGRES_DB=$($config["POSTGRES_DB"])

# ============================================================================
# SALEOR API CONFIGURATION
# ============================================================================
SECRET_KEY=$($config["SECRET_KEY"])
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,saleor-api
ALLOWED_CLIENT_HOSTS=$allowedClientHosts
ALLOWED_GRAPHQL_ORIGINS=*
PUBLIC_URL=$publicUrl
EMAIL_URL=consolemail://
TIME_ZONE=UTC
WEBHOOK_SECRET_KEY=
RSA_PRIVATE_KEY=$($config["RSA_PRIVATE_KEY"] -replace "`r?`n", "\n")

# Redis URLs
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

"@

if ($WithTunnels) {
    $envContent += @"
# ============================================================================
# TUNNEL URLs
# ============================================================================
SALEOR_API_TUNNEL_URL=$($config["SALEOR_API_TUNNEL_URL"])
STRIPE_APP_TUNNEL_URL=$($config["STRIPE_APP_TUNNEL_URL"])

"@
    if ($config.ContainsKey("DASHBOARD_TUNNEL_URL")) {
        $envContent += "DASHBOARD_TUNNEL_URL=$($config["DASHBOARD_TUNNEL_URL"])`n"
    }
    if ($config.ContainsKey("STOREFRONT_TUNNEL_URL")) {
        $envContent += "STOREFRONT_TUNNEL_URL=$($config["STOREFRONT_TUNNEL_URL"])`n"
    }
    $envContent += "`n"
}

$envContent += @"
# ============================================================================
# DASHBOARD CONFIGURATION
# ============================================================================
API_URL=$apiUrl
VITE_API_URL=$apiUrl
APPS_MARKETPLACE_API_URL=
EXTENSIONS_API_URL=
APP_MOUNT_URI=/dashboard/
STATIC_URL=/dashboard/

# ============================================================================
# STOREFRONT CONFIGURATION
# ============================================================================
NEXT_PUBLIC_SALEOR_API_URL=$apiUrl
SALEOR_API_URL=$apiUrl
NEXT_PUBLIC_STOREFRONT_URL=$storefrontUrl
NEXT_PUBLIC_DEFAULT_CHANNEL=default-channel
SALEOR_APP_TOKEN=

# ============================================================================
# STRIPE PAYMENT APP CONFIGURATION
# ============================================================================
STRIPE_PUBLISHABLE_KEY=$($config["STRIPE_PUBLISHABLE_KEY"])
STRIPE_SECRET_KEY=$($config["STRIPE_SECRET_KEY"])
STRIPE_WEBHOOK_SECRET=$($config["STRIPE_WEBHOOK_SECRET"])
APP_SECRET_KEY=$($config["APP_SECRET_KEY"])
STRIPE_APP_TOKEN=

# Stripe App URLs (same as storefront for API, but different app URL)
STRIPE_APP_URL=$stripeAppUrl
STRIPE_APP_API_BASE_URL=$stripeAppUrl

"@

$envContent | Out-File -FilePath $envFile -Encoding utf8 -Force
Write-Success "Configuration written to $envFile"

# ============================================================================
# STEP 7: Next Steps
# ============================================================================
Write-Header "Setup Complete!"

Write-Host ""
Write-Success "Environment configuration created successfully!"
Write-Host ""

Write-Info "Next steps:"
Write-Host ""
Write-Host "1. Start all services:" -ForegroundColor White
Write-Host "   docker compose -f docker-compose.dev.yml up -d" -ForegroundColor Gray
Write-Host ""

if ($WithTunnels) {
    Write-Host "2. Make sure your tunnels are running:" -ForegroundColor White
    Write-Host "   Saleor API: $($config["SALEOR_API_TUNNEL_URL"])" -ForegroundColor Gray
    Write-Host "   Stripe App: $($config["STRIPE_APP_TUNNEL_URL"])" -ForegroundColor Gray
    if ($config.ContainsKey("DASHBOARD_TUNNEL_URL")) {
        Write-Host "   Dashboard:  $($config["DASHBOARD_TUNNEL_URL"])" -ForegroundColor Gray
    }
    if ($config.ContainsKey("STOREFRONT_TUNNEL_URL")) {
        Write-Host "   Storefront: $($config["STOREFRONT_TUNNEL_URL"])" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "3. Access your services:" -ForegroundColor White
$apiPort = $config.GetValueOrDefault("SALEOR_API_PORT", "8000")
$dashboardPort = $config.GetValueOrDefault("DASHBOARD_PORT", "9000")
$storefrontPort = $config.GetValueOrDefault("STOREFRONT_PORT", "3000")
$stripePort = $config.GetValueOrDefault("STRIPE_APP_PORT", "3002")

if ($WithTunnels) {
    Write-Host "   Saleor API:  $($config["SALEOR_API_TUNNEL_URL"])/graphql/" -ForegroundColor Gray
    if ($config.ContainsKey("DASHBOARD_TUNNEL_URL")) {
        Write-Host "   Dashboard:   $($config["DASHBOARD_TUNNEL_URL"]) (tunnel)" -ForegroundColor Gray
        Write-Host "              or http://localhost:$dashboardPort (local)" -ForegroundColor DarkGray
    }
    else {
        Write-Host "   Dashboard:   http://localhost:$dashboardPort" -ForegroundColor Gray
    }
    if ($config.ContainsKey("STOREFRONT_TUNNEL_URL")) {
        Write-Host "   Storefront:  $($config["STOREFRONT_TUNNEL_URL"]) (tunnel)" -ForegroundColor Gray
        Write-Host "              or http://localhost:$storefrontPort (local)" -ForegroundColor DarkGray
    }
    else {
        Write-Host "   Storefront:  http://localhost:$storefrontPort" -ForegroundColor Gray
    }
    Write-Host "   Stripe App:  $($config["STRIPE_APP_TUNNEL_URL"])" -ForegroundColor Gray
}
else {
    Write-Host "   Saleor API:  http://localhost:$apiPort/graphql/" -ForegroundColor Gray
    Write-Host "   Dashboard:   http://localhost:$dashboardPort" -ForegroundColor Gray
    Write-Host "   Storefront:  http://localhost:$storefrontPort" -ForegroundColor Gray
    Write-Host "   Stripe App:  http://localhost:$stripePort" -ForegroundColor Gray
}
Write-Host ""

Write-Host "4. Install the Stripe app:" -ForegroundColor White
Write-Host "   a. Open Dashboard at http://localhost:$dashboardPort" -ForegroundColor Gray
Write-Host "   b. Go to Apps > Install App" -ForegroundColor Gray
if ($WithTunnels) {
    Write-Host "   c. Enter manifest URL: $($config["STRIPE_APP_TUNNEL_URL"])/api/manifest" -ForegroundColor Gray
}
else {
    Write-Host "   c. Enter manifest URL: http://localhost:$stripePort/api/manifest" -ForegroundColor Gray
}
Write-Host "   d. Copy the app token and add it to .env as STRIPE_APP_TOKEN" -ForegroundColor Gray
Write-Host "   e. Restart Stripe app: docker compose -f docker-compose.dev.yml restart saleor-stripe-app" -ForegroundColor Gray
Write-Host ""

Write-Info "For more information, see: infra/CONFIGURATION.md"
Write-Host ""

Write-Success "Happy coding! 🚀"
