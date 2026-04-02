<#
.SYNOPSIS
    Initialize a new store — full hydration wizard for the Saleor Platform.

.DESCRIPTION
    Interactive (or non-interactive) wizard that rebrands the entire platform:
    1. Collects store identity (name, type, color, tagline, email, phone, domain, analytics)
    2. Hydrates ALL downstream config files so the platform is ready to run

    Hydration targets:
      - infra/platform.yml          (platform + store sections)
      - infra/env-template.txt      (PLATFORM_DOMAIN line)
      - infra/.env                  (PLATFORM_DOMAIN, VITE_STORE_NAME, VITE_PLATFORM_NAME, NEXT_PUBLIC_IMAGE_DOMAINS)
      - apps/apps/storefront-control/sample-config-import-en.json  (store + branding identity)
      - apps/apps/storefront-control/sample-config-import.json     (store + branding identity)
      - storefront/storefront-cms-config.json                      (both channel sub-objects)
      - cloudflared config (if domain provided)
      - storefront/src/config/stores/{slug}.config.ts              (bonus TS output)

.PARAMETER StoreName
    The name of your store (e.g., "Shoe Vault", "TechNova")

.PARAMETER StoreType
    The type of store: physical, digital, food, services, or mixed

.PARAMETER PrimaryColor
    Primary brand color in hex format (e.g., "#FF4500")

.PARAMETER Tagline
    Store tagline / slogan

.PARAMETER StoreEmail
    Support email address

.PARAMETER StorePhone
    Support phone number

.PARAMETER Domain
    Production domain (e.g., "mystore.com"). Leave empty for localhost-only dev.

.PARAMETER GtmId
    Google Tag Manager container ID (e.g., "GTM-XXXXXXX"). Leave empty to disable.

.PARAMETER Ga4Id
    Google Analytics 4 property ID (e.g., "G-XXXXXXXXXX"). Leave empty to disable.

.EXAMPLE
    .\init-new-store.ps1
    # Interactive wizard

.EXAMPLE
    .\init-new-store.ps1 -StoreName "Shoe Vault" -StoreType "physical" -PrimaryColor "#FF4500"
    # Non-interactive with defaults for remaining fields
#>

param(
    [string]$StoreName,
    [ValidateSet("physical", "digital", "food", "services", "mixed")]
    [string]$StoreType,
    [string]$PrimaryColor,
    [string]$Tagline,
    [string]$StoreEmail,
    [string]$StorePhone,
    [string]$Domain,
    [string]$GtmId,
    [string]$Ga4Id
)

# ============================================================================
# Bootstrap — dot-source shared helpers
# ============================================================================
. "$PSScriptRoot\..\lib\Config.ps1"
. "$PSScriptRoot\..\lib\Display.ps1"

$infraDir = Split-Path -Parent $PSScriptRoot          # infra/
$repoRoot = Split-Path -Parent $infraDir              # saleor-platform/

# Colors for output
$colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error   = "Red"
    Info    = "Cyan"
    Prompt  = "Magenta"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Get-UserInput {
    param(
        [string]$Prompt,
        [string]$Default = "",
        [string[]]$ValidOptions = @()
    )

    $displayPrompt = $Prompt
    if ($Default) {
        $displayPrompt = "$Prompt [default: $Default]"
    }
    if ($ValidOptions.Count -gt 0) {
        $displayPrompt = "$displayPrompt (options: $($ValidOptions -join ', '))"
    }

    Write-Host "$displayPrompt`: " -ForegroundColor $colors.Prompt -NoNewline
    $input = Read-Host

    if ([string]::IsNullOrWhiteSpace($input)) {
        return $Default
    }

    if ($ValidOptions.Count -gt 0 -and $input -notin $ValidOptions) {
        Write-ColorOutput "Invalid option. Please choose from: $($ValidOptions -join ', ')" $colors.Error
        return Get-UserInput -Prompt $Prompt -Default $Default -ValidOptions $ValidOptions
    }

    return $input
}

function Get-StoreSlug {
    param([string]$Name)
    return $Name.ToLower() -replace '[^a-z0-9]', '-' -replace '-+', '-' -replace '^-|-$', ''
}

# ============================================================================
# Input Validation
# ============================================================================
function Test-EmailFormat([string]$Value) {
    return $Value -match '^[^@\s]+@[^@\s]+\.[^@\s]+$'
}

function Test-HexColor([string]$Value) {
    return $Value -match '^#[0-9A-Fa-f]{6}$'
}

function Test-DomainFormat([string]$Value) {
    if (-not $Value) { return $true }  # Empty is valid (optional)
    return $Value -match '^[a-z0-9]([a-z0-9\-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]*[a-z0-9])?)*\.[a-z]{2,}$'
}

function Test-GtmId([string]$Value) {
    if (-not $Value) { return $true }  # Empty is valid (optional)
    return $Value -match '^GTM-[A-Z0-9]+$'
}

function Test-Ga4Id([string]$Value) {
    if (-not $Value) { return $true }  # Empty is valid (optional)
    return $Value -match '^G-[A-Z0-9]+$'
}

function Show-Banner {
    $banner = @"

 ███████╗ █████╗ ██╗     ███████╗ ██████╗ ██████╗
 ██╔════╝██╔══██╗██║     ██╔════╝██╔═══██╗██╔══██╗
 ███████╗███████║██║     █████╗  ██║   ██║██████╔╝
 ╚════██║██╔══██║██║     ██╔══╝  ██║   ██║██╔══██╗
 ███████║██║  ██║███████╗███████╗╚██████╔╝██║  ██║
 ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝

 ████████╗███████╗███╗   ███╗██████╗ ██╗      █████╗ ████████╗███████╗
 ╚══██╔══╝██╔════╝████╗ ████║██╔══██╗██║     ██╔══██╗╚══██╔══╝██╔════╝
    ██║   █████╗  ██╔████╔██║██████╔╝██║     ███████║   ██║   █████╗
    ██║   ██╔══╝  ██║╚██╔╝██║██╔═══╝ ██║     ██╔══██║   ██║   ██╔══╝
    ██║   ███████╗██║ ╚═╝ ██║██║     ███████╗██║  ██║   ██║   ███████╗
    ╚═╝   ╚══════╝╚═╝     ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝

          Store Hydration Wizard
"@
    Write-Host $banner -ForegroundColor Cyan
    Write-Host ""
}

# ============================================================================
# Interactive wizard
# ============================================================================
Clear-Host
Show-Banner

Write-ColorOutput "Welcome to the Saleor Platform Store Initializer!" $colors.Info
Write-ColorOutput "This wizard will rebrand your entire platform in one step.`n" $colors.Info

# --- 1. Store Name ---
if (-not $StoreName) {
    $StoreName = Get-UserInput -Prompt "Store Name" -Default "My Awesome Store"
}

# --- 2. Store Type ---
if (-not $StoreType) {
    Write-ColorOutput "`nStore Types:" $colors.Info
    Write-ColorOutput "  physical  - Traditional retail (clothing, electronics, sports gear)" "White"
    Write-ColorOutput "  digital   - Downloadable products (software, ebooks, music)" "White"
    Write-ColorOutput "  food      - Food & grocery (restaurants, groceries, meal kits)" "White"
    Write-ColorOutput "  services  - Service businesses (consulting, appointments)" "White"
    Write-ColorOutput "  mixed     - Combination of above" "White"
    Write-Host ""
    $StoreType = Get-UserInput -Prompt "Store Type" -Default "physical" -ValidOptions @("physical", "digital", "food", "services", "mixed")
}

# --- 3. Primary Color ---
if (-not $PrimaryColor) {
    Write-ColorOutput "`nSuggested colors by store type:" $colors.Info
    Write-ColorOutput "  Sports/Physical: #FF4500 (Orange-Red)" "White"
    Write-ColorOutput "  Tech/Digital:    #3B82F6 (Blue)" "White"
    Write-ColorOutput "  Food/Grocery:    #22C55E (Green)" "White"
    Write-ColorOutput "  Services:        #8B5CF6 (Purple)" "White"
    Write-ColorOutput "  Fashion:         #EC4899 (Pink)" "White"
    Write-Host ""
    do {
        $PrimaryColor = Get-UserInput -Prompt "Primary Brand Color (hex)" -Default "#2563EB"
        if (-not (Test-HexColor $PrimaryColor)) {
            Write-ColorOutput "  Invalid hex color format. Expected format: #RRGGBB (e.g., #FF4500). Please try again." $colors.Warning
            $PrimaryColor = ""
        }
    } while (-not $PrimaryColor)
}

# --- 4. Tagline ---
if (-not $Tagline) {
    $Tagline = Get-UserInput -Prompt "Store Tagline" -Default "Your Perfect Shopping Destination"
}

# --- 5. Email ---
$StoreSlug = Get-StoreSlug -Name $StoreName
if (-not $StoreEmail) {
    do {
        $StoreEmail = Get-UserInput -Prompt "Support Email" -Default "support@$StoreSlug.com"
        if (-not (Test-EmailFormat $StoreEmail)) {
            Write-ColorOutput "  Invalid email format. Please try again." $colors.Warning
            $StoreEmail = ""
        }
    } while (-not $StoreEmail)
}

# --- 6. Phone ---
if (-not $StorePhone) {
    $StorePhone = Get-UserInput -Prompt "Support Phone" -Default "+1 (555) 123-4567"
}

# --- 7. Domain ---
if (-not $PSBoundParameters.ContainsKey('Domain')) {
    Write-ColorOutput "`nProduction domain (leave empty for localhost-only dev):" $colors.Info
    do {
        $Domain = Get-UserInput -Prompt "Domain (e.g., mystore.com)" -Default ""
        if (-not (Test-DomainFormat $Domain)) {
            Write-ColorOutput "  Invalid domain format. Expected format: mystore.com. Please try again." $colors.Warning
            $Domain = $null
        }
    } while ($null -eq $Domain)
}

# --- 8. GTM Container ID ---
if (-not $PSBoundParameters.ContainsKey('GtmId')) {
    do {
        $GtmId = Get-UserInput -Prompt "GTM Container ID (e.g., GTM-XXXXXXX, empty to disable)" -Default ""
        if (-not (Test-GtmId $GtmId)) {
            Write-ColorOutput "  Invalid GTM ID format. Expected format: GTM-XXXXXXX. Please try again." $colors.Warning
            $GtmId = $null
        }
    } while ($null -eq $GtmId)
}

# --- 9. GA4 Property ID ---
if (-not $PSBoundParameters.ContainsKey('Ga4Id')) {
    do {
        $Ga4Id = Get-UserInput -Prompt "GA4 Property ID (e.g., G-XXXXXXXXXX, empty to disable)" -Default ""
        if (-not (Test-Ga4Id $Ga4Id)) {
            Write-ColorOutput "  Invalid GA4 ID format. Expected format: G-XXXXXXXXXX. Please try again." $colors.Warning
            $Ga4Id = $null
        }
    } while ($null -eq $Ga4Id)
}

# --- 10. Admin credentials (optional — defaults used for dev) ---
$AdminEmail = ""
$AdminPassword = ""
$envPath = Join-Path (Split-Path $PSScriptRoot -Parent) ".env"
if (Test-Path $envPath) {
    # Read current values
    $currentEmail = (Select-String -Path $envPath -Pattern "^AURA_ADMIN_EMAIL=(.*)$" | ForEach-Object { $_.Matches.Groups[1].Value })
    $currentPass  = (Select-String -Path $envPath -Pattern "^AURA_ADMIN_PASSWORD=(.*)$" | ForEach-Object { $_.Matches.Groups[1].Value })

    # Only prompt if values are still defaults
    if (-not $currentEmail -or $currentEmail -eq "admin@localhost" -or $currentEmail -match "__.*__") {
        Write-ColorOutput "`nAdmin account (for Dashboard login):" $colors.Info
        $AdminEmail = Get-UserInput -Prompt "Admin Email" -Default $StoreEmail
        $AdminPassword = Get-UserInput -Prompt "Admin Password" -Default "admin"
    }
}

# ============================================================================
# Confirmation summary
# ============================================================================
Write-Host ""
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $colors.Info
Write-ColorOutput "  Store Configuration Summary" $colors.Info
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $colors.Info
Write-Host "  Name:         " -NoNewline; Write-ColorOutput $StoreName $colors.Success
Write-Host "  Slug:         " -NoNewline; Write-ColorOutput $StoreSlug $colors.Success
Write-Host "  Type:         " -NoNewline; Write-ColorOutput $StoreType $colors.Success
Write-Host "  Tagline:      " -NoNewline; Write-ColorOutput $Tagline $colors.Success
Write-Host "  Color:        " -NoNewline; Write-ColorOutput $PrimaryColor $colors.Success
Write-Host "  Email:        " -NoNewline; Write-ColorOutput $StoreEmail $colors.Success
Write-Host "  Phone:        " -NoNewline; Write-ColorOutput $StorePhone $colors.Success
Write-Host "  Domain:       " -NoNewline; Write-ColorOutput $(if ($Domain) { $Domain } else { "(none - localhost dev)" }) $colors.Success
Write-Host "  GTM ID:       " -NoNewline; Write-ColorOutput $(if ($GtmId) { $GtmId } else { "(disabled)" }) $colors.Success
Write-Host "  GA4 ID:       " -NoNewline; Write-ColorOutput $(if ($Ga4Id) { $Ga4Id } else { "(disabled)" }) $colors.Success
if ($AdminEmail) {
    Write-Host "  Admin Email:  " -NoNewline; Write-ColorOutput $AdminEmail $colors.Success
    Write-Host "  Admin Pass:   " -NoNewline; Write-ColorOutput "********" $colors.Success
}
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $colors.Info
Write-Host ""

$confirm = Get-UserInput -Prompt "Hydrate platform with these settings? (y/n)" -Default "y" -ValidOptions @("y", "n", "yes", "no")
if ($confirm -notmatch "^y") {
    Write-ColorOutput "Operation cancelled." $colors.Warning
    exit 0
}

# ============================================================================
# Hydration — track modified files for final summary
# ============================================================================
$modifiedFiles = @()
$totalSteps = 8
$currentStep = 0

Write-Host ""
Write-ColorOutput "Hydrating platform files..." $colors.Info
Write-Host ""

# --------------------------------------------------------------------------
# 1. platform.yml
# --------------------------------------------------------------------------
$currentStep++
Write-Step -Current $currentStep -Total $totalSteps -Message "Updating infra/platform.yml"

$platformYmlPath = Join-Path $infraDir "platform.yml"
if (Test-Path $platformYmlPath) {
    # Ensure powershell-yaml is available
    if (-not (Get-Module -ListAvailable -Name powershell-yaml)) {
        Write-Host "  Installing powershell-yaml module..." -ForegroundColor Yellow
        Install-Module powershell-yaml -Scope CurrentUser -Force -AllowClobber
    }
    Import-Module powershell-yaml -ErrorAction Stop

    $yamlContent = Get-Content $platformYmlPath -Raw
    $config = ConvertFrom-Yaml $yamlContent -Ordered

    # Platform section
    $config.platform.name = "$StoreName Platform"
    if ($Domain) {
        $config.platform.domain = $Domain
    }
    $config.platform.tunnel_name = $StoreSlug

    # Store section
    $config.store.name = $StoreName
    $config.store.slug = $StoreSlug
    $config.store.tagline = $Tagline
    $config.store.type = $StoreType
    $config.store.email = $StoreEmail
    $config.store.phone = $StorePhone
    $config.store.colors.primary = $PrimaryColor

    # Analytics
    if ($GtmId) { $config.store.analytics.gtm_id = $GtmId } else { $config.store.analytics.gtm_id = "" }
    if ($Ga4Id) { $config.store.analytics.ga4_id = $Ga4Id } else { $config.store.analytics.ga4_id = "" }

    # Update container names with COMPOSE_PREFIX (defaults to store slug)
    $containerPrefix = $StoreSlug
    foreach ($svcKey in @($config.services.Keys)) {
        $svc = $config.services[$svcKey]
        if ($svc.container) {
            # Replace any existing prefix (everything before first dash-known-suffix)
            $svc.container = $svc.container -replace '^[^-]+-', "$containerPrefix-"
        }
    }

    # ConvertTo-Yaml strips comments — prepend the header comment back
    $yamlHeader = @"
# ============================================================================
# Aura E-Commerce Platform — Service Registry
# ============================================================================
# Single source of truth for all services, ports, containers, and tunnels.
# Used by platform.ps1 and all infra scripts.
# ============================================================================

"@
    $newYaml = $yamlHeader + (ConvertTo-Yaml $config)
    [System.IO.File]::WriteAllText($platformYmlPath, $newYaml, [System.Text.UTF8Encoding]::new($false))

    Write-Success "infra/platform.yml"
    $modifiedFiles += $platformYmlPath
} else {
    Write-Warn "infra/platform.yml not found — skipped"
}

# --------------------------------------------------------------------------
# 2. env-template.txt — update PLATFORM_DOMAIN= line
# --------------------------------------------------------------------------
$currentStep++
Write-Step -Current $currentStep -Total $totalSteps -Message "Updating infra/env-template.txt"

$envTemplatePath = Join-Path $infraDir "env-template.txt"
if (Test-Path $envTemplatePath) {
    $templateContent = Get-Content $envTemplatePath -Raw
    if ($Domain) {
        $templateContent = $templateContent -replace '(?m)^PLATFORM_DOMAIN=.*$', "PLATFORM_DOMAIN=$Domain"
    }
    # Also update SMTP_FROM_NAME
    $templateContent = $templateContent -replace '(?m)^SMTP_FROM_NAME=.*$', "SMTP_FROM_NAME=`"$StoreName`""
    [System.IO.File]::WriteAllText($envTemplatePath, $templateContent, [System.Text.UTF8Encoding]::new($false))

    Write-Success "infra/env-template.txt"
    $modifiedFiles += $envTemplatePath
} else {
    Write-Warn "infra/env-template.txt not found — skipped"
}

# --------------------------------------------------------------------------
# 3. .env (if exists) — update select variables
# --------------------------------------------------------------------------
$currentStep++
Write-Step -Current $currentStep -Total $totalSteps -Message "Updating infra/.env"

$envPath = Join-Path $infraDir ".env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw

    # COMPOSE_PREFIX — Docker container name prefix (derived from store slug)
    if ($envContent -match '(?m)^COMPOSE_PREFIX=') {
        $envContent = $envContent -replace '(?m)^COMPOSE_PREFIX=.*$', "COMPOSE_PREFIX=$StoreSlug"
    } else {
        $envContent = $envContent.TrimEnd() + "`nCOMPOSE_PREFIX=$StoreSlug`n"
    }

    # COMPOSE_PROJECT_NAME — Docker volume/network namespace
    if ($envContent -match '(?m)^COMPOSE_PROJECT_NAME=') {
        $envContent = $envContent -replace '(?m)^COMPOSE_PROJECT_NAME=.*$', "COMPOSE_PROJECT_NAME=$StoreSlug"
    } else {
        $envContent = $envContent.TrimEnd() + "`nCOMPOSE_PROJECT_NAME=$StoreSlug`n"
    }

    # PLATFORM_DOMAIN
    if ($Domain) {
        if ($envContent -match '(?m)^PLATFORM_DOMAIN=') {
            $envContent = $envContent -replace '(?m)^PLATFORM_DOMAIN=.*$', "PLATFORM_DOMAIN=$Domain"
        } else {
            $envContent = $envContent.TrimEnd() + "`nPLATFORM_DOMAIN=$Domain`n"
        }
    }

    # VITE_STORE_NAME
    if ($envContent -match '(?m)^VITE_STORE_NAME=') {
        $envContent = $envContent -replace '(?m)^VITE_STORE_NAME=.*$', "VITE_STORE_NAME=$StoreName"
    } else {
        $envContent = $envContent.TrimEnd() + "`nVITE_STORE_NAME=$StoreName`n"
    }

    # VITE_PLATFORM_NAME
    if ($envContent -match '(?m)^VITE_PLATFORM_NAME=') {
        $envContent = $envContent -replace '(?m)^VITE_PLATFORM_NAME=.*$', "VITE_PLATFORM_NAME=$StoreName Platform"
    } else {
        $envContent = $envContent.TrimEnd() + "`nVITE_PLATFORM_NAME=$StoreName Platform`n"
    }

    # SMTP_FROM_NAME
    $envContent = $envContent -replace '(?m)^SMTP_FROM_NAME=.*$', "SMTP_FROM_NAME=`"$StoreName`""

    # NEXT_PUBLIC_IMAGE_DOMAINS — only update if Domain is set and the line exists
    if ($Domain -and ($envContent -match '(?m)^NEXT_PUBLIC_IMAGE_DOMAINS=')) {
        $envContent = $envContent -replace '(?m)^NEXT_PUBLIC_IMAGE_DOMAINS=.*$', "NEXT_PUBLIC_IMAGE_DOMAINS=$Domain"
    }

    # DEFAULT_FROM_EMAIL and CONTACT_EMAIL — update if Domain is set
    if ($Domain) {
        $envContent = $envContent -replace '(?m)^DEFAULT_FROM_EMAIL=.*$', "DEFAULT_FROM_EMAIL=noreply@$Domain"
        $envContent = $envContent -replace '(?m)^CONTACT_EMAIL=.*$', "CONTACT_EMAIL=$StoreEmail"
    }

    # Admin credentials — only update if collected and different from defaults
    if ($AdminEmail -and $AdminEmail -ne "admin@localhost") {
        $envContent = $envContent -replace '(?m)^AURA_ADMIN_EMAIL=.*$', "AURA_ADMIN_EMAIL=$AdminEmail"
    }
    if ($AdminPassword -and $AdminPassword -ne "admin") {
        $envContent = $envContent -replace '(?m)^AURA_ADMIN_PASSWORD=.*$', "AURA_ADMIN_PASSWORD=$AdminPassword"
    }

    [System.IO.File]::WriteAllText($envPath, $envContent, [System.Text.UTF8Encoding]::new($false))

    Write-Success "infra/.env"
    $modifiedFiles += $envPath
} else {
    Write-Warn "infra/.env not found — skipped (copy env-template.txt to .env first)"
}

# --------------------------------------------------------------------------
# 4. sample-config-import-en.json (English / USD)
# --------------------------------------------------------------------------
$currentStep++
Write-Step -Current $currentStep -Total $totalSteps -Message "Updating sample-config-import-en.json"

$sampleEnPath = Join-Path $repoRoot "apps\apps\storefront-control\sample-config-import-en.json"
if (Test-Path $sampleEnPath) {
    $jsonEn = Get-Content $sampleEnPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $jsonEn.config.store.name    = $StoreName
    $jsonEn.config.store.tagline = $Tagline
    $jsonEn.config.store.email   = $StoreEmail
    $jsonEn.config.store.phone   = $StorePhone
    $jsonEn.config.branding.colors.primary = $PrimaryColor
    $jsonEn.config.branding.logoAlt        = "$StoreName Logo"

    $jsonStr = $jsonEn | ConvertTo-Json -Depth 30
    [System.IO.File]::WriteAllText($sampleEnPath, $jsonStr, [System.Text.UTF8Encoding]::new($false))

    Write-Success "sample-config-import-en.json"
    $modifiedFiles += $sampleEnPath
} else {
    Write-Warn "sample-config-import-en.json not found — skipped"
}

# --------------------------------------------------------------------------
# 5. sample-config-import.json (Hebrew / ILS)
# --------------------------------------------------------------------------
$currentStep++
Write-Step -Current $currentStep -Total $totalSteps -Message "Updating sample-config-import.json"

$sampleHePath = Join-Path $repoRoot "apps\apps\storefront-control\sample-config-import.json"
if (Test-Path $sampleHePath) {
    $jsonHe = Get-Content $sampleHePath -Raw -Encoding UTF8 | ConvertFrom-Json
    $jsonHe.config.store.name    = $StoreName
    $jsonHe.config.store.email   = $StoreEmail
    $jsonHe.config.store.phone   = $StorePhone
    $jsonHe.config.branding.colors.primary = $PrimaryColor
    $jsonHe.config.branding.logoAlt        = "$StoreName Logo"
    # NOTE: tagline is intentionally NOT overwritten in the Hebrew sample —
    # the Hebrew tagline should be translated manually. Store name, email,
    # phone, color, and logoAlt are language-neutral so they get updated.

    $jsonStr = $jsonHe | ConvertTo-Json -Depth 30
    [System.IO.File]::WriteAllText($sampleHePath, $jsonStr, [System.Text.UTF8Encoding]::new($false))

    Write-Success "sample-config-import.json"
    $modifiedFiles += $sampleHePath
} else {
    Write-Warn "sample-config-import.json not found — skipped"
}

# --------------------------------------------------------------------------
# 6. storefront/storefront-cms-config.json (both channels)
# --------------------------------------------------------------------------
$currentStep++
Write-Step -Current $currentStep -Total $totalSteps -Message "Updating storefront-cms-config.json"

$cmsConfigPath = Join-Path $repoRoot "storefront\storefront-cms-config.json"
if (Test-Path $cmsConfigPath) {
    $cmsJson = Get-Content $cmsConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json

    # Update every channel sub-object
    foreach ($channelKey in @($cmsJson.channels.PSObject.Properties.Name)) {
        $ch = $cmsJson.channels.$channelKey

        # store identity
        $ch.store.name  = $StoreName
        $ch.store.email = $StoreEmail
        $ch.store.phone = $StorePhone
        $ch.store.type  = $StoreType

        # Only overwrite tagline for the English/USD channel;
        # ILS channel tagline stays (Hebrew translation)
        if ($channelKey -eq "usd") {
            $ch.store.tagline = $Tagline
        }

        # branding
        $ch.branding.colors.primary = $PrimaryColor
        $ch.branding.logoAlt        = "$StoreName Logo"
    }

    $jsonStr = $cmsJson | ConvertTo-Json -Depth 30
    [System.IO.File]::WriteAllText($cmsConfigPath, $jsonStr, [System.Text.UTF8Encoding]::new($false))

    Write-Success "storefront/storefront-cms-config.json"
    $modifiedFiles += $cmsConfigPath
} else {
    Write-Warn "storefront/storefront-cms-config.json not found — skipped"
}

# --------------------------------------------------------------------------
# 7. Cloudflared config (if domain provided)
# --------------------------------------------------------------------------
$currentStep++
Write-Step -Current $currentStep -Total $totalSteps -Message "Cloudflared tunnel config"

if ($Domain) {
    $platformPs1 = Join-Path $infraDir "platform.ps1"
    if (Test-Path $platformPs1) {
        try {
            & $platformPs1 generate-tunnel-config -Domain $Domain
            Write-Success "Cloudflared config regenerated for $Domain"
        } catch {
            Write-Warn "Cloudflared config generation failed: $_"
        }
    } else {
        Write-Warn "infra/platform.ps1 not found — skipped cloudflared config"
    }
} else {
    Write-Info "No domain provided — skipped cloudflared config"
}

# --------------------------------------------------------------------------
# 8. Bonus: TypeScript config in storefront/src/config/stores/
# --------------------------------------------------------------------------
$currentStep++
Write-Step -Current $currentStep -Total $totalSteps -Message "Generating TypeScript store config"

$ConfigFileName = "$StoreSlug.config.ts"
$ConfigPath = Join-Path $repoRoot "storefront\src\config\stores"

if (-not (Test-Path $ConfigPath)) {
    New-Item -ItemType Directory -Path $ConfigPath -Force | Out-Null
}

$configContent = @"
/**
 * $StoreName - Store Configuration
 * ================================
 * Generated by init-new-store.ps1
 * Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
 * Store Type: $StoreType
 */

import { createStoreConfig, StoreConfig } from '../store.config';

export const ${StoreSlug}Config: StoreConfig = createStoreConfig('$StoreType', {
  store: {
    name: "$StoreName",
    tagline: "$Tagline",
    type: "$StoreType",
    description: "Welcome to $StoreName - $Tagline",
    email: "$StoreEmail",
    phone: "$StorePhone",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  },

  branding: {
    logo: "/logo.svg",
    logoAlt: "$StoreName Logo",
    favicon: "/favicon.ico",

    colors: {
      primary: "$PrimaryColor",
      secondary: "#1F2937",
      accent: "#F59E0B",
      background: "#FFFFFF",
      surface: "#F9FAFB",
      text: "#111827",
      textMuted: "#6B7280",
      success: "#059669",
      warning: "#D97706",
      error: "#DC2626",
    },

    typography: {
      fontHeading: "Inter",
      fontBody: "Inter",
      fontMono: "JetBrains Mono",
    },

    style: {
      borderRadius: "md",
      buttonStyle: "solid",
      cardShadow: "sm",
    },
  },

  seo: {
    titleTemplate: "%s | $StoreName",
    defaultTitle: "$StoreName - $Tagline",
    defaultDescription: "Shop at $StoreName. $Tagline",
    defaultImage: "/og-image.jpg",
    twitterHandle: null,
  },

  integrations: {
    analytics: {
      googleAnalyticsId: $(if ($Ga4Id) { "`"$Ga4Id`"" } else { "null" }),
      googleTagManagerId: $(if ($GtmId) { "`"$GtmId`"" } else { "null" }),
      facebookPixelId: null,
      hotjarId: null,
    },
    marketing: {
      mailchimpListId: null,
      klaviyoApiKey: null,
    },
    support: {
      intercomAppId: null,
      zendeskKey: null,
      crispWebsiteId: null,
    },
    social: {
      facebook: null,
      instagram: null,
      twitter: null,
      youtube: null,
      tiktok: null,
      pinterest: null,
    },
  },

  localization: {
    defaultLocale: "en-US",
    supportedLocales: ["en-US"],
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  },
});

export default ${StoreSlug}Config;
"@

$fullConfigPath = Join-Path $ConfigPath $ConfigFileName
[System.IO.File]::WriteAllText($fullConfigPath, $configContent, [System.Text.UTF8Encoding]::new($false))
Write-Success "storefront/src/config/stores/$ConfigFileName"
$modifiedFiles += $fullConfigPath

# --------------------------------------------------------------------------
# Catalog Generator config.yml — update shop name
# --------------------------------------------------------------------------
$catalogConfigPath = Join-Path $repoRoot "scripts" "catalog-generator" "config.yml"
if (Test-Path $catalogConfigPath) {
    $catalogContent = Get-Content $catalogConfigPath -Raw
    # Replace the shop name line (YAML format: name: "value")
    $catalogContent = $catalogContent -replace '(?m)^(\s*name:\s*)"[^"]*"', "`$1`"$StoreName`""
    [System.IO.File]::WriteAllText($catalogConfigPath, $catalogContent, [System.Text.UTF8Encoding]::new($false))
    Write-Success "scripts/catalog-generator/config.yml (shop name)"
    $modifiedFiles += $catalogConfigPath
}

# --------------------------------------------------------------------------
# Update CLAUDE.md project overview
# --------------------------------------------------------------------------
$claudeMdPath = Join-Path $repoRoot "CLAUDE.md"
if (Test-Path $claudeMdPath) {
    $claudeContent = Get-Content $claudeMdPath -Raw
    # Update the project overview line to mention current store
    if ($claudeContent -match 'Current store: [^.]+\.') {
        $claudeContent = $claudeContent -replace 'Current store: [^.]+\.', "Current store: $StoreName."
    } elseif ($claudeContent -match 'modular app ecosystem\.') {
        $claudeContent = $claudeContent -replace 'modular app ecosystem\.', "modular app ecosystem. Current store: $StoreName."
    }
    [System.IO.File]::WriteAllText($claudeMdPath, $claudeContent, [System.Text.UTF8Encoding]::new($false))
    Write-Success "CLAUDE.md (project overview)"
    $modifiedFiles += $claudeMdPath
}

# ============================================================================
# Final summary
# ============================================================================
Write-Host ""
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $colors.Success
Write-ColorOutput "  Store Hydration Complete!" $colors.Success
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $colors.Success
Write-Host ""

Write-ColorOutput "Modified files:" $colors.Info
foreach ($f in $modifiedFiles) {
    $relative = $f
    if ($f.StartsWith($repoRoot)) {
        $relative = $f.Substring($repoRoot.Length + 1)
    }
    Write-Host "  [OK] " -NoNewline -ForegroundColor Green
    Write-Host $relative
}

Write-Host ""
Write-ColorOutput "Docker prefix: $StoreSlug" $colors.Info
Write-ColorOutput "  Container names:  $StoreSlug-api-dev, $StoreSlug-storefront-dev, ..." "Gray"
Write-ColorOutput "  docker exec:      docker exec -it $StoreSlug-api-dev ..." "Gray"
Write-Host ""

Write-ColorOutput "Next Steps:" $colors.Info
$stepNum = 1
Write-ColorOutput "  $stepNum. Add your logo:       storefront\public\logo.svg" "White"; $stepNum++
Write-ColorOutput "  $stepNum. Add favicon:         storefront\public\favicon.ico" "White"; $stepNum++
if ($Domain) {
    Write-ColorOutput "  $stepNum. Set up DNS:          Point *.$Domain to your Cloudflare tunnel" "White"; $stepNum++
    Write-ColorOutput "  $stepNum. Start platform:      .\infra\platform.ps1 up -Mode selfhosted" "White"; $stepNum++
} else {
    Write-ColorOutput "  $stepNum. Start platform:      .\infra\platform.ps1 up" "White"; $stepNum++
    Write-ColorOutput "  $stepNum. View your store:     http://localhost:3000" "White"; $stepNum++
}
Write-ColorOutput "  $stepNum. Install apps:        .\infra\platform.ps1 install-apps" "White"; $stepNum++
Write-ColorOutput "  $stepNum. Update Hebrew text:  Edit sample-config-import.json tagline + description" "White"; $stepNum++
Write-ColorOutput "  $stepNum. Catalog setup:       cd scripts\catalog-generator && CATALOG_TEMPLATE=starter npm run generate" "White"; $stepNum++
Write-ColorOutput "  $stepNum. Payment setup:       Configure Stripe/PayPal keys in Dashboard > Extensions" "White"; $stepNum++
Write-Host ""
Write-ColorOutput "Full guide: SETUP-GUIDE.md | CLONE-GUIDE.md" $colors.Info
Write-ColorOutput "To rebrand again, simply re-run this script with new values." $colors.Info
Write-Host ""
