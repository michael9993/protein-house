# ============================================================================
# Config.ps1 — Platform Configuration Loader
# ============================================================================
# Reads platform.yml and provides helper functions for all platform scripts.
#
# Usage:
#   . "$PSScriptRoot\lib\Config.ps1"
#   $config = Get-PlatformConfig
#   $services = Get-Services
#   $tunnelServices = Get-TunnelServices
#   $apps = Get-SaleorApps
# ============================================================================

function Get-PlatformConfig {
    <#
    .SYNOPSIS
    Loads platform.yml and returns a structured hashtable.
    .DESCRIPTION
    Reads the YAML file, merges with environment variable overrides
    (PLATFORM_DOMAIN, SALEOR_BACKUP_DIR), and returns the full config.
    #>
    param(
        [string]$ConfigPath = ""
    )

    if (-not $ConfigPath) {
        # Auto-detect: look for platform.yml relative to this script
        $scriptDir = $PSScriptRoot
        $infraDir = Split-Path -Parent $scriptDir
        # If we're in infra/lib/, infraDir is infra/
        # If called from elsewhere, try common locations
        $candidates = @(
            (Join-Path $infraDir "platform.yml"),
            (Join-Path $scriptDir "platform.yml"),
            (Join-Path (Split-Path -Parent $infraDir) "infra\platform.yml")
        )
        foreach ($candidate in $candidates) {
            if (Test-Path $candidate) {
                $ConfigPath = $candidate
                break
            }
        }
    }

    if (-not $ConfigPath -or -not (Test-Path $ConfigPath)) {
        throw "platform.yml not found. Searched: $($candidates -join ', ')"
    }

    # Check if powershell-yaml is available
    if (-not (Get-Module -ListAvailable -Name powershell-yaml)) {
        Write-Host "Installing powershell-yaml module..." -ForegroundColor Yellow
        Install-Module powershell-yaml -Scope CurrentUser -Force -AllowClobber
    }
    Import-Module powershell-yaml -ErrorAction Stop

    $yamlContent = Get-Content $ConfigPath -Raw
    $config = ConvertFrom-Yaml $yamlContent

    # Apply environment variable overrides
    if ($env:PLATFORM_DOMAIN) {
        $config.platform.domain = $env:PLATFORM_DOMAIN
    }

    if ($env:SALEOR_BACKUP_DIR) {
        $config.backup.directory = $env:SALEOR_BACKUP_DIR
    }

    return $config
}

function Get-Services {
    <#
    .SYNOPSIS
    Returns all services from platform.yml as a hashtable.
    #>
    param(
        [hashtable]$Config = $null
    )

    if (-not $Config) {
        $Config = Get-PlatformConfig
    }

    return $Config.services
}

function Get-TunnelServices {
    <#
    .SYNOPSIS
    Returns only services that have a subdomain (tunnel-eligible).
    #>
    param(
        [hashtable]$Config = $null
    )

    if (-not $Config) {
        $Config = Get-PlatformConfig
    }

    $result = @{}
    foreach ($key in $Config.services.Keys) {
        $svc = $Config.services[$key]
        if ($svc.subdomain) {
            $result[$key] = $svc
        }
    }
    return $result
}

function Get-SaleorApps {
    <#
    .SYNOPSIS
    Returns only services that have an app_id (Saleor installable apps).
    #>
    param(
        [hashtable]$Config = $null
    )

    if (-not $Config) {
        $Config = Get-PlatformConfig
    }

    $result = @{}
    foreach ($key in $Config.services.Keys) {
        $svc = $Config.services[$key]
        if ($svc.app_id) {
            $result[$key] = $svc
        }
    }
    return $result
}

function Get-HealthCheckServices {
    <#
    .SYNOPSIS
    Returns services that have health_check: true (postgres, redis, api).
    #>
    param(
        [hashtable]$Config = $null
    )

    if (-not $Config) {
        $Config = Get-PlatformConfig
    }

    $result = @{}
    foreach ($key in $Config.services.Keys) {
        $svc = $Config.services[$key]
        if ($svc.health_check) {
            $result[$key] = $svc
        }
    }
    return $result
}

function Get-BackupConfig {
    <#
    .SYNOPSIS
    Returns backup configuration with resolved paths.
    #>
    param(
        [hashtable]$Config = $null
    )

    if (-not $Config) {
        $Config = Get-PlatformConfig
    }

    $backupConfig = $Config.backup.Clone()

    # Resolve ~ in directory path
    if ($backupConfig.directory -match "^~") {
        $backupConfig.directory = $backupConfig.directory -replace "^~", $env:USERPROFILE
    }

    return $backupConfig
}

function Get-ServiceUrl {
    <#
    .SYNOPSIS
    Returns the public URL for a service (tunnel URL if available, else localhost).
    #>
    param(
        [string]$ServiceKey,
        [hashtable]$Config = $null,
        [string]$Mode = "dev"  # "dev" or "selfhosted"
    )

    if (-not $Config) {
        $Config = Get-PlatformConfig
    }

    $svc = $Config.services[$ServiceKey]
    if (-not $svc) {
        throw "Unknown service: $ServiceKey"
    }

    if ($Mode -eq "selfhosted" -and $svc.subdomain) {
        $domain = $Config.platform.domain
        return "https://$($svc.subdomain).$domain"
    }

    # Check for tunnel env var
    if ($svc.tunnel_env_var) {
        $tunnelUrl = [System.Environment]::GetEnvironmentVariable($svc.tunnel_env_var)
        if ($tunnelUrl) {
            return $tunnelUrl
        }
    }

    # Fallback to localhost
    if ($svc.port) {
        return "http://localhost:$($svc.port)"
    }

    return $null
}

# Export for dot-sourcing
Export-ModuleMember -Function @(
    'Get-PlatformConfig',
    'Get-Services',
    'Get-TunnelServices',
    'Get-SaleorApps',
    'Get-HealthCheckServices',
    'Get-BackupConfig',
    'Get-ServiceUrl'
) -ErrorAction SilentlyContinue
