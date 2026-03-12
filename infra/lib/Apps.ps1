# ============================================================================
# Apps.ps1 — Saleor App Installation via GraphQL
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

    $mutation = @"
mutation TokenAuth(\$email: String!, \$password: String!) {
  tokenCreate(email: \$email, password: \$password) {
    token
    errors { field message }
  }
}
"@

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

    $mutation = @"
mutation AppInstall(\$input: AppInstallInput!) {
  appInstall(input: \$input) {
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
"@

    $variables = @{
        input = @{
            manifestUrl = $ManifestUrl
            appName     = $AppName
            permissions = $Permissions
        }
    }

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

    Write-Host "  [WARN] $AppName: no installation object returned." -ForegroundColor Yellow
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

    $mutation = @"
mutation AppDelete(\$id: ID!) {
  appDelete(id: \$id) {
    app { id name }
    errors { field message }
  }
}
"@

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
        [string]$EnvPath = ""
    )

    # Resolve API URL
    $apiUrl = "http://localhost:8000/graphql/"
    if ($Config.services.api.port) {
        $apiUrl = "http://localhost:$($Config.services.api.port)/graphql/"
    }

    Write-Host "Connecting to Saleor API at $apiUrl..." -ForegroundColor Yellow
    $token = Get-AuthToken -GraphQLUrl $apiUrl -Email $Email -Password $Password
    Write-Host "[OK] Authenticated." -ForegroundColor Green

    # Read .env for tunnel URLs
    $envValues = @{}
    if ($EnvPath -and (Test-Path $EnvPath)) {
        $envValues = Read-EnvFile -Path $EnvPath
    }

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
        Write-Host "[$current/$total] $($svc.description)" -ForegroundColor Cyan

        # Build manifest URL — prefer tunnel URL, fall back to localhost
        $baseUrl = $null
        if ($svc.tunnel_env_var -and $envValues.ContainsKey($svc.tunnel_env_var)) {
            $baseUrl = $envValues[$svc.tunnel_env_var]
        }
        if (-not $baseUrl -and $svc.port) {
            $baseUrl = "http://localhost:$($svc.port)"
        }
        if (-not $baseUrl) {
            Write-Host "  [SKIP] No URL available for $key." -ForegroundColor Gray
            continue
        }

        $manifestUrl = "$baseUrl$($svc.app_manifest_path)"

        # Delete existing if found
        if (-not $SkipDelete) {
            $existing = $existingApps | Where-Object { $_.identifier -eq $svc.app_id }
            foreach ($app in $existing) {
                Write-Host "  Removing existing installation (id: $($app.id))..." -ForegroundColor Gray
                Remove-SaleorApp -GraphQLUrl $apiUrl -Token $token -AppId $app.id
            }
        }

        Install-SaleorApp -GraphQLUrl $apiUrl -Token $token `
            -ManifestUrl $manifestUrl -AppName $svc.description
    }

    Write-Host ""
    Write-Host "[OK] App installation complete." -ForegroundColor Green
    Write-Host "Note: Some apps install asynchronously. Check the Dashboard > Apps section to verify." -ForegroundColor Gray
}

Export-ModuleMember -Function @(
    'Get-AuthToken',
    'Invoke-GraphQL',
    'Get-ExistingApps',
    'Install-SaleorApp',
    'Remove-SaleorApp',
    'Install-AllApps'
) -ErrorAction SilentlyContinue
