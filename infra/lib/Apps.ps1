# ============================================================================
# Apps.ps1 -- Saleor App Installation via GraphQL
# ============================================================================
# Authenticates against the Saleor API and installs/reinstalls Saleor apps.
#
# Usage:
#   . "$PSScriptRoot\lib\Apps.ps1"
#   Install-AllApps -Config $config -Email "admin@example.com" -Password "pass"
# ============================================================================

function Get-AuthToken {
    <#
    .SYNOPSIS
    Authenticates with the Saleor API and returns a JWT token string.
    Throws on auth failure.
    #>
    param(
        [string]$GraphQLUrl,
        [string]$Email,
        [string]$Password
    )

    $mutation = @'
mutation TokenAuth($email: String!, $password: String!) {
  tokenCreate(email: $email, password: $password) {
    token
    errors { field message }
  }
}
'@

    $result = Invoke-GraphQL -GraphQLUrl $GraphQLUrl -Token "" -Query $mutation `
        -Variables @{ email = $Email; password = $Password }

    if ($result.data.tokenCreate.errors.Count -gt 0) {
        $err = $result.data.tokenCreate.errors[0]
        throw "Authentication failed: $($err.message) (field: $($err.field))"
    }

    $token = $result.data.tokenCreate.token
    if (-not $token) {
        throw "Authentication failed: no token returned."
    }
    return $token
}

function Invoke-GraphQL {
    <#
    .SYNOPSIS
    Sends a GraphQL query/mutation to the Saleor API.
    Returns the parsed response object. Throws on HTTP errors.
    #>
    param(
        [string]$GraphQLUrl,
        [string]$Token,
        [string]$Query,
        [hashtable]$Variables = @{}
    )

    $body = @{
        query     = $Query
        variables = $Variables
    } | ConvertTo-Json -Depth 10

    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    try {
        $response = Invoke-RestMethod -Uri $GraphQLUrl -Method POST `
            -Headers $headers -Body $body -ErrorAction Stop
        return $response
    } catch {
        throw "GraphQL request to $GraphQLUrl failed: $_"
    }
}

function Get-ExistingApps {
    <#
    .SYNOPSIS
    Returns a list of currently installed apps from Saleor.
    Each item has .id and .identifier fields.
    #>
    param(
        [string]$GraphQLUrl,
        [string]$Token
    )

    $query = @"
query {
  apps(first: 100) {
    edges {
      node {
        id
        identifier
        name
      }
    }
  }
}
"@

    $result = Invoke-GraphQL -GraphQLUrl $GraphQLUrl -Token $Token -Query $query
    if ($result.data.apps.edges) {
        return $result.data.apps.edges | ForEach-Object { $_.node }
    }
    return @()
}

function Install-SaleorApp {
    <#
    .SYNOPSIS
    Installs a single Saleor app from a manifest URL.
    Returns the installed app object, or throws on error.
    #>
    param(
        [string]$GraphQLUrl,
        [string]$Token,
        [string]$ManifestUrl,
        [string]$AppName,
        [string[]]$Permissions = @()
    )

    Write-Host "  Installing $AppName..." -ForegroundColor Yellow
    Write-Host "    Manifest: $ManifestUrl" -ForegroundColor Gray

    $mutation = @'
mutation AppInstall($input: AppInstallInput!) {
  appInstall(input: $input) {
    appInstallation {
      id
      appName
      manifestUrl
      status
    }
    errors {
      field
      message
      code
      permissions
    }
  }
}
'@

    $input = @{
        manifestUrl = $ManifestUrl
        appName     = $AppName
    }
    if ($Permissions.Count -gt 0) {
        $input.permissions = $Permissions
    }
    $variables = @{ input = $input }

    $result = Invoke-GraphQL -GraphQLUrl $GraphQLUrl -Token $Token `
        -Query $mutation -Variables $variables

    $install = $result.data.appInstall
    if ($install.errors -and $install.errors.Count -gt 0) {
        $errMsg = ($install.errors | ForEach-Object { "$($_.message) [$($_.code)]" }) -join "; "
        Write-Host "  [WARN] $AppName install error: $errMsg" -ForegroundColor Yellow
        return $null
    }

    if ($install.appInstallation) {
        Write-Host "  [OK] $AppName queued for installation (status: $($install.appInstallation.status))." -ForegroundColor Green
        return $install.appInstallation
    }

    Write-Host "  [WARN] ${AppName}: no installation object returned." -ForegroundColor Yellow
    return $null
}

function Remove-SaleorApp {
    <#
    .SYNOPSIS
    Removes an installed Saleor app by its GraphQL ID.
    #>
    param(
        [string]$GraphQLUrl,
        [string]$Token,
        [string]$AppId
    )

    $mutation = @'
mutation AppDelete($id: ID!) {
  appDelete(id: $id) {
    app { id name }
    errors { field message }
  }
}
'@

    $result = Invoke-GraphQL -GraphQLUrl $GraphQLUrl -Token $Token `
        -Query $mutation -Variables @{ id = $AppId }

    $del = $result.data.appDelete
    if ($del.errors -and $del.errors.Count -gt 0) {
        $errMsg = ($del.errors | ForEach-Object { $_.message }) -join "; "
        Write-Host "  [WARN] Failed to delete app $AppId : $errMsg" -ForegroundColor Yellow
    } else {
        Write-Host "  [OK] Removed app: $($del.app.name)" -ForegroundColor Green
    }
}

function Remove-DuplicateApps {
    <#
    .SYNOPSIS
    Removes duplicate app installations, keeping only the latest (highest DB id) per identifier.
    When Config is provided (parsed platform.yml), also removes stale apps that match known
    service names but have different identifiers (catches old installs with active webhooks).
    #>
    param(
        [string]$GraphQLUrl,
        [string]$Token,
        $Config = $null
    )

    $rawApps = Get-ExistingApps -GraphQLUrl $GraphQLUrl -Token $Token
    # Force into array
    $apps = @($rawApps)
    Write-Host "Found $($apps.Count) installed app(s)." -ForegroundColor Yellow

    if ($apps.Count -eq 0) {
        Write-Host "No apps found." -ForegroundColor Gray
        return
    }

    # Group by identifier
    $groups = @{}
    foreach ($app in $apps) {
        $key = if ($app.identifier) { $app.identifier } else { $app.name }
        if (-not $groups.ContainsKey($key)) { $groups[$key] = [System.Collections.ArrayList]::new() }
        $null = $groups[$key].Add($app)
    }

    $totalRemoved = 0
    foreach ($key in $groups.Keys) {
        $dupes = $groups[$key]
        if ($dupes.Count -le 1) { continue }

        # Decode DB id from base64 global ID (format: "QXBwOjM1" = "App:35")
        $sorted = $dupes | Sort-Object {
            $decoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_.id))
            [int]($decoded -split ':')[-1]
        } -Descending
        $keep = $sorted[0]
        $toDelete = @($sorted | Select-Object -Skip 1)

        Write-Host "  $key -- keeping '$($keep.name)' (id: $($keep.id)), removing $($toDelete.Count) duplicate(s)" -ForegroundColor Cyan
        foreach ($app in $toDelete) {
            Remove-SaleorApp -GraphQLUrl $GraphQLUrl -Token $Token -AppId $app.id
            $totalRemoved++
        }
    }

    # Second pass: if Config provided, find stale apps matching known service names
    # but with different identifiers (e.g., old installs whose webhooks are still active)
    if ($null -ne $Config) {
        Write-Host ""
        Write-Host "Checking for stale apps by service name..." -ForegroundColor Yellow
        foreach ($svcKey in $Config.services.Keys) {
            $svc = $Config.services[$svcKey]
            if (-not $svc.app_id) { continue }

            # Find ALL apps matching either identifier or name for this service
            $svcAppId = $svc.app_id
            $svcDesc = $svc.description
            $matches = @($apps | Where-Object { $_.identifier -eq $svcAppId -or $_.name -ieq $svcDesc })
            if ($matches.Count -le 1) { continue }

            # Sort by decoded DB ID descending, keep only the latest
            $sorted = $matches | Sort-Object {
                $decoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_.id))
                [int]($decoded -split ':')[-1]
            } -Descending
            $keep = $sorted[0]
            $stale = @($sorted | Select-Object -Skip 1)

            Write-Host "  $svcDesc - keeping (id: $($keep.id)), removing $($stale.Count) stale install(s)" -ForegroundColor Cyan
            foreach ($app in $stale) {
                Write-Host "    Removing stale '$($app.name)' (id: $($app.id), identifier: $($app.identifier))" -ForegroundColor Gray
                Remove-SaleorApp -GraphQLUrl $GraphQLUrl -Token $Token -AppId $app.id
                $totalRemoved++
            }
        }
    }

    Write-Host ""
    if ($totalRemoved -gt 0) {
        Write-Host "[OK] Removed $totalRemoved duplicate/stale app(s)." -ForegroundColor Green
    } else {
        Write-Host "[OK] No duplicates or stale apps found." -ForegroundColor Green
    }
}

function Install-AllApps {
    <#
    .SYNOPSIS
    Installs all Saleor apps defined in platform.yml (services with app_id).
    Reads tunnel URLs from the .env file to build manifest URLs.
    By default, deletes any existing installation of each app first.
    #>
    param(
        [hashtable]$Config,
        [string]$Email,
        [string]$Password,
        [switch]$SkipDelete,
        [string]$EnvPath = "",
        [string[]]$Exclude = @(),
        [string[]]$Include = @()
    )

    # Read .env first (needed for API port and tunnel URLs)
    $envValues = @{}
    if ($EnvPath -and (Test-Path $EnvPath)) {
        $envValues = Read-EnvFile -Path $EnvPath
    }

    # Resolve API URL from env, then config, then default
    $apiPort = if ($envValues["SALEOR_API_PORT"]) { $envValues["SALEOR_API_PORT"] }
               elseif ($Config.services.api.port) { $Config.services.api.port }
               else { "8000" }
    $apiUrl = "http://localhost:${apiPort}/graphql/"

    Write-Host "Connecting to Saleor API at $apiUrl..." -ForegroundColor Yellow
    $token = Get-AuthToken -GraphQLUrl $apiUrl -Email $Email -Password $Password
    Write-Host "[OK] Authenticated." -ForegroundColor Green

    # Get existing apps for deletion
    $existingApps = @()
    if (-not $SkipDelete) {
        $existingApps = Get-ExistingApps -GraphQLUrl $apiUrl -Token $token
    }

    # Iterate over all app services
    $appServices = @{}
    foreach ($key in $Config.services.Keys) {
        $svc = $Config.services[$key]
        if ($svc.app_id) {
            $appServices[$key] = $svc
        }
    }

    $total   = $appServices.Count
    $current = 0

    foreach ($key in $appServices.Keys) {
        $svc = $appServices[$key]
        $current++

        # Include filter -- if set, only matching apps are installed
        if ($Include.Count -gt 0) {
            $match = $false
            foreach ($inc in $Include) {
                if ($key -like "*$inc*" -or $svc.description -like "*$inc*" -or $svc.app_id -like "*$inc*") {
                    $match = $true; break
                }
            }
            if (-not $match) {
                Write-Host "[$current/$total] SKIP $($svc.description) (not included)" -ForegroundColor DarkGray
                continue
            }
        }

        # Skip excluded apps (match by service key or description, case-insensitive)
        if ($Exclude.Count -gt 0) {
            $skip = $false
            foreach ($ex in $Exclude) {
                if ($key -like "*$ex*" -or $svc.description -like "*$ex*" -or $svc.app_id -like "*$ex*") {
                    $skip = $true; break
                }
            }
            if ($skip) {
                Write-Host "[$current/$total] SKIP $($svc.description) (excluded)" -ForegroundColor DarkGray
                continue
            }
        }

        Write-Host "[$current/$total] $($svc.description)" -ForegroundColor Cyan

        # Build manifest URL -- priority:
        # 1. Tunnel URL from .env (via tunnel_env_var in platform.yml)
        # 2. localhost:PORT fallback (for local-only setups)
        $baseUrl = $null
        if ($svc.tunnel_env_var -and $envValues[$svc.tunnel_env_var]) {
            $baseUrl = $envValues[$svc.tunnel_env_var].TrimEnd("/")
        }
        if (-not $baseUrl -and $svc.port) {
            $baseUrl = "http://localhost:$($svc.port)"
        }
        if (-not $baseUrl) {
            Write-Host "  [SKIP] No URL available for $key." -ForegroundColor Gray
            continue
        }

        $manifestUrl = "$baseUrl$($svc.app_manifest_path)"

        # Delete existing if found -- match by identifier OR name (catches stale installs
        # with different identifiers whose webhooks are still active)
        if (-not $SkipDelete) {
            $existing = $existingApps | Where-Object {
                $_.identifier -eq $svc.app_id -or
                $_.name -ieq $svc.description
            }
            foreach ($app in $existing) {
                Write-Host "  Removing existing installation '$($app.name)' (id: $($app.id), identifier: $($app.identifier))..." -ForegroundColor Gray
                Remove-SaleorApp -GraphQLUrl $apiUrl -Token $token -AppId $app.id
            }
        }

        # Read permissions from platform.yml if defined
        $appPermissions = @()
        if ($svc.permissions -and $svc.permissions.Count -gt 0) {
            $appPermissions = @($svc.permissions)
            Write-Host "    Permissions: $($appPermissions -join ', ')" -ForegroundColor Gray
        }

        Install-SaleorApp -GraphQLUrl $apiUrl -Token $token `
            -ManifestUrl $manifestUrl -AppName $svc.description `
            -Permissions $appPermissions
    }

    Write-Host ""
    Write-Host "[OK] App installation complete." -ForegroundColor Green
    Write-Host "Note: Some apps install asynchronously. Check the Dashboard > Apps section to verify." -ForegroundColor Gray
}

# Functions are auto-exported when dot-sourced (Export-ModuleMember removed -- only valid in .psm1)
