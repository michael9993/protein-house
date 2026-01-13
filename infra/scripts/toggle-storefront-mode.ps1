# ============================================================================
# TOGGLE STOREFRONT BUILD MODE
# ============================================================================
# This script toggles between dev and production build modes for the storefront
# Usage:
#   .\scripts\toggle-storefront-mode.ps1 production  # Switch to production
#   .\scripts\toggle-storefront-mode.ps1 dev         # Switch to dev
#   .\scripts\toggle-storefront-mode.ps1             # Toggle current mode
# ============================================================================

param(
    [Parameter(Position=0)]
    [ValidateSet("dev", "production", "")]
    [string]$Mode = ""
)

$envFile = Join-Path $PSScriptRoot ".." ".env"
$envTemplate = Join-Path $PSScriptRoot ".." "env-template.txt"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: .env file not found at $envFile" -ForegroundColor Red
    Write-Host "   Please copy env-template.txt to .env first" -ForegroundColor Yellow
    exit 1
}

# Read current .env file
$envContent = Get-Content $envFile -Raw

# Get current mode
$currentMode = "dev"
if ($envContent -match "STOREFRONT_MODE=(\w+)") {
    $currentMode = $matches[1]
}

# Determine new mode
if ($Mode -eq "") {
    # Toggle mode
    $newMode = if ($currentMode -eq "production") { "dev" } else { "production" }
} else {
    $newMode = $Mode
}

# Update or add STOREFRONT_MODE
if ($envContent -match "STOREFRONT_MODE=.*") {
    $envContent = $envContent -replace "STOREFRONT_MODE=.*", "STOREFRONT_MODE=$newMode"
} else {
    # Add after STOREFRONT configuration section
    if ($envContent -match "(SALEOR_APP_TOKEN=.*)") {
        $envContent = $envContent -replace "($matches[1])", "`$1`nSTOREFRONT_MODE=$newMode"
    } else {
        $envContent += "`nSTOREFRONT_MODE=$newMode"
    }
}

# Write back to .env
Set-Content -Path $envFile -Value $envContent -NoNewline

Write-Host "✅ Storefront mode changed: $currentMode → $newMode" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Restart the storefront container:" -ForegroundColor White
Write-Host "      docker compose -f docker-compose.dev.yml restart saleor-storefront" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Or rebuild and restart:" -ForegroundColor White
Write-Host "      docker compose -f docker-compose.dev.yml up -d --build saleor-storefront" -ForegroundColor Gray
Write-Host ""

