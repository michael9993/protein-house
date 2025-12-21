<#
.SYNOPSIS
    Activate and configure OpenID Connect plugin for Google OAuth

.DESCRIPTION
    This script activates the OpenID Connect plugin and configures it with Google OAuth credentials.
    Requires MANAGE_PLUGINS permission.

.PARAMETER ApiUrl
    Saleor API URL (default: http://localhost:8000/graphql/)

.PARAMETER ClientId
    Google OAuth Client ID

.PARAMETER ClientSecret
    Google OAuth Client Secret

.PARAMETER Token
    Saleor authentication token (JWT) - Required for MANAGE_PLUGINS permission

.EXAMPLE
    .\activate-openid-plugin.ps1 -ClientId "your-client-id.apps.googleusercontent.com" -ClientSecret "your-secret" -Token "your-jwt-token"
#>

param(
    [string]$ApiUrl = "https://writing-bios-laboratories-colin.trycloudflare.com/graphql/",
    [Parameter(Mandatory = $true)]
    [string]$ClientId,
    [Parameter(Mandatory = $true)]
    [string]$ClientSecret,
    [Parameter(Mandatory = $true)]
    [string]$Token
)

$pluginId = "mirumee.authentication.openidconnect"

$mutation = @"
mutation PluginUpdate(`$id: ID!, `$active: Boolean!, `$configuration: [ConfigurationItemInput!]!) {
  pluginUpdate(
    id: `$id
    input: {
      active: `$active
      configuration: `$configuration
    }
  ) {
    plugin {
      id
      name
      globalConfiguration {
        active
        configuration {
          name
          value
          type
        }
      }
    }
    pluginsErrors {
      field
      message
      code
    }
  }
}
"@

$variables = @{
    id            = $pluginId
    active        = $true
    configuration = @(
        @{ name = "client_id"; value = $ClientId },
        @{ name = "client_secret"; value = $ClientSecret },
        @{ name = "enable_refresh_token"; value = "false" },
        @{ name = "oauth_authorization_url"; value = "https://accounts.google.com/o/oauth2/v2/auth" },
        @{ name = "oauth_token_url"; value = "https://oauth2.googleapis.com/token" },
        @{ name = "json_web_key_set_url"; value = "https://www.googleapis.com/oauth2/v3/certs" },
        @{ name = "user_info_url"; value = "https://openidconnect.googleapis.com/v1/userinfo" },
        @{ name = "use_oauth_scope_permissions"; value = "false" }
    )
} | ConvertTo-Json -Depth 10

$body = @{
    query     = $mutation
    variables = $variables | ConvertFrom-Json
} | ConvertTo-Json -Depth 10

Write-Host "Activating OpenID Connect plugin..." -ForegroundColor Cyan
Write-Host "API: $ApiUrl" -ForegroundColor Gray
Write-Host "Plugin ID: $pluginId" -ForegroundColor Gray

# Prepare headers with authentication token
$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $Token"
}

try {
    $response = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -Body $body

    if ($response.errors) {
        Write-Host "`nError activating plugin:" -ForegroundColor Red
        $response.errors | ForEach-Object {
            Write-Host "  - $($_.message)" -ForegroundColor Red
        }
        exit 1
    }

    if ($response.data.pluginUpdate.pluginsErrors -and $response.data.pluginUpdate.pluginsErrors.Count -gt 0) {
        Write-Host "`nPlugin update errors:" -ForegroundColor Yellow
        $response.data.pluginUpdate.pluginsErrors | ForEach-Object {
            Write-Host "  - $($_.message)" -ForegroundColor Yellow
        }
        exit 1
    }

    $plugin = $response.data.pluginUpdate.plugin
    Write-Host "`n✅ Plugin activated successfully!" -ForegroundColor Green
    Write-Host "  Name: $($plugin.name)" -ForegroundColor White
    Write-Host "  Active: $($plugin.globalConfiguration.active)" -ForegroundColor White
    
    Write-Host "`nConfiguration:" -ForegroundColor Cyan
    $plugin.globalConfiguration.configuration | ForEach-Object {
        $value = if ($_.name -eq "client_secret") { "***hidden***" } else { $_.value }
        Write-Host "  $($_.name): $value" -ForegroundColor Gray
    }

}
catch {
    Write-Host "`nFailed to activate plugin:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "`n⚠️  Note: Make sure your Google OAuth app has the redirect URI configured:" -ForegroundColor Yellow
Write-Host "  https://writing-bios-laboratories-colin.trycloudflare.com/plugins/openid-connect/callback" -ForegroundColor White
Write-Host "  (or http://localhost:8000/plugins/openid-connect/callback for local dev)" -ForegroundColor White

