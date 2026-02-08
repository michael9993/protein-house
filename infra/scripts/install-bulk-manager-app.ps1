# ========================================
# Saleor Platform - Install Bulk Manager App
# ========================================
# This script installs/updates the Bulk Manager dashboard app.
# It reads the tunnel URL from .env file (set by launch-platform.ps1),
# deletes the existing app if it exists, and installs a new one with the updated URL.
#
# Usage: .\infra\scripts\install-bulk-manager-app.ps1
#        .\infra\scripts\install-bulk-manager-app.ps1 -ApiUrl "http://localhost:8000/graphql/" -Email "admin@example.com" -Password "admin"

param(
    [string]$ApiUrl = "",
    [string]$Email = "",
    [string]$Password = "",
    [switch]$SkipDelete = $false
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Saleor Platform - Install Bulk Manager App" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$infraDir = Split-Path -Parent $scriptDir
$envFile = Join-Path $infraDir ".env"

# App definition
$appDef = @{
    Name = "Bulk Manager App"
    AppId = "saleor.app.bulk-manager"
    EnvVar = "BULK_MANAGER_APP_TUNNEL_URL"
    ManifestPath = "/api/manifest"
}

# Function to read .env file
function Get-EnvValue {
    param([string]$Key)

    if (-not (Test-Path $envFile)) {
        return $null
    }

    $content = Get-Content $envFile -Raw
    if ($content -match "$Key=(.+?)(?:\r?\n|$)") {
        $value = $matches[1].Trim()
        $value = $value -replace '^["\x27]|["\x27]$', ''
        return $value
    }

    return $null
}

# Function to get API URL
function Get-ApiUrl {
    if ($ApiUrl) {
        return $ApiUrl
    }

    $url = Get-EnvValue -Key "API_URL"
    if ($url) {
        return $url
    }

    $url = Get-EnvValue -Key "VITE_API_URL"
    if ($url) {
        return $url
    }

    return "http://localhost:8000/graphql/"
}

# Function to get credentials
function Get-Credentials {
    if ($Email -and $Password) {
        return @{
            Email = $Email
            Password = $Password
        }
    }

    Write-Host "Credentials not provided. Please enter admin credentials:" -ForegroundColor Yellow
    $email = Read-Host "Email"
    $password = Read-Host "Password" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    )

    return @{
        Email = $email
        Password = $passwordPlain
    }
}

# Function to get auth token
function Get-AuthToken {
    param(
        [string]$GraphQLUrl,
        [string]$Email,
        [string]$Password
    )

    Write-Host "Authenticating..." -ForegroundColor Cyan

    $mutation = @'
mutation TokenCreate($email: String!, $password: String!) {
  tokenCreate(email: $email, password: $password) {
    token
    errors {
      field
      message
    }
    user {
      id
      email
    }
  }
}
'@

    $body = @{
        query = $mutation
        variables = @{
            email = $Email
            password = $Password
        }
    } | ConvertTo-Json -Depth 10 -Compress

    try {
        $response = Invoke-RestMethod -Uri $GraphQLUrl -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop

        if ($response.errors) {
            $errorMsg = ($response.errors | ForEach-Object { $_.message }) -join "; "
            throw "GraphQL error: $errorMsg"
        }

        if ($response.data.tokenCreate.errors -and $response.data.tokenCreate.errors.Count -gt 0) {
            $errorMsg = ($response.data.tokenCreate.errors | ForEach-Object { $_.message }) -join "; "
            throw "Authentication failed: $errorMsg"
        }

        if (-not $response.data.tokenCreate.token) {
            throw "No token received from authentication"
        }

        Write-Host "  Authenticated as: $($response.data.tokenCreate.user.email)" -ForegroundColor Green
        return $response.data.tokenCreate.token
    }
    catch {
        Write-Host "  Authentication failed: $_" -ForegroundColor Red
        throw
    }
}

# Function to execute GraphQL query
function Invoke-GraphQL {
    param(
        [string]$GraphQLUrl,
        [string]$Token,
        [string]$Query,
        [hashtable]$Variables = @{}
    )

    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }

    $body = @{
        query = $Query
        variables = $Variables
    } | ConvertTo-Json -Depth 10 -Compress

    try {
        $response = Invoke-RestMethod -Uri $GraphQLUrl -Method Post -Body $body -Headers $headers -ErrorAction Stop
        return $response
    }
    catch {
        Write-Host "  GraphQL request failed: $_" -ForegroundColor Red
        throw
    }
}

# Function to fetch manifest from API
function Get-ManifestFromApi {
    param(
        [string]$ManifestUrl
    )

    try {
        $response = Invoke-RestMethod -Uri $ManifestUrl -Method Get -ErrorAction Stop
        return $response
    }
    catch {
        Write-Host "  Failed to fetch manifest from API: $_" -ForegroundColor Yellow
        return $null
    }
}

# Function to list existing apps
function Get-ExistingApps {
    param(
        [string]$GraphQLUrl,
        [string]$Token
    )

    $query = @'
query Apps {
  apps(first: 100) {
    edges {
      node {
        id
        name
        appUrl
        manifestUrl
        isActive
        identifier
      }
    }
  }
  appsInstallations {
    id
    appName
    manifestUrl
    status
  }
}
'@

    $response = Invoke-GraphQL -GraphQLUrl $GraphQLUrl -Token $Token -Query $query

    $apps = @{}
    foreach ($edge in $response.data.apps.edges) {
        $app = $edge.node
        $apps[$app.id] = $app
    }

    $installations = @{}
    foreach ($installation in $response.data.appsInstallations) {
        $installations[$installation.id] = $installation
    }

    return @{
        Apps = $apps
        Installations = $installations
    }
}

# Function to delete app
function Remove-App {
    param(
        [string]$GraphQLUrl,
        [string]$Token,
        [string]$AppId
    )

    $mutation = @'
mutation AppDelete($id: ID!) {
  appDelete(id: $id) {
    errors {
      field
      message
    }
    app {
      id
      name
    }
  }
}
'@

    $variables = @{ id = $AppId }
    $response = Invoke-GraphQL -GraphQLUrl $GraphQLUrl -Token $Token -Query $mutation -Variables $variables

    if ($response.data.appDelete.errors -and $response.data.appDelete.errors.Count -gt 0) {
        $errorMsg = ($response.data.appDelete.errors | ForEach-Object { $_.message }) -join "; "
        throw "Failed to delete app: $errorMsg"
    }

    return $response.data.appDelete.app
}

# Function to delete failed installation
function Remove-FailedInstallation {
    param(
        [string]$GraphQLUrl,
        [string]$Token,
        [string]$InstallationId
    )

    $mutation = @'
mutation AppDeleteFailedInstallation($id: ID!) {
  appDeleteFailedInstallation(id: $id) {
    errors {
      field
      message
    }
    appInstallation {
      id
      appName
    }
  }
}
'@

    $variables = @{ id = $InstallationId }
    $response = Invoke-GraphQL -GraphQLUrl $GraphQLUrl -Token $Token -Query $mutation -Variables $variables

    if ($response.data.appDeleteFailedInstallation.errors -and $response.data.appDeleteFailedInstallation.errors.Count -gt 0) {
        $errorMsg = ($response.data.appDeleteFailedInstallation.errors | ForEach-Object { $_.message }) -join "; "
        throw "Failed to delete failed installation: $errorMsg"
    }

    return $response.data.appDeleteFailedInstallation.appInstallation
}

# Function to install app
function Install-App {
    param(
        [string]$GraphQLUrl,
        [string]$Token,
        [string]$ManifestUrl,
        [string]$AppName,
        [string[]]$Permissions = @()
    )

    $mutation = @'
mutation AppInstall($input: AppInstallInput!) {
  appInstall(input: $input) {
    errors {
      field
      message
    }
    appInstallation {
      id
      status
      appName
      manifestUrl
    }
  }
}
'@

    $inputVar = @{
        appName = $AppName
        manifestUrl = $ManifestUrl
        activateAfterInstallation = $true
    }
    if ($Permissions -and $Permissions.Count -gt 0) {
        $inputVar["permissions"] = @($Permissions)
    }
    $variables = @{ input = $inputVar }

    $response = Invoke-GraphQL -GraphQLUrl $GraphQLUrl -Token $Token -Query $mutation -Variables $variables

    if ($response.errors) {
        $errorMsg = ($response.errors | ForEach-Object { $_.message }) -join "; "
        throw "GraphQL error: $errorMsg"
    }

    if ($response.data.appInstall.errors -and $response.data.appInstall.errors.Count -gt 0) {
        $errorMsg = ($response.data.appInstall.errors | ForEach-Object { "$($_.field): $($_.message)" }) -join "; "
        throw "Failed to install app: $errorMsg"
    }

    return $response.data.appInstall.appInstallation
}

# Main execution
try {
    # Get API URL
    $graphQLUrl = Get-ApiUrl
    Write-Host "GraphQL API URL: $graphQLUrl" -ForegroundColor Cyan

    # Get credentials
    $creds = Get-Credentials

    # Authenticate
    $token = Get-AuthToken -GraphQLUrl $graphQLUrl -Email $creds.Email -Password $creds.Password

    # Get tunnel URL from .env
    $tunnelUrl = Get-EnvValue -Key $appDef.EnvVar

    if (-not $tunnelUrl) {
        Write-Host "Tunnel URL not found in .env ($($appDef.EnvVar))" -ForegroundColor Red
        Write-Host "Run launch-platform.ps1 first or set $($appDef.EnvVar) in infra/.env" -ForegroundColor Yellow
        exit 1
    }

    $manifestUrl = "$tunnelUrl$($appDef.ManifestPath)"
    Write-Host "`nManifest URL: $manifestUrl" -ForegroundColor Gray

    # Verify manifest is accessible
    Write-Host "Verifying manifest accessibility..." -ForegroundColor Cyan
    $manifest = Get-ManifestFromApi -ManifestUrl $manifestUrl

    if (-not $manifest) {
        Write-Host "Manifest is not accessible at: $manifestUrl" -ForegroundColor Red
        Write-Host "Ensure the Bulk Manager app is running and the tunnel is active." -ForegroundColor Yellow
        exit 1
    }

    $actualAppName = if ($manifest.name) { $manifest.name } else { $appDef.Name }
    Write-Host "  App name: $actualAppName" -ForegroundColor Green

    if ($manifest.permissions) {
        Write-Host "  Permissions: $($manifest.permissions -join ', ')" -ForegroundColor Green
    }

    # Get existing apps
    Write-Host "`nFetching existing apps..." -ForegroundColor Cyan
    $existing = Get-ExistingApps -GraphQLUrl $graphQLUrl -Token $token

    # Clean up failed installations related to this app
    foreach ($installation in $existing.Installations.Values) {
        if (($installation.status -eq "FAILED" -or $installation.status -eq "PENDING") -and
            ($installation.appName -eq $actualAppName -or $installation.appName -eq $appDef.Name)) {
            Write-Host "  Deleting $($installation.status) installation: $($installation.appName)..." -ForegroundColor Cyan
            try {
                Remove-FailedInstallation -GraphQLUrl $graphQLUrl -Token $token -InstallationId $installation.id | Out-Null
                Write-Host "  Deleted" -ForegroundColor Green
            }
            catch {
                Write-Host "  Failed to delete installation: $_" -ForegroundColor Yellow
            }
        }
    }

    # Find and delete existing app if present
    if (-not $SkipDelete) {
        foreach ($app in $existing.Apps.Values) {
            $isMatch = $false

            if ($app.identifier -and $app.identifier -eq $appDef.AppId -and $app.identifier -notmatch "^QXBw") {
                $isMatch = $true
            }
            elseif ($app.name -eq $actualAppName -or $app.name -eq $appDef.Name) {
                $isMatch = $true
            }

            if ($isMatch) {
                Write-Host "  Found existing app: $($app.name) (ID: $($app.id))" -ForegroundColor Cyan
                Write-Host "  Deleting to reinstall with updated URL..." -ForegroundColor Cyan
                try {
                    Remove-App -GraphQLUrl $graphQLUrl -Token $token -AppId $app.id | Out-Null
                    Write-Host "  Deleted" -ForegroundColor Green
                    Start-Sleep -Seconds 1
                }
                catch {
                    Write-Host "  Failed to delete app: $_" -ForegroundColor Red
                }
                break
            }
        }
    }

    # Install the app
    $permissionsToInstall = @()
    if ($manifest.permissions -and $manifest.permissions.Count -gt 0) {
        $permissionsToInstall = @($manifest.permissions)
    }

    Write-Host "`nInstalling $actualAppName..." -ForegroundColor Cyan

    $installation = Install-App -GraphQLUrl $graphQLUrl -Token $token -ManifestUrl $manifestUrl -AppName $actualAppName -Permissions $permissionsToInstall
    Write-Host "  Installation initiated: $($installation.appName)" -ForegroundColor Green
    Write-Host "  Status: $($installation.status)" -ForegroundColor Gray
    Write-Host "  ID: $($installation.id)" -ForegroundColor Gray

    if ($installation.status -eq "PENDING") {
        Write-Host "  Waiting for installation to process..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
    }

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Bulk Manager App Installation Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Host "1. Check dashboard: Extensions > Installed Apps" -ForegroundColor White
    Write-Host "2. Open the app in the dashboard to complete registration" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "`nError: $_" -ForegroundColor Red
    Write-Host "`nStack trace:" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
