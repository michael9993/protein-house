# ============================================================================
# EnvManager.ps1 -- Environment File Management
# ============================================================================
# Read, write, and update .env files. Handles tunnel URL injection and
# mode switching between dev and self-hosted configurations.
#
# Usage:
#   . "$PSScriptRoot\lib\EnvManager.ps1"
#   $env = Read-EnvFile -Path "infra/.env"
#   Set-EnvValue -Path "infra/.env" -Key "API_URL" -Value "https://..."
# ============================================================================

function Read-EnvFile {
    <#
    .SYNOPSIS
    Parses a .env file and returns a hashtable of key=value pairs.
    Comments and blank lines are skipped.
    #>
    param(
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        throw ".env file not found: $Path"
    }

    $result = @{}
    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $idx = $line.IndexOf("=")
            if ($idx -gt 0) {
                $key   = $line.Substring(0, $idx).Trim()
                $value = $line.Substring($idx + 1).Trim()
                $result[$key] = $value
            }
        }
    }
    return $result
}

function Write-EnvFile {
    <#
    .SYNOPSIS
    Updates specific key=value pairs in an existing .env file in-place.
    Keys that don't exist in the file are appended at the end.
    Existing lines with comments and ordering are preserved.
    #>
    param(
        [string]$Path,
        [hashtable]$Values
    )

    if (-not (Test-Path $Path)) {
        throw ".env file not found: $Path"
    }

    $lines = Get-Content $Path
    $updated = @{}

    $newLines = $lines | ForEach-Object {
        $line = $_
        $trimmed = $line.Trim()
        if ($trimmed -and -not $trimmed.StartsWith("#")) {
            $idx = $trimmed.IndexOf("=")
            if ($idx -gt 0) {
                $key = $trimmed.Substring(0, $idx).Trim()
                if ($Values.ContainsKey($key)) {
                    $updated[$key] = $true
                    return "$key=$($Values[$key])"
                }
            }
        }
        return $line
    }

    # Append any keys not found in the file
    foreach ($key in $Values.Keys) {
        if (-not $updated.ContainsKey($key)) {
            $newLines += "$key=$($Values[$key])"
        }
    }

    $newLines | Set-Content $Path -Encoding UTF8
}

function Set-EnvValue {
    <#
    .SYNOPSIS
    Sets a single key=value in a .env file.
    #>
    param(
        [string]$Path,
        [string]$Key,
        [string]$Value
    )

    Write-EnvFile -Path $Path -Values @{ $Key = $Value }
}

function Get-EnvValue {
    <#
    .SYNOPSIS
    Reads and returns the value of a single key from a .env file.
    Returns $null if the key is not found.
    #>
    param(
        [string]$Path,
        [string]$Key
    )

    $env = Read-EnvFile -Path $Path
    return $env[$Key]
}

function Update-TunnelUrls {
    <#
    .SYNOPSIS
    Writes tunnel URLs into the .env file and updates all derived variables
    (PUBLIC_URL, API_URL, NEXT_PUBLIC_SALEOR_API_URL, ALLOWED_HOSTS, etc.).

    TunnelUrls is a hashtable mapping tunnel_env_var names to URLs:
      @{ "SALEOR_API_TUNNEL_URL" = "https://xxx.trycloudflare.com"; ... }
    #>
    param(
        [string]$EnvPath,
        [hashtable]$TunnelUrls
    )

    if (-not (Test-Path $EnvPath)) {
        throw ".env not found: $EnvPath"
    }

    $content = Get-Content $EnvPath -Raw

    # Write the raw tunnel URL vars first
    $updates = @{}
    foreach ($key in $TunnelUrls.Keys) {
        $updates[$key] = $TunnelUrls[$key]
    }

    # Derive standard URL vars from tunnel URLs
    $apiTunnel        = $TunnelUrls["SALEOR_API_TUNNEL_URL"]
    $storefrontTunnel = $TunnelUrls["STOREFRONT_TUNNEL_URL"]
    $dashboardTunnel  = $TunnelUrls["DASHBOARD_TUNNEL_URL"]
    $stripeTunnel     = $TunnelUrls["STRIPE_APP_TUNNEL_URL"]
    $smtpTunnel       = $TunnelUrls["SMTP_APP_TUNNEL_URL"]
    $invoiceTunnel    = $TunnelUrls["INVOICE_APP_TUNNEL_URL"]
    $controlTunnel    = $TunnelUrls["STOREFRONT_CONTROL_APP_TUNNEL_URL"]
    $newsletterTunnel = $TunnelUrls["NEWSLETTER_APP_TUNNEL_URL"]
    $analyticsTunnel  = $TunnelUrls["SALES_ANALYTICS_APP_TUNNEL_URL"]
    $bulkTunnel       = $TunnelUrls["BULK_MANAGER_APP_TUNNEL_URL"]
    $studioTunnel     = $TunnelUrls["IMAGE_STUDIO_APP_TUNNEL_URL"]
    $dropshipTunnel   = $TunnelUrls["DROPSHIP_APP_TUNNEL_URL"]
    $taxTunnel        = $TunnelUrls["TAX_MANAGER_APP_TUNNEL_URL"]
    $paypalTunnel     = $TunnelUrls["PAYPAL_APP_TUNNEL_URL"]

    if ($apiTunnel) {
        $apiUrl = "$apiTunnel/graphql/"
        $updates["PUBLIC_URL"]                   = $apiTunnel
        $updates["API_URL"]                      = $apiUrl
        $updates["VITE_API_URL"]                 = $apiUrl
        $updates["NEXT_PUBLIC_SALEOR_API_URL"]   = $apiUrl
        $updates["SALEOR_API_URL"]               = $apiUrl
    }
    if ($storefrontTunnel) {
        $updates["NEXT_PUBLIC_STOREFRONT_URL"] = $storefrontTunnel
    }
    if ($stripeTunnel) {
        $updates["STRIPE_APP_URL"]          = $stripeTunnel
        $updates["STRIPE_APP_API_BASE_URL"] = $stripeTunnel
    }
    if ($invoiceTunnel) {
        $updates["INVOICE_APP_URL"]          = $invoiceTunnel
        $updates["INVOICE_APP_API_BASE_URL"] = $invoiceTunnel
    }
    if ($controlTunnel) {
        $updates["STOREFRONT_CONTROL_APP_URL"] = $controlTunnel
    }
    if ($newsletterTunnel) {
        $updates["NEWSLETTER_APP_URL"] = $newsletterTunnel
    }
    if ($analyticsTunnel) {
        $updates["SALES_ANALYTICS_APP_URL"] = $analyticsTunnel
    }
    if ($bulkTunnel) {
        $updates["BULK_MANAGER_APP_URL"] = $bulkTunnel
    }
    if ($studioTunnel) {
        $updates["IMAGE_STUDIO_APP_URL"] = $studioTunnel
    }
    if ($dropshipTunnel) {
        $updates["DROPSHIP_APP_URL"] = $dropshipTunnel
    }
    if ($taxTunnel) {
        $updates["TAX_MANAGER_APP_URL"] = $taxTunnel
    }
    if ($paypalTunnel) {
        $updates["PAYPAL_APP_URL"]          = $paypalTunnel
        $updates["PAYPAL_APP_API_BASE_URL"] = $paypalTunnel
    }

    # Collect tunnel domains for ALLOWED_HOSTS
    $tunnelDomains = @()
    foreach ($url in $TunnelUrls.Values) {
        if ($url) {
            try {
                $host = ([System.Uri]$url).Host
                if ($host -and $host -notin $tunnelDomains) {
                    $tunnelDomains += $host
                }
            } catch { }
        }
    }

    # Update ALLOWED_HOSTS
    if ($tunnelDomains.Count -gt 0 -and $content -match "ALLOWED_HOSTS=(.+?)(?:\r?\n|$)") {
        $current = $matches[1].Trim() -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ }
        foreach ($d in $tunnelDomains) {
            if ($d -notin $current) { $current += $d }
        }
        $updates["ALLOWED_HOSTS"] = ($current -join ",")
    }

    # Update ALLOWED_CLIENT_HOSTS
    if ($tunnelDomains.Count -gt 0 -and $content -match "ALLOWED_CLIENT_HOSTS=(.+?)(?:\r?\n|$)") {
        $current = $matches[1].Trim() -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ }
        foreach ($d in $tunnelDomains) {
            if ($d -notin $current) { $current += $d }
        }
        $updates["ALLOWED_CLIENT_HOSTS"] = ($current -join ",")
    }

    Write-EnvFile -Path $EnvPath -Values $updates
    Write-Host "[OK] Tunnel URLs written to $EnvPath." -ForegroundColor Green
}

function Switch-EnvMode {
    <#
    .SYNOPSIS
    Switches the active .env between dev and self-hosted configurations.

    Mode "selfhosted":
      - Backs up current .env to .env.dev-backup
      - Copies .env.self-hosted to .env

    Mode "dev":
      - Restores .env from .env.dev-backup
    #>
    param(
        [string]$InfraDir,
        [string]$Mode   # "selfhosted" or "dev"
    )

    $envFile       = Join-Path $InfraDir ".env"
    $devBackup     = Join-Path $InfraDir ".env.dev-backup"
    $selfHostedEnv = Join-Path $InfraDir ".env.self-hosted"

    switch ($Mode.ToLower()) {
        "selfhosted" {
            if (-not (Test-Path $selfHostedEnv)) {
                throw ".env.self-hosted not found at $selfHostedEnv -- cannot switch to self-hosted mode."
            }
            if (Test-Path $envFile) {
                Copy-Item $envFile $devBackup -Force
                Write-Host "[OK] Dev .env backed up to .env.dev-backup." -ForegroundColor Green
            }
            Copy-Item $selfHostedEnv $envFile -Force
            Write-Host "[OK] Switched to self-hosted .env." -ForegroundColor Green
        }
        "dev" {
            if (-not (Test-Path $devBackup)) {
                Write-Host "[WARN] No .env.dev-backup found -- nothing to restore." -ForegroundColor Yellow
                return
            }
            Copy-Item $devBackup $envFile -Force
            Write-Host "[OK] Dev .env restored from .env.dev-backup." -ForegroundColor Green
        }
        default {
            throw "Unknown mode '$Mode'. Use 'dev' or 'selfhosted'."
        }
    }
}

# Functions are auto-exported when dot-sourced (Export-ModuleMember removed -- only valid in .psm1)
