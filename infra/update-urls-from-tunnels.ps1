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

$tunnelControlUrl = ""
$tunnelNewsletterUrl = ""
$tunnelAnalyticsUrl = ""
$tunnelBulkUrl = ""
$tunnelStudioUrl = ""
$tunnelDropshipUrl = ""
$tunnelTaxUrl = ""
$tunnelPaypalUrl = ""

if ($envContent -match "STOREFRONT_CONTROL_APP_TUNNEL_URL=(.+?)(?:\r?\n|$)") {
    $tunnelControlUrl = $matches[1].Trim()
}
if ($envContent -match "NEWSLETTER_APP_TUNNEL_URL=(.+?)(?:\r?\n|$)") {
    $tunnelNewsletterUrl = $matches[1].Trim()
}
if ($envContent -match "SALES_ANALYTICS_APP_TUNNEL_URL=(.+?)(?:\r?\n|$)") {
    $tunnelAnalyticsUrl = $matches[1].Trim()
}
if ($envContent -match "BULK_MANAGER_APP_TUNNEL_URL=(.+?)(?:\r?\n|$)") {
    $tunnelBulkUrl = $matches[1].Trim()
}
if ($envContent -match "IMAGE_STUDIO_APP_TUNNEL_URL=(.+?)(?:\r?\n|$)") {
    $tunnelStudioUrl = $matches[1].Trim()
}
if ($envContent -match "DROPSHIP_APP_TUNNEL_URL=(.+?)(?:\r?\n|$)") {
    $tunnelDropshipUrl = $matches[1].Trim()
}
if ($envContent -match "TAX_MANAGER_APP_TUNNEL_URL=(.+?)(?:\r?\n|$)") {
    $tunnelTaxUrl = $matches[1].Trim()
}
if ($envContent -match "PAYPAL_APP_TUNNEL_URL=(.+?)(?:\r?\n|$)") {
    $tunnelPaypalUrl = $matches[1].Trim()
}

# Get ports
$apiPort = if ($envContent -match "SALEOR_API_PORT=(\d+)") { $matches[1] } else { "8000" }
$dashboardPort = if ($envContent -match "DASHBOARD_PORT=(\d+)") { $matches[1] } else { "9000" }
$storefrontPort = if ($envContent -match "STOREFRONT_PORT=(\d+)") { $matches[1] } else { "3000" }
$stripePort = if ($envContent -match "STRIPE_APP_PORT=(\d+)") { $matches[1] } else { "3002" }
$smtpPort = if ($envContent -match "SMTP_APP_PORT=(\d+)") { $matches[1] } else { "3001" }
$invoicePort = if ($envContent -match "INVOICE_APP_PORT=(\d+)") { $matches[1] } else { "3003" }

$controlPort = if ($envContent -match "STOREFRONT_CONTROL_APP_PORT=(\d+)") { $matches[1] } else { "3004" }
$newsletterPort = if ($envContent -match "NEWSLETTER_APP_PORT=(\d+)") { $matches[1] } else { "3005" }
$analyticsPort = if ($envContent -match "SALES_ANALYTICS_APP_PORT=(\d+)") { $matches[1] } else { "3006" }
$bulkPort = if ($envContent -match "BULK_MANAGER_APP_PORT=(\d+)") { $matches[1] } else { "3007" }
$studioPort = if ($envContent -match "IMAGE_STUDIO_APP_PORT=(\d+)") { $matches[1] } else { "3008" }
$dropshipPort = if ($envContent -match "DROPSHIP_APP_PORT=(\d+)") { $matches[1] } else { "3009" }
$taxPort = if ($envContent -match "TAX_MANAGER_APP_PORT=(\d+)") { $matches[1] } else { "3010" }
$paypalPort = if ($envContent -match "PAYPAL_APP_PORT=(\d+)") { $matches[1] } else { "3011" }

# Build URLs (use tunnel if set, otherwise localhost)
$apiUrl = if ($tunnelApiUrl) { "$tunnelApiUrl/graphql/" } else { "http://localhost:$apiPort/graphql/" }
$publicUrl = if ($tunnelApiUrl) { $tunnelApiUrl } else { "http://localhost:$apiPort" }
$dashboardUrl = if ($tunnelDashboardUrl) { $tunnelDashboardUrl } else { "http://localhost:$dashboardPort" }
$storefrontUrl = if ($tunnelStorefrontUrl) { $tunnelStorefrontUrl } else { "http://localhost:$storefrontPort" }
$stripeAppUrl = if ($tunnelStripeUrl) { $tunnelStripeUrl } else { "http://localhost:$stripePort" }
$smtpAppUrl = if ($tunnelSmtpUrl) { $tunnelSmtpUrl } else { "http://localhost:$smtpPort" }
$invoiceAppUrl = if ($tunnelInvoiceUrl) { $tunnelInvoiceUrl } else { "http://localhost:$invoicePort" }

$controlAppUrl = if ($tunnelControlUrl) { $tunnelControlUrl } else { "http://localhost:$controlPort" }
$newsletterAppUrl = if ($tunnelNewsletterUrl) { $tunnelNewsletterUrl } else { "http://localhost:$newsletterPort" }
$analyticsAppUrl = if ($tunnelAnalyticsUrl) { $tunnelAnalyticsUrl } else { "http://localhost:$analyticsPort" }
$bulkAppUrl = if ($tunnelBulkUrl) { $tunnelBulkUrl } else { "http://localhost:$bulkPort" }
$studioAppUrl = if ($tunnelStudioUrl) { $tunnelStudioUrl } else { "http://localhost:$studioPort" }
$dropshipAppUrl = if ($tunnelDropshipUrl) { $tunnelDropshipUrl } else { "http://localhost:$dropshipPort" }
$taxAppUrl = if ($tunnelTaxUrl) { $tunnelTaxUrl } else { "http://localhost:$taxPort" }
$paypalAppUrl = if ($tunnelPaypalUrl) { $tunnelPaypalUrl } else { "http://localhost:$paypalPort" }

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
$envContent = $envContent -replace "INVOICE_APP_API_BASE_URL=.*", "INVOICE_APP_API_BASE_URL=$invoiceAppUrl"
$envContent = $envContent -replace "STOREFRONT_CONTROL_APP_URL=.*", "STOREFRONT_CONTROL_APP_URL=$controlAppUrl"
$envContent = $envContent -replace "NEWSLETTER_APP_URL=.*", "NEWSLETTER_APP_URL=$newsletterAppUrl"
$envContent = $envContent -replace "SALES_ANALYTICS_APP_URL=.*", "SALES_ANALYTICS_APP_URL=$analyticsAppUrl"
$envContent = $envContent -replace "BULK_MANAGER_APP_URL=.*", "BULK_MANAGER_APP_URL=$bulkAppUrl"
$envContent = $envContent -replace "IMAGE_STUDIO_APP_URL=.*", "IMAGE_STUDIO_APP_URL=$studioAppUrl"
$envContent = $envContent -replace "DROPSHIP_APP_URL=.*", "DROPSHIP_APP_URL=$dropshipAppUrl"
$envContent = $envContent -replace "TAX_MANAGER_APP_URL=.*", "TAX_MANAGER_APP_URL=$taxAppUrl"
$envContent = $envContent -replace "PAYPAL_APP_URL=.*", "PAYPAL_APP_URL=$paypalAppUrl"
$envContent = $envContent -replace "PAYPAL_APP_API_BASE_URL=.*", "PAYPAL_APP_API_BASE_URL=$paypalAppUrl"
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
if ($tunnelControlUrl -and $tunnelControlUrl -match "\.trycloudflare\.com") {
    try {
        $domain = ([System.Uri]$tunnelControlUrl).Host
        if ($domain -and $domain -notin $tunnelDomains) { $tunnelDomains += $domain }
    }
    catch {}
}
if ($tunnelNewsletterUrl -and $tunnelNewsletterUrl -match "\.trycloudflare\.com") {
    try {
        $domain = ([System.Uri]$tunnelNewsletterUrl).Host
        if ($domain -and $domain -notin $tunnelDomains) { $tunnelDomains += $domain }
    }
    catch {}
}
if ($tunnelAnalyticsUrl -and $tunnelAnalyticsUrl -match "\.trycloudflare\.com") {
    try {
        $domain = ([System.Uri]$tunnelAnalyticsUrl).Host
        if ($domain -and $domain -notin $tunnelDomains) { $tunnelDomains += $domain }
    }
    catch {}
}
if ($tunnelBulkUrl -and $tunnelBulkUrl -match "\.trycloudflare\.com") {
    try {
        $domain = ([System.Uri]$tunnelBulkUrl).Host
        if ($domain -and $domain -notin $tunnelDomains) { $tunnelDomains += $domain }
    }
    catch {}
}
if ($tunnelStudioUrl -and $tunnelStudioUrl -match "\.trycloudflare\.com") {
    try {
        $domain = ([System.Uri]$tunnelStudioUrl).Host
        if ($domain -and $domain -notin $tunnelDomains) { $tunnelDomains += $domain }
    }
    catch {}
}
if ($tunnelDropshipUrl -and $tunnelDropshipUrl -match "\.trycloudflare\.com") {
    try {
        $domain = ([System.Uri]$tunnelDropshipUrl).Host
        if ($domain -and $domain -notin $tunnelDomains) { $tunnelDomains += $domain }
    }
    catch {}
}
if ($tunnelTaxUrl -and $tunnelTaxUrl -match "\.trycloudflare\.com") {
    try {
        $domain = ([System.Uri]$tunnelTaxUrl).Host
        if ($domain -and $domain -notin $tunnelDomains) { $tunnelDomains += $domain }
    }
    catch {}
}
if ($tunnelPaypalUrl -and $tunnelPaypalUrl -match "\.trycloudflare\.com") {
    try {
        $domain = ([System.Uri]$tunnelPaypalUrl).Host
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

Write-Host "Updated URLs in .env file!" -ForegroundColor Green
Write-Host "API URL: $apiUrl" -ForegroundColor Cyan
Write-Host "Dashboard URL: $dashboardUrl" -ForegroundColor Cyan
Write-Host "Storefront URL: $storefrontUrl" -ForegroundColor Cyan
Write-Host "Stripe App URL: $stripeAppUrl" -ForegroundColor Cyan
Write-Host "SMTP App URL: $smtpAppUrl" -ForegroundColor Cyan
Write-Host "Invoice App URL: $invoiceAppUrl" -ForegroundColor Cyan
Write-Host "Storefront Control URL: $controlAppUrl" -ForegroundColor Cyan
Write-Host "Newsletter App URL: $newsletterAppUrl" -ForegroundColor Cyan
Write-Host "Sales Analytics URL: $analyticsAppUrl" -ForegroundColor Cyan
Write-Host "Bulk Manager URL: $bulkAppUrl" -ForegroundColor Cyan
Write-Host "Image Studio URL: $studioAppUrl" -ForegroundColor Cyan
Write-Host "Dropship App URL: $dropshipAppUrl" -ForegroundColor Cyan
Write-Host "Tax Manager URL: $taxAppUrl" -ForegroundColor Cyan
Write-Host "PayPal App URL: $paypalAppUrl" -ForegroundColor Cyan
if ($tunnelDomains.Count -gt 0) {
    Write-Host "`nAdded tunnel domains to ALLOWED_HOSTS and ALLOWED_CLIENT_HOSTS:" -ForegroundColor Yellow
    foreach ($domain in $tunnelDomains) {
        Write-Host "  - $domain" -ForegroundColor Gray
    }
}