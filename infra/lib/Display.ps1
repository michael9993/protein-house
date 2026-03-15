# ============================================================================
# Display.ps1 — Formatted Output Helpers
# ============================================================================
# Provides consistent, colored console output for all platform scripts.
#
# Usage:
#   . "$PSScriptRoot\lib\Display.ps1"
#   Write-Banner -Title "Platform" -Subtitle "Starting up..."
#   Write-Step -Current 1 -Total 5 -Message "Starting containers"
# ============================================================================

function Write-Banner {
    <#
    .SYNOPSIS
    Prints a prominent banner with title and optional subtitle.
    #>
    param(
        [string]$Title,
        [string]$Subtitle = ""
    )
    $line = "=" * 60
    Write-Host ""
    Write-Host $line -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor White
    if ($Subtitle) {
        Write-Host "  $Subtitle" -ForegroundColor Gray
    }
    Write-Host $line -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    <#
    .SYNOPSIS
    Prints a numbered step indicator.
    #>
    param(
        [int]$Current,
        [int]$Total,
        [string]$Message
    )
    Write-Host "[$Current/$Total] $Message" -ForegroundColor Yellow
}

function Write-Success {
    <#
    .SYNOPSIS
    Prints a green success message.
    #>
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    <#
    .SYNOPSIS
    Prints a yellow warning message. Named Write-Warn to avoid colliding with built-in Write-Warning.
    #>
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Err {
    <#
    .SYNOPSIS
    Prints a red error message. Named Write-Err to avoid colliding with built-in Write-Error.
    #>
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Info {
    <#
    .SYNOPSIS
    Prints a gray informational message.
    #>
    param([string]$Message)
    Write-Host "  $Message" -ForegroundColor Gray
}

function Write-ServiceTable {
    <#
    .SYNOPSIS
    Prints a formatted table of all services with container status, port, and URL.
    .PARAMETER Services
    Hashtable of service definitions from platform.yml.
    .PARAMETER Config
    Full platform config hashtable (for domain, etc.).
    .PARAMETER Mode
    "dev" or "selfhosted" — determines whether to show tunnel URLs.
    #>
    param(
        [hashtable]$Services,
        [hashtable]$Config,
        [string]$Mode = "dev"
    )

    $col1 = 22
    $col2 = 12
    $col3 = 8
    $col4 = 45

    $header = ("SERVICE").PadRight($col1) + ("STATUS").PadRight($col2) + ("PORT").PadRight($col3) + "URL"
    $divider = "-" * ($col1 + $col2 + $col3 + $col4)

    Write-Host ""
    Write-Host $header -ForegroundColor Cyan
    Write-Host $divider -ForegroundColor DarkGray

    # Determine a stable display order
    $order = @("api", "dashboard", "storefront", "worker", "scheduler", "postgres", "redis",
               "stripe", "smtp", "invoices", "control", "newsletter", "analytics",
               "bulk", "studio", "dropship", "tax")

    foreach ($key in $order) {
        if (-not $Services.ContainsKey($key)) { continue }
        $svc = $Services[$key]

        # Container status
        $containerName = $svc.container
        $status = "unknown"
        if ($containerName) {
            try {
                $inspect = docker inspect --format "{{.State.Status}}" $containerName 2>$null
                if ($LASTEXITCODE -eq 0 -and $inspect) {
                    $status = $inspect.Trim()
                } else {
                    $status = "not-found"
                }
            } catch {
                $status = "not-found"
            }
        } else {
            $status = "n/a"
        }

        # Color status
        $statusColor = switch ($status) {
            "running"   { "Green" }
            "exited"    { "Red" }
            "not-found" { "DarkGray" }
            "n/a"       { "DarkGray" }
            default     { "Yellow" }
        }

        # Port
        $portStr = if ($svc.port) { "$($svc.port)" } else { "-" }

        # URL
        $url = ""
        if ($Mode -eq "selfhosted" -and $svc.subdomain) {
            $url = "https://$($svc.subdomain).$($Config.platform.domain)"
        } elseif ($svc.tunnel_env_var) {
            $envUrl = [System.Environment]::GetEnvironmentVariable($svc.tunnel_env_var)
            if ($envUrl) {
                $url = $envUrl
            } elseif ($svc.port) {
                $url = "http://localhost:$($svc.port)"
            }
        } elseif ($svc.port) {
            $url = "http://localhost:$($svc.port)"
        }

        $description = if ($svc.description) { $svc.description } else { $key }
        $nameCol   = $description.PadRight($col1)
        $statusCol = $status.PadRight($col2)
        $portCol   = $portStr.PadRight($col3)

        Write-Host $nameCol -NoNewline -ForegroundColor White
        Write-Host $statusCol -NoNewline -ForegroundColor $statusColor
        Write-Host $portCol -NoNewline -ForegroundColor Gray
        Write-Host $url -ForegroundColor DarkCyan
    }

    Write-Host $divider -ForegroundColor DarkGray
    Write-Host ""
}

# Functions are auto-exported when dot-sourced (Export-ModuleMember removed — only valid in .psm1)
