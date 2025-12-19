<#
.SYNOPSIS
    Initialize a new store from the Saleor Platform template.

.DESCRIPTION
    This script helps you create a new store by:
    1. Copying the template configuration
    2. Setting up store-specific settings
    3. Configuring branding (name, colors, etc.)
    4. Setting up environment variables

.PARAMETER StoreName
    The name of your store (e.g., "Shoe Vault", "TechNova")

.PARAMETER StoreType
    The type of store: physical, digital, food, services, or mixed

.PARAMETER PrimaryColor
    Primary brand color in hex format (e.g., "#FF4500")

.EXAMPLE
    .\init-new-store.ps1 -StoreName "My Sports Store" -StoreType "physical" -PrimaryColor "#FF4500"
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$StoreName,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("physical", "digital", "food", "services", "mixed")]
    [string]$StoreType,
    
    [Parameter(Mandatory=$false)]
    [string]$PrimaryColor,
    
    [Parameter(Mandatory=$false)]
    [string]$StoreEmail,
    
    [Parameter(Mandatory=$false)]
    [string]$StorePhone
)

# Colors for output
$colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Cyan"
    Prompt = "Magenta"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
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
                                                                        
          🚀 Universal E-Commerce Store Initializer
"@
    Write-Host $banner -ForegroundColor Cyan
    Write-Host ""
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

# Main script
Clear-Host
Show-Banner

Write-ColorOutput "Welcome to the Saleor Platform Store Initializer!" $colors.Info
Write-ColorOutput "This wizard will help you set up a new store configuration.`n" $colors.Info

# Collect store information
if (-not $StoreName) {
    $StoreName = Get-UserInput -Prompt "Store Name" -Default "My Awesome Store"
}

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

if (-not $PrimaryColor) {
    Write-ColorOutput "`nSuggested colors by store type:" $colors.Info
    Write-ColorOutput "  Sports:      #FF4500 (Orange-Red)" "White"
    Write-ColorOutput "  Tech:        #3B82F6 (Blue)" "White"
    Write-ColorOutput "  Food:        #22C55E (Green)" "White"
    Write-ColorOutput "  Digital:     #8B5CF6 (Purple)" "White"
    Write-ColorOutput "  Fashion:     #EC4899 (Pink)" "White"
    Write-Host ""
    $PrimaryColor = Get-UserInput -Prompt "Primary Brand Color (hex)" -Default "#2563EB"
}

$StoreTagline = Get-UserInput -Prompt "Store Tagline" -Default "Your Perfect Shopping Destination"

if (-not $StoreEmail) {
    $StoreSlug = Get-StoreSlug -Name $StoreName
    $StoreEmail = Get-UserInput -Prompt "Support Email" -Default "support@$StoreSlug.com"
}

if (-not $StorePhone) {
    $StorePhone = Get-UserInput -Prompt "Support Phone" -Default "+1 (555) 123-4567"
}

# Confirm settings
Write-Host ""
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $colors.Info
Write-ColorOutput "  Store Configuration Summary" $colors.Info
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $colors.Info
Write-Host "  Name:         " -NoNewline; Write-ColorOutput $StoreName $colors.Success
Write-Host "  Type:         " -NoNewline; Write-ColorOutput $StoreType $colors.Success
Write-Host "  Tagline:      " -NoNewline; Write-ColorOutput $StoreTagline $colors.Success
Write-Host "  Color:        " -NoNewline; Write-ColorOutput $PrimaryColor $colors.Success
Write-Host "  Email:        " -NoNewline; Write-ColorOutput $StoreEmail $colors.Success
Write-Host "  Phone:        " -NoNewline; Write-ColorOutput $StorePhone $colors.Success
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $colors.Info
Write-Host ""

$confirm = Get-UserInput -Prompt "Create store configuration? (y/n)" -Default "y" -ValidOptions @("y", "n", "yes", "no")
if ($confirm -notmatch "^y") {
    Write-ColorOutput "Operation cancelled." $colors.Warning
    exit 0
}

# Generate store configuration file
$StoreSlug = Get-StoreSlug -Name $StoreName
$ConfigFileName = "$StoreSlug.config.ts"
$ConfigPath = Join-Path $PSScriptRoot "..\..\storefront\src\config\stores"

# Create stores directory if it doesn't exist
if (-not (Test-Path $ConfigPath)) {
    New-Item -ItemType Directory -Path $ConfigPath -Force | Out-Null
    Write-ColorOutput "Created stores directory: $ConfigPath" $colors.Info
}

# Determine which example to base on
$baseConfig = switch ($StoreType) {
    "digital" { "digital-store.config" }
    "food" { "food-store.config" }
    "services" { "digital-store.config" }  # Services similar to digital
    default { "sports-store.config" }  # Physical uses sports as base
}

# Generate the configuration content
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
    tagline: "$StoreTagline",
    type: "$StoreType",
    description: "Welcome to $StoreName - $StoreTagline",
    email: "$StoreEmail",
    phone: "$StorePhone",
    address: {
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "United States",
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
    defaultTitle: "$StoreName - $StoreTagline",
    defaultDescription: "Shop at $StoreName. $StoreTagline",
    defaultImage: "/og-image.jpg",
    twitterHandle: null,
  },

  integrations: {
    analytics: {
      googleAnalyticsId: null,
      googleTagManagerId: null,
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

# Write configuration file
$fullConfigPath = Join-Path $ConfigPath $ConfigFileName
$configContent | Out-File -FilePath $fullConfigPath -Encoding UTF8
Write-ColorOutput "`n✅ Created store configuration: $fullConfigPath" $colors.Success

# Update the index.ts to use the new config
$indexPath = Join-Path $PSScriptRoot "..\..\storefront\src\config\index.ts"
$indexContent = @"
/**
 * ACTIVE STORE CONFIGURATION
 * ==========================
 * This file exports the active store configuration.
 * 
 * Current Store: $StoreName
 * Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
 */

import { ${StoreSlug}Config } from './stores/$StoreSlug.config';

// ============================================
// ACTIVE CONFIGURATION
// ============================================
export const storeConfig = ${StoreSlug}Config;

// ============================================
// RE-EXPORTS
// ============================================
export {
  type StoreConfig,
  type StoreType,
  createStoreConfig,
  defaultStoreConfig,
  storeTypePresets,
  getThemeCSSVariables,
} from './store.config';

// Export examples for reference
export * from './examples';
"@

$indexContent | Out-File -FilePath $indexPath -Encoding UTF8
Write-ColorOutput "✅ Updated active configuration in index.ts" $colors.Success

# Update SMTP app branding
$smtpBrandingPath = Join-Path $PSScriptRoot "..\..\apps\apps\smtp\src\modules\smtp\default-templates.ts"
if (Test-Path $smtpBrandingPath) {
    Write-ColorOutput "📧 Remember to update email branding in:" $colors.Warning
    Write-ColorOutput "   $smtpBrandingPath" "White"
    Write-ColorOutput "   Change COMPANY_NAME, COMPANY_EMAIL, etc." "White"
}

# Final summary
Write-Host ""
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $colors.Success
Write-ColorOutput "  🎉 Store Configuration Complete!" $colors.Success
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $colors.Success
Write-Host ""
Write-ColorOutput "Next Steps:" $colors.Info
Write-ColorOutput "  1. Review your config: storefront\src\config\stores\$ConfigFileName" "White"
Write-ColorOutput "  2. Add your logo:      storefront\public\logo.svg" "White"
Write-ColorOutput "  3. Add favicon:        storefront\public\favicon.ico" "White"
Write-ColorOutput "  4. Start the server:   cd storefront && pnpm dev" "White"
Write-ColorOutput "  5. View your store:    http://localhost:3000" "White"
Write-Host ""
Write-ColorOutput "To switch back to another store, run this script again or" $colors.Info
Write-ColorOutput "edit storefront\src\config\index.ts" $colors.Info
Write-Host ""

