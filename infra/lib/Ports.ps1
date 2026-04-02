# infra/lib/Ports.ps1 — Smart Port Allocation for Multi-Instance Support

function Test-PortInUse {
    param([int]$Port)
    # Use .NET TcpListener to test if port is free
    # Returns $true if in use, $false if free
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
        $listener.Start()
        $listener.Stop()
        return $false
    } catch {
        return $true
    }
}

function Find-FreePorts {
    param([int]$StartOffset = 0)
    # Returns a hashtable of port variable names -> port numbers
    # Default block: API=8000, Dashboard=9000, Storefront=3000, Apps=3001-3011, Postgres=5432, Redis=6379, AI=7000-7001
    # If any default port is taken, tries offset +100 (up to +500)

    $maxRetries = 5
    for ($i = 0; $i -le $maxRetries; $i++) {
        $offset = $StartOffset + ($i * 100)
        $pgOffset = $i  # Postgres/Redis only offset by 1 per instance

        $ports = [ordered]@{
            SALEOR_API_PORT              = 8000 + $offset
            DASHBOARD_PORT               = 9000 + $offset
            STOREFRONT_PORT              = 3000 + $offset
            SMTP_APP_PORT                = 3001 + $offset
            STRIPE_APP_PORT              = 3002 + $offset
            INVOICE_APP_PORT             = 3003 + $offset
            STOREFRONT_CONTROL_APP_PORT  = 3004 + $offset
            NEWSLETTER_APP_PORT          = 3005 + $offset
            SALES_ANALYTICS_APP_PORT     = 3006 + $offset
            BULK_MANAGER_APP_PORT        = 3007 + $offset
            IMAGE_STUDIO_APP_PORT        = 3008 + $offset
            DROPSHIP_APP_PORT            = 3009 + $offset
            TAX_MANAGER_APP_PORT         = 3010 + $offset
            PAYPAL_APP_PORT              = 3011 + $offset
            POSTGRES_PORT                = 5432 + $pgOffset
            REDIS_PORT                   = 6379 + $pgOffset
            REMBG_PORT                   = 7000 + $offset
            ESRGAN_PORT                  = 7001 + $offset
        }

        $allFree = $true
        $conflicting = @()
        foreach ($key in $ports.Keys) {
            if (Test-PortInUse $ports[$key]) {
                $allFree = $false
                $conflicting += "$key=$($ports[$key])"
            }
        }

        if ($allFree) {
            if ($offset -gt 0) {
                Write-Host "  Default ports in use. Using offset +$offset" -ForegroundColor Yellow
            }
            return $ports
        }

        if ($i -eq 0) {
            Write-Host "  Some default ports are in use: $($conflicting -join ', ')" -ForegroundColor Yellow
            Write-Host "  Searching for free port block..." -ForegroundColor Gray
        }
    }

    # Fallback: return defaults and warn
    Write-Host "  [WARN] Could not find fully free port block. Using defaults." -ForegroundColor Red
    return $ports
}

function Get-ExistingInstances {
    # Scan running Docker containers for known Aura platform suffixes
    # Returns hashtable of prefix -> container list
    $containers = docker ps --format "{{.Names}}" 2>$null
    $instances = [ordered]@{}

    foreach ($c in $containers) {
        if ($c -match '^(.+)-(api|postgres|storefront|dashboard|worker)-dev$') {
            $prefix = $Matches[1]
            if (-not $instances[$prefix]) {
                $instances[$prefix] = @()
            }
            $instances[$prefix] += $c
        }
    }

    return $instances
}

function Show-ExistingInstances {
    $instances = Get-ExistingInstances
    if ($instances.Count -eq 0) { return }

    Write-Host ""
    Write-Host "  Existing Aura instances detected:" -ForegroundColor Yellow
    Write-Host "  ─────────────────────────────────" -ForegroundColor DarkGray
    foreach ($prefix in $instances.Keys) {
        $count = $instances[$prefix].Count
        Write-Host "    [$prefix] $count containers running" -ForegroundColor Cyan
    }
    Write-Host ""
    Write-Host "  Choose a different COMPOSE_PREFIX to avoid conflicts." -ForegroundColor Gray
    Write-Host ""
}

function Show-PortTable {
    param([System.Collections.Specialized.OrderedDictionary]$Ports)
    # Display a formatted table of allocated ports

    Write-Host ""
    Write-Host "  Allocated Ports:" -ForegroundColor Cyan
    Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray

    $groups = [ordered]@{
        "Core Services" = @("SALEOR_API_PORT", "DASHBOARD_PORT", "STOREFRONT_PORT")
        "Apps"          = @("SMTP_APP_PORT", "STRIPE_APP_PORT", "INVOICE_APP_PORT",
                            "STOREFRONT_CONTROL_APP_PORT", "NEWSLETTER_APP_PORT",
                            "SALES_ANALYTICS_APP_PORT", "BULK_MANAGER_APP_PORT",
                            "IMAGE_STUDIO_APP_PORT", "DROPSHIP_APP_PORT",
                            "TAX_MANAGER_APP_PORT", "PAYPAL_APP_PORT")
        "Infrastructure" = @("POSTGRES_PORT", "REDIS_PORT")
        "AI Services"    = @("REMBG_PORT", "ESRGAN_PORT")
    }

    foreach ($groupName in $groups.Keys) {
        Write-Host "    $groupName" -ForegroundColor White
        foreach ($key in $groups[$groupName]) {
            if ($Ports.Contains($key)) {
                $label = ($key -replace '_PORT$', '' -replace '_', ' ').ToLower()
                $label = (Get-Culture).TextInfo.ToTitleCase($label)
                Write-Host "      $($label.PadRight(30)) $($Ports[$key])" -ForegroundColor Gray
            }
        }
    }
    Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""
}
