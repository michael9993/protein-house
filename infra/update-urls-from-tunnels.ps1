# infra/update-urls-from-tunnels.ps1
$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Error: .env file not found at $envFile" -ForegroundColor Red
    exit 1
}

# Read current .env
$envContent = Get-Content $envFile -Raw

# Parse tunnel URLs
$tunnelApiUrl = ""
$tunnelStripeUrl = ""
$tunnelStorefrontUrl = ""
$tunnelDashboardUrl = ""
$tunnelSmtpUrl = ""
$tunnelInvoiceUrl = ""

if ($envContent -match "SALEOR_API_TUNNEL_URL=(.+?)(?:\r?\n|$)") {
    $tunnelApiUrl = $matches[1].Trim()
}
if ($envContent -match "STRIPE_APP_TUNNEL_URL=(.+?)(?:\r?\n|$)") {
    $tunnelStripeUrl = $matches[1].Trim()
}
if ($envContent -match "STOREFRONT_TUNNEL_URL=(.+?)(?:\r?\n|$)") {
    $tunnelStorefrontUrl = $matches[1].Trim()
}
if ($envContent -match "DASHBOARD_TUNNEL_URL=(.+?)(?:\r?\n|$)") {
    $tunnelDashboardUrl = $matches[1].Trim()
}
if ($envContent -match "SMTP_APP_TUNNEL_URL=(.+?)(?:\r?\n|$)") {
    $tunnelSmtpUrl = $matches[1].Trim()
}
if ($envContent -match "INVOICE_APP_TUNNEL_URL=(.+?)(?:\r?\n|$)") {
    $tunnelInvoiceUrl = $matches[1].Trim()
}

# Get ports
$apiPort = if ($envContent -match "SALEOR_API_PORT=(\d+)") { $matches[1] } else { "8000" }
$dashboardPort = if ($envContent -match "DASHBOARD_PORT=(\d+)") { $matches[1] } else { "9000" }
$storefrontPort = if ($envContent -match "STOREFRONT_PORT=(\d+)") { $matches[1] } else { "3000" }
$stripePort = if ($envContent -match "STRIPE_APP_PORT=(\d+)") { $matches[1] } else { "3002" }
$smtpPort = if ($envContent -match "SMTP_APP_PORT=(\d+)") { $matches[1] } else { "3001" }
$invoicePort = if ($envContent -match "INVOICE_APP_PORT=(\d+)") { $matches[1] } else { "3003" }

# Build URLs (use tunnel if set, otherwise localhost)
$apiUrl = if ($tunnelApiUrl) { "$tunnelApiUrl/graphql/" } else { "http://localhost:$apiPort/graphql/" }
$publicUrl = if ($tunnelApiUrl) { $tunnelApiUrl } else { "http://localhost:$apiPort" }
$dashboardUrl = if ($tunnelDashboardUrl) { $tunnelDashboardUrl } else { "http://localhost:$dashboardPort" }
$storefrontUrl = if ($tunnelStorefrontUrl) { $tunnelStorefrontUrl } else { "http://localhost:$storefrontPort" }
$stripeAppUrl = if ($tunnelStripeUrl) { $tunnelStripeUrl } else { "http://localhost:$stripePort" }
$smtpAppUrl = if ($tunnelSmtpUrl) { $tunnelSmtpUrl } else { "http://localhost:$smtpPort" }
$invoiceAppUrl = if ($tunnelInvoiceUrl) { $tunnelInvoiceUrl } else { "http://localhost:$invoicePort" }

# Update URLs in .env
$envContent = $envContent -replace "PUBLIC_URL=.*", "PUBLIC_URL=$publicUrl"
$envContent = $envContent -replace "API_URL=.*", "API_URL=$apiUrl"
$envContent = $envContent -replace "VITE_API_URL=.*", "VITE_API_URL=$apiUrl"
$envContent = $envContent -replace "NEXT_PUBLIC_SALEOR_API_URL=.*", "NEXT_PUBLIC_SALEOR_API_URL=$apiUrl"
$envContent = $envContent -replace "SALEOR_API_URL=.*", "SALEOR_API_URL=$apiUrl"
$envContent = $envContent -replace "NEXT_PUBLIC_STOREFRONT_URL=.*", "NEXT_PUBLIC_STOREFRONT_URL=$storefrontUrl"
$envContent = $envContent -replace "STRIPE_APP_URL=.*", "STRIPE_APP_URL=$stripeAppUrl"
$envContent = $envContent -replace "STRIPE_APP_API_BASE_URL=.*", "STRIPE_APP_API_BASE_URL=$stripeAppUrl"
$envContent = $envContent -replace "INVOICE_APP_URL=.*", "INVOICE_APP_URL=$invoiceAppUrl"
# Note: SMTP app URLs are typically not needed in .env as the app reads from Saleor webhooks
# But we can add them if needed for app-to-app communication

# Collect all tunnel domains (extract host from URLs)
$tunnelDomains = @()
if ($tunnelApiUrl -and $tunnelApiUrl -match "\.trycloudflare\.com") {
    try {
        $domain = ([System.Uri]$tunnelApiUrl).Host
        if ($domain) { $tunnelDomains += $domain }
    }
    catch {}
}
if ($tunnelStripeUrl -and $tunnelStripeUrl -match "\.trycloudflare\.com") {
    try {
        $domain = ([System.Uri]$tunnelStripeUrl).Host
        if ($domain -and $domain -notin $tunnelDomains) { $tunnelDomains += $domain }
    }
    catch {}
}
if ($tunnelStorefrontUrl -and $tunnelStorefrontUrl -match "\.trycloudflare\.com") {
    try {
        $domain = ([System.Uri]$tunnelStorefrontUrl).Host
        if ($domain -and $domain -notin $tunnelDomains) { $tunnelDomains += $domain }
    }
    catch {}
}
if ($tunnelDashboardUrl -and $tunnelDashboardUrl -match "\.trycloudflare\.com") {
    try {
        $domain = ([System.Uri]$tunnelDashboardUrl).Host
        if ($domain -and $domain -notin $tunnelDomains) { $tunnelDomains += $domain }
    }
    catch {}
}
if ($tunnelSmtpUrl -and $tunnelSmtpUrl -match "\.trycloudflare\.com") {
    try {
        $domain = ([System.Uri]$tunnelSmtpUrl).Host
        if ($domain -and $domain -notin $tunnelDomains) { $tunnelDomains += $domain }
    }
    catch {}
}
if ($tunnelInvoiceUrl -and $tunnelInvoiceUrl -match "\.trycloudflare\.com") {
    try {
        $domain = ([System.Uri]$tunnelInvoiceUrl).Host
        if ($domain -and $domain -notin $tunnelDomains) { $tunnelDomains += $domain }
    }
    catch {}
}

# Update ALLOWED_HOSTS - add all tunnel domains
if ($tunnelDomains.Count -gt 0) {
    # Get current ALLOWED_HOSTS value
    if ($envContent -match "ALLOWED_HOSTS=(.+?)(?:\r?\n|$)") {
        $currentHosts = $matches[1].Trim()
        $hostsList = $currentHosts -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ }
        
        # Add tunnel domains that aren't already there
        foreach ($domain in $tunnelDomains) {
            if ($domain -notin $hostsList) {
                $hostsList += $domain
            }
        }
        
        $newHosts = $hostsList -join ","
        $envContent = $envContent -replace "ALLOWED_HOSTS=.*", "ALLOWED_HOSTS=$newHosts"
    }
}

# Update ALLOWED_CLIENT_HOSTS - add all tunnel domains
if ($tunnelDomains.Count -gt 0) {
    # Get current ALLOWED_CLIENT_HOSTS value
    if ($envContent -match "ALLOWED_CLIENT_HOSTS=(.+?)(?:\r?\n|$)") {
        $currentClientHosts = $matches[1].Trim()
        $clientHostsList = $currentClientHosts -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ }
        
        # Add tunnel domains that aren't already there
        foreach ($domain in $tunnelDomains) {
            if ($domain -notin $clientHostsList) {
                $clientHostsList += $domain
            }
        }
        
        $newClientHosts = $clientHostsList -join ","
        $envContent = $envContent -replace "ALLOWED_CLIENT_HOSTS=.*", "ALLOWED_CLIENT_HOSTS=$newClientHosts"
    }
}

# Write updated .env
$envContent | Set-Content $envFile -Encoding utf8

Write-Host "✅ Updated URLs in .env file!" -ForegroundColor Green
Write-Host "API URL: $apiUrl" -ForegroundColor Cyan
Write-Host "Dashboard URL: $dashboardUrl" -ForegroundColor Cyan
Write-Host "Storefront URL: $storefrontUrl" -ForegroundColor Cyan
Write-Host "Stripe App URL: $stripeAppUrl" -ForegroundColor Cyan
Write-Host "SMTP App URL: $smtpAppUrl" -ForegroundColor Cyan
Write-Host "Invoice App URL: $invoiceAppUrl" -ForegroundColor Cyan
if ($tunnelDomains.Count -gt 0) {
    Write-Host "`nAdded tunnel domains to ALLOWED_HOSTS and ALLOWED_CLIENT_HOSTS:" -ForegroundColor Yellow
    foreach ($domain in $tunnelDomains) {
        Write-Host "  - $domain" -ForegroundColor Gray
    }
}