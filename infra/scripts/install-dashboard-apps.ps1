# ========================================
# Saleor Platform - Auto Install Dashboard Apps
# ========================================
# This script automatically installs/updates dashboard apps:
# - Invoice App
# - SMTP App
# - Stripe App
# - Storefront Control App
#
# It reads tunnel URLs from .env file (set by launch-platform.ps1),
# deletes existing apps if they exist, and installs new ones with updated URLs.
#
# Usage: .\infra\scripts\install-dashboard-apps.ps1
#        .\infra\scripts\install-dashboard-apps.ps1 -ApiUrl "http://localhost:8000/graphql/" -Email "admin@example.com" -Password "admin"

param(
    [string]$ApiUrl = "",
    [string]$Email = "",
    [string]$Password = "",
    [switch]$SkipDelete = $false  # Skip deleting existing apps
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Saleor Platform - Install Dashboard Apps" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$infraDir = Split-Path -Parent $scriptDir
$envFile = Join-Path $infraDir ".env"

# App definitions
$apps = @(
    @{
        Name = "Invoice App"
        AppId = "saleor.app.invoices"
        EnvVar = "INVOICE_APP_TUNNEL_URL"
        ManifestPath = "/api/manifest"
    },
    @{
        Name = "SMTP App"
        AppId = "saleor.app.smtp"
        EnvVar = "SMTP_APP_TUNNEL_URL"
        ManifestPath = "/api/manifest"
    },
    @{
        Name = "Stripe App"
        AppId = "saleor.app.stripe"
        EnvVar = "STRIPE_APP_TUNNEL_URL"
        ManifestPath = "/api/manifest"
    },
    @{
        Name = "Storefront Control App"
        AppId = "saleor.app.storefront-control"
        EnvVar = "STOREFRONT_CONTROL_APP_TUNNEL_URL"
        ManifestPath = "/api/manifest"
    },
    @{
        Name = "Newsletter App"
        AppId = "saleor.app.newsletter"
        EnvVar = "NEWSLETTER_APP_TUNNEL_URL"
        ManifestPath = "/api/manifest"
    },
    @{
        Name = "Sales Analytics App"
        AppId = "saleor.app.sales-analytics"
        EnvVar = "SALES_ANALYTICS_APP_TUNNEL_URL"
        ManifestPath = "/api/manifest"
    },
    @{
        Name = "Bulk Manager App"
        AppId = "saleor.app.bulk-manager"
        EnvVar = "BULK_MANAGER_APP_TUNNEL_URL"
        ManifestPath = "/api/manifest"
    },
    @{
        Name = "Image Studio App"
        AppId = "saleor.app.image-studio"
        EnvVar = "IMAGE_STUDIO_APP_TUNNEL_URL"
        ManifestPath = "/api/manifest"
    }
)

# Function to read .env file
function Get-EnvValue {
    param([string]$Key)
    
    if (-not (Test-Path $envFile)) {
        return $null
    }
    
    $content = Get-Content $envFile -Raw
    if ($content -match "$Key=(.+?)(?:\r?\n|$)") {
        $value = $matches[1].Trim()
        # Remove quotes if present
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
        
        # Check for GraphQL errors in response
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
        
        Write-Host "  ✓ Authenticated as: $($response.data.tokenCreate.user.email)" -ForegroundColor Green
        return $response.data.tokenCreate.token
    }
    catch {
        Write-Host "  ✗ Authentication failed: $_" -ForegroundColor Red
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                Write-Host "  Response body: $responseBody" -ForegroundColor Yellow
            }
            catch {
                # Ignore errors reading response stream
            }
        }
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
        Write-Host "  ✗ GraphQL request failed: $_" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "  Response: $responseBody" -ForegroundColor Red
        }
        throw
    }
}

# Function to list existing apps and installations
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
    
    # Also return installations for cleanup
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
    
    $variables = @{
        id = $AppId
    }
    
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
    
    $variables = @{
        id = $InstallationId
    }
    
    $response = Invoke-GraphQL -GraphQLUrl $GraphQLUrl -Token $Token -Query $mutation -Variables $variables
    
    if ($response.data.appDeleteFailedInstallation.errors -and $response.data.appDeleteFailedInstallation.errors.Count -gt 0) {
        $errorMsg = ($response.data.appDeleteFailedInstallation.errors | ForEach-Object { $_.message }) -join "; "
        throw "Failed to delete failed installation: $errorMsg"
    }
    
    return $response.data.appDeleteFailedInstallation.appInstallation
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
        Write-Host "  ⚠ Failed to fetch manifest from API: $_" -ForegroundColor Yellow
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                Write-Host "  Response: $responseBody" -ForegroundColor Yellow
            }
            catch {
                # Ignore errors reading response stream
            }
        }
        return $null
    }
}

# Function to verify manifest is accessible and has required fields
function Test-ManifestAccessible {
    param(
        [string]$ManifestUrl,
        [string]$ExpectedAppId
    )
    
    Write-Host "  Verifying manifest accessibility..." -ForegroundColor Gray
    
    $manifest = Get-ManifestFromApi -ManifestUrl $ManifestUrl
    
    if (-not $manifest) {
        Write-Host "  ✗ Manifest is not accessible at: $ManifestUrl" -ForegroundColor Red
        return $false
    }
    
    # Verify manifest has required fields
    if (-not $manifest.id) {
        Write-Host "  ✗ Manifest missing 'id' field" -ForegroundColor Red
        return $false
    }
    
    if ($manifest.id -ne $ExpectedAppId) {
        Write-Host "  ⚠ Manifest ID mismatch: expected '$ExpectedAppId', got '$($manifest.id)'" -ForegroundColor Yellow
    }
    
    # Verify permissions are present
    if (-not $manifest.permissions -or $manifest.permissions.Count -eq 0) {
        Write-Host "  ⚠ Manifest has no permissions defined" -ForegroundColor Yellow
    }
    else {
        $permissionsList = $manifest.permissions -join ", "
        Write-Host "  ✓ Manifest accessible with permissions: $permissionsList" -ForegroundColor Green
    }
    
    return $true
}

# Function to verify app permissions after installation
function Get-AppPermissions {
    param(
        [string]$GraphQLUrl,
        [string]$Token,
        [string]$AppId
    )
    
    $query = @'
query App($id: ID!) {
  app(id: $id) {
    id
    name
    permissions {
      code
      name
    }
  }
}
'@
    
    try {
        $response = Invoke-GraphQL -GraphQLUrl $GraphQLUrl -Token $Token -Query $query -Variables @{ id = $AppId }
        
        if ($response.data.app) {
            return $response.data.app.permissions
        }
        
        return @()
    }
    catch {
        Write-Host "  ⚠ Failed to fetch app permissions: $_" -ForegroundColor Yellow
        return @()
    }
}

# Function to install app (permissions from manifest must be passed so they carry over to the installed app)
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
    
    $input = @{
        appName = $AppName
        manifestUrl = $ManifestUrl
        activateAfterInstallation = $true
    }
    # Saleor uses AppInstallation.permissions when installing; if we omit permissions here,
    # the backend overwrites manifest permissions with (empty) and the app gets no permissions.
    if ($Permissions -and $Permissions.Count -gt 0) {
        $input["permissions"] = @($Permissions)
    }
    $variables = @{ input = $input }
    
    $response = Invoke-GraphQL -GraphQLUrl $GraphQLUrl -Token $Token -Query $mutation -Variables $variables
    
    # Check for GraphQL errors
    if ($response.errors) {
        $errorMsg = ($response.errors | ForEach-Object { $_.message }) -join "; "
        throw "GraphQL error: $errorMsg"
    }
    
    if ($response.data.appInstall.errors -and $response.data.appInstall.errors.Count -gt 0) {
        $errorDetails = $response.data.appInstall.errors | ForEach-Object { 
            if ($_.field) {
                "$($_.field): $($_.message)"
            } else {
                $_.message
            }
        }
        $errorMsg = $errorDetails -join "; "
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
    
    # Get existing apps and installations
    Write-Host "`nFetching existing apps and installations..." -ForegroundColor Cyan
    $existing = Get-ExistingApps -GraphQLUrl $graphQLUrl -Token $token
    $existingApps = $existing.Apps
    $existingInstallations = $existing.Installations
    Write-Host "  Found $($existingApps.Count) existing app(s)" -ForegroundColor Gray
    Write-Host "  Found $($existingInstallations.Count) installation(s)" -ForegroundColor Gray
    
    # Clean up failed/pending installations
    if ($existingInstallations.Count -gt 0 -and -not $SkipDelete) {
        Write-Host "`nCleaning up failed/pending installations..." -ForegroundColor Cyan
        foreach ($installation in $existingInstallations.Values) {
            if ($installation.status -eq "FAILED" -or $installation.status -eq "PENDING") {
                Write-Host "  Deleting $($installation.status) installation: $($installation.appName)..." -ForegroundColor Cyan
                try {
                    $deleted = Remove-FailedInstallation -GraphQLUrl $graphQLUrl -Token $token -InstallationId $installation.id
                    Write-Host "  ✓ Deleted: $($deleted.appName)" -ForegroundColor Green
                }
                catch {
                    Write-Host "  ✗ Failed to delete installation: $_" -ForegroundColor Yellow
                }
            }
        }
    }
    
    # Process each app
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Processing Apps" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
    foreach ($appDef in $apps) {
        Write-Host "`n--- $($appDef.Name) ---" -ForegroundColor Yellow
        
        # Get tunnel URL from .env
        $tunnelUrl = Get-EnvValue -Key $appDef.EnvVar
        
        if (-not $tunnelUrl) {
            Write-Host "  ⚠ Tunnel URL not found in .env ($($appDef.EnvVar))" -ForegroundColor Yellow
            Write-Host "  Skipping $($appDef.Name)..." -ForegroundColor Gray
            continue
        }
        
        $manifestUrl = "$tunnelUrl$($appDef.ManifestPath)"
        Write-Host "  Manifest URL: $manifestUrl" -ForegroundColor Gray
        
        # Verify manifest is accessible BEFORE installation
        # This ensures permissions will be read correctly during installation
        if (-not (Test-ManifestAccessible -ManifestUrl $manifestUrl -ExpectedAppId $appDef.AppId)) {
            Write-Host "  ⚠ Manifest verification failed. Installation may not have correct permissions." -ForegroundColor Yellow
            Write-Host "  Continuing anyway, but please verify the app is accessible..." -ForegroundColor Yellow
        }
        
        # Fetch manifest from API to get the actual app name and permissions
        Write-Host "  Fetching manifest from API..." -ForegroundColor Gray
        $manifest = Get-ManifestFromApi -ManifestUrl $manifestUrl
        $actualAppName = $appDef.Name
        if ($manifest -and $manifest.name) {
            $actualAppName = $manifest.name
            Write-Host "  Found app name in manifest: $actualAppName" -ForegroundColor Gray
        }
        else {
            Write-Host "  Using default app name: $actualAppName" -ForegroundColor Gray
        }
        
        # Log expected permissions from manifest
        if ($manifest -and $manifest.permissions) {
            $expectedPermissions = $manifest.permissions -join ", "
            Write-Host "  Expected permissions from manifest: $expectedPermissions" -ForegroundColor Gray
        }
        
        # Check if app already exists (by matching identifier, app ID, name, or manifest URL)
        # IMPORTANT: Only delete apps that match the exact identifier to avoid deleting wrong apps
        $existingApp = $null
        foreach ($app in $existingApps.Values) {
            # PRIMARY MATCH: Check by identifier field (canonical app ID from manifest)
            # This is the most reliable way - Saleor uses this to prevent duplicates
            # Only match if identifier is a proper manifest ID (not a Saleor internal ID like "QXBwOjQ5")
            if ($app.identifier -and $app.identifier -eq $appDef.AppId) {
                # Verify it's a proper manifest ID format (not a Saleor internal ID)
                # Manifest IDs typically start with "saleor.app." or match the AppId pattern
                # Saleor internal IDs start with "QXBw" (base64 encoded GraphQL IDs)
                if ($app.identifier -notmatch "^QXBw") {
                    $existingApp = $app
                    Write-Host "  Found existing app by identifier: $($app.name) (identifier: $($app.identifier))" -ForegroundColor Yellow
                    break
                } else {
                    Write-Host "  Skipping app with Saleor internal ID (not manifest identifier): $($app.name) (ID: $($app.identifier))" -ForegroundColor Gray
                }
            }
            
            # SECONDARY: Try to get the app's ID from its manifest to match by appId
            try {
                if ($app.manifestUrl) {
                    $appManifest = Get-ManifestFromApi -ManifestUrl $app.manifestUrl
                    if ($appManifest -and $appManifest.id -eq $appDef.AppId) {
                        $existingApp = $app
                        Write-Host "  Found existing app by manifest AppId: $($app.name)" -ForegroundColor Yellow
                        break
                    }
                }
            } catch {
                # Ignore errors fetching manifest
            }
            
            # TERTIARY: Check if manifest URL contains the app ID (fallback)
            if ($app.manifestUrl -and $app.manifestUrl -like "*$($appDef.AppId)*") {
                $existingApp = $app
                Write-Host "  Found existing app by manifest URL pattern: $($app.name)" -ForegroundColor Yellow
                break
            }
            
            # QUATERNARY: Check by app name - STRICT MATCHING ONLY
            # Only match if names are exactly the same (case-insensitive)
            # Do NOT match if one name is a substring of another (e.g., "Storefront" vs "Storefront Control")
            $nameVariations = @($appDef.Name, $actualAppName)
            foreach ($nameVar in $nameVariations) {
                if ($app.name -and $app.name -eq $nameVar) {
                    # Exact match only - don't match substrings
                    $existingApp = $app
                    Write-Host "  Found existing app by exact name match: $($app.name)" -ForegroundColor Yellow
                    break
                }
            }
            if ($existingApp) { break }
            
            # LAST RESORT: Check if manifest URL matches the new one (same tunnel domain)
            # Only if we're sure it's the same app (tunnel URL is unique per installation)
            if ($app.manifestUrl -and $tunnelUrl -and $app.manifestUrl -like "*$($tunnelUrl -replace 'https?://', '')*") {
                $existingApp = $app
                Write-Host "  Found existing app by tunnel domain: $($app.name)" -ForegroundColor Yellow
                break
            }
        }
        
        # Delete existing app if found
        # Only delete if we have a confident match (identifier match is most reliable)
        if ($existingApp -and -not $SkipDelete) {
            $identifierInfo = if ($existingApp.identifier) { "identifier: $($existingApp.identifier)" } else { "no identifier (legacy app)" }
            $matchConfidence = "unknown"
            
            # Determine match confidence level
            if ($existingApp.identifier -and $existingApp.identifier -eq $appDef.AppId -and $existingApp.identifier -notmatch "^QXBw") {
                $matchConfidence = "HIGH (identifier match)"
            } elseif ($existingApp.manifestUrl -and $existingApp.manifestUrl -like "*$($appDef.AppId)*") {
                $matchConfidence = "MEDIUM (manifest URL pattern)"
            } elseif ($existingApp.name -eq $actualAppName -or $existingApp.name -eq $appDef.Name) {
                $matchConfidence = "MEDIUM (exact name match)"
            } else {
                $matchConfidence = "LOW (tunnel domain match)"
            }
            
            Write-Host "  Found existing app: $($existingApp.name) (ID: $($existingApp.id), $identifierInfo)" -ForegroundColor Cyan
            Write-Host "  Match confidence: $matchConfidence" -ForegroundColor Gray
            Write-Host "  Deleting existing app to prevent duplicate installation..." -ForegroundColor Cyan
            
            try {
                $deleted = Remove-App -GraphQLUrl $graphQLUrl -Token $token -AppId $existingApp.id
                Write-Host "  ✓ Deleted: $($deleted.name)" -ForegroundColor Green
                
                # Remove from existing apps list
                $existingApps.Remove($existingApp.id)
                
                # Wait a moment for deletion to propagate
                Start-Sleep -Seconds 1
            }
            catch {
                Write-Host "  ✗ Failed to delete app: $_" -ForegroundColor Red
                Write-Host "  Continuing with installation anyway..." -ForegroundColor Yellow
            }
        }
        elseif ($existingApp -and $SkipDelete) {
            Write-Host "  Found existing app: $($existingApp.name)" -ForegroundColor Cyan
            Write-Host "  Skipping deletion (--SkipDelete flag set)" -ForegroundColor Gray
            continue
        }
        
        # Install new app (pass permissions from manifest so they carry over - Saleor uses input permissions, not manifest, when installing)
        $permissionsToInstall = @()
        if ($manifest -and $manifest.permissions -and $manifest.permissions.Count -gt 0) {
            $permissionsToInstall = @($manifest.permissions)
            Write-Host "  Installing $actualAppName with permissions: $($permissionsToInstall -join ', ')" -ForegroundColor Cyan
        }
        else {
            Write-Host "  Installing $actualAppName (no permissions in manifest)" -ForegroundColor Cyan
        }
        Write-Host "  Using manifest URL: $manifestUrl" -ForegroundColor Gray
        
        try {
            $installation = Install-App -GraphQLUrl $graphQLUrl -Token $token -ManifestUrl $manifestUrl -AppName $actualAppName -Permissions $permissionsToInstall
            Write-Host "  ✓ Installation initiated: $($installation.appName)" -ForegroundColor Green
            Write-Host "    Status: $($installation.status)" -ForegroundColor Gray
            Write-Host "    ID: $($installation.id)" -ForegroundColor Gray
            
            # Wait a moment for installation to process
            if ($installation.status -eq "PENDING") {
                Write-Host "  Waiting for installation to process..." -ForegroundColor Gray
                Start-Sleep -Seconds 3
                
                # Try to verify permissions were applied (only if installation completed)
                # Note: This requires the app to be in ACTIVE status, which may take time
                # We'll just log that permissions should be read from manifest
                if ($manifest -and $manifest.permissions) {
                    $expectedPerms = $manifest.permissions -join ", "
                    Write-Host "  ℹ Permissions should be: $expectedPerms" -ForegroundColor Cyan
                    Write-Host "  ℹ Verify in dashboard after installation completes (Extensions → Installed Apps)" -ForegroundColor Cyan
                }
            }
        }
        catch {
            Write-Host "  ✗ Failed to install app: $_" -ForegroundColor Red
            Write-Host "  Troubleshooting:" -ForegroundColor Yellow
            Write-Host "    - Ensure the app is running and accessible at: $tunnelUrl" -ForegroundColor Gray
            Write-Host "    - Verify the manifest is accessible at: $manifestUrl" -ForegroundColor Gray
            Write-Host "    - Check that the manifest has correct 'id' and 'permissions' fields" -ForegroundColor Gray
        }
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "✅ App Installation Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Wait for installations to complete (check dashboard: Extensions → Installed Apps)" -ForegroundColor White
    Write-Host "   - Status will change from PENDING to ACTIVE when ready" -ForegroundColor Gray
    Write-Host "2. Once ACTIVE, open each app in the dashboard to complete registration" -ForegroundColor White
    Write-Host "   - This triggers the app to receive authentication tokens" -ForegroundColor Gray
    Write-Host "3. If you see 'Missing auth data' errors, ensure:" -ForegroundColor White
    Write-Host "   - Installation status is ACTIVE (not PENDING)" -ForegroundColor Gray
    Write-Host "   - You've opened the app in the dashboard at least once" -ForegroundColor Gray
    Write-Host "   - The app is accessible at its tunnel URL" -ForegroundColor Gray
    Write-Host "`n"
}
catch {
    Write-Host "`n✗ Error: $_" -ForegroundColor Red
    Write-Host "`nStack trace:" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
