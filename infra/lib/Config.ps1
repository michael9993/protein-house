# ============================================================================
# Config.ps1 -- Platform Configuration Loader
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

    $candidates = @()
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
    } else {
        $candidates = @($ConfigPath)
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

function Get-StoreConfig {
    <#
    .SYNOPSIS
    Returns the store identity section from platform.yml.
    .DESCRIPTION
    Returns name, slug, tagline, type, email, phone, address, colors, analytics.
    #>
    param(
        [hashtable]$Config = $null
    )

    if (-not $Config) {
        $Config = Get-PlatformConfig
    }

    if (-not $Config.store) {
        return @{
            name     = "My Store"
            slug     = "my-store"
            tagline  = "Your Perfect Shopping Destination"
            type     = "physical"
            email    = "support@example.com"
            phone    = "+1 (555) 123-4567"
            colors   = @{ primary = "#2563EB"; secondary = "#1F2937"; accent = "#F59E0B" }
            analytics = @{ gtm_id = ""; ga4_id = "" }
        }
    }

    return $Config.store
}

function Set-StoreConfig {
    <#
    .SYNOPSIS
    Updates the store section in platform.yml.
    .DESCRIPTION
    Reads the YAML, updates the store section, and writes back.
    #>
    param(
        [Parameter(Mandatory)]
        [hashtable]$StoreData,
        [string]$ConfigPath = ""
    )

    if (-not $ConfigPath) {
        $scriptDir = $PSScriptRoot
        $infraDir = Split-Path -Parent $scriptDir
        $ConfigPath = Join-Path $infraDir "platform.yml"
    }

    if (-not (Test-Path $ConfigPath)) {
        throw "platform.yml not found at: $ConfigPath"
    }

    Import-Module powershell-yaml -ErrorAction Stop

    $yamlContent = Get-Content $ConfigPath -Raw
    $config = ConvertFrom-Yaml $yamlContent -Ordered

    $config.store = $StoreData

    # ConvertTo-Yaml strips comments -- prepend the header comment back
    $yamlHeader = "# ============================================================================`n"
    $yamlHeader += "# Aura E-Commerce Platform -- Service Registry`n"
    $yamlHeader += "# ============================================================================`n"
    $yamlHeader += "# Single source of truth for all services, ports, containers, and tunnels.`n"
    $yamlHeader += "# Used by platform.ps1 and all infra scripts.`n"
    $yamlHeader += "# ============================================================================`n`n"

    $newYaml = $yamlHeader + (ConvertTo-Yaml $config)
    [System.IO.File]::WriteAllText($ConfigPath, $newYaml, [System.Text.UTF8Encoding]::new($false))
}

# ---------------------------------------------------------------------------
# Setup state tracking (for idempotent `setup` command)
# ---------------------------------------------------------------------------
function Get-SetupState {
    <#
    .SYNOPSIS
    Reads the setup state file (.setup-state.json). Returns a hashtable of completed steps.
    Returns empty hashtable if file doesn't exist or is corrupt.
    #>
    param([string]$InfraDir)

    $stateFile = Join-Path $InfraDir ".setup-state.json"
    if (Test-Path $stateFile) {
        try {
            $json = Get-Content $stateFile -Raw | ConvertFrom-Json
            $state = @{}
            foreach ($prop in $json.PSObject.Properties) {
                $state[$prop.Name] = $prop.Value
            }
            return $state
        } catch {
            return @{}
        }
    }
    return @{}
}

function Set-SetupState {
    <#
    .SYNOPSIS
    Updates a step in the setup state file. Creates the file if it doesn't exist.
    #>
    param(
        [string]$InfraDir,
        [string]$Step,
        [bool]$Completed = $true
    )

    $stateFile = Join-Path $InfraDir ".setup-state.json"
    $state = Get-SetupState -InfraDir $InfraDir
    $state[$Step] = @{
        completed = $Completed
        timestamp = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    }

    $state | ConvertTo-Json -Depth 3 | Set-Content $stateFile -Encoding UTF8
}

function Test-SetupStep {
    <#
    .SYNOPSIS
    Returns $true if a setup step has been completed AND the result is still valid.
    Validates critical steps by checking actual system state.
    #>
    param(
        [string]$InfraDir,
        [string]$Step,
        [switch]$SkipValidation
    )

    $state = Get-SetupState -InfraDir $InfraDir
    if (-not ($state.ContainsKey($Step) -and $state[$Step].completed -eq $true)) {
        return $false
    }

    # If caller doesn't want validation, trust the state file
    if ($SkipValidation) { return $true }

    # Validate critical steps by checking actual state
    switch ($Step) {
        "init" {
            # Verify .env actually exists
            return (Test-Path (Join-Path $InfraDir ".env"))
        }
        "new_store" {
            # Verify .env has store name (not placeholder)
            $envFile = Join-Path $InfraDir ".env"
            if (-not (Test-Path $envFile)) { return $false }
            $storeName = (Select-String -Path $envFile -Pattern "^VITE_STORE_NAME=(.+)$" | ForEach-Object { $_.Matches.Groups[1].Value })
            return ($storeName -and $storeName -ne "__SET_BY_WIZARD__")
        }
        "docker_up" {
            # Verify API container is actually running
            $status = docker ps --filter "name=saleor-api" --format "{{.Status}}" 2>$null
            return ($status -match "Up")
        }
        "db_init" {
            # Verify API container can reach DB (migrations applied)
            $check = docker exec saleor-api-dev python manage.py showmigrations --plan 2>$null
            if ($LASTEXITCODE -ne 0) { return $false }
            $unapplied = ($check | Where-Object { $_ -match "^\s*\[ \]" }).Count
            return ($unapplied -eq 0)
        }
        default {
            return $true
        }
    }
}

function Reset-SetupState {
    <#
    .SYNOPSIS
    Removes the setup state file, allowing setup to run fresh.
    #>
    param([string]$InfraDir)

    $stateFile = Join-Path $InfraDir ".setup-state.json"
    if (Test-Path $stateFile) {
        Remove-Item $stateFile -Force
    }
}

# Functions are auto-exported when dot-sourced (Export-ModuleMember removed -- only valid in .psm1)
