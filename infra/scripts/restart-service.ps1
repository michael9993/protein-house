# ========================================
# Saleor Platform - Restart Service
# ========================================
# Restarts a specific service and waits for health check.
#
# Usage:
#   .\infra\scripts\restart-service.ps1 storefront
#   .\infra\scripts\restart-service.ps1 api
#   .\infra\scripts\restart-service.ps1 dashboard
#   .\infra\scripts\restart-service.ps1 all
#   .\infra\scripts\restart-service.ps1 apps          # All 8 apps
#   .\infra\scripts\restart-service.ps1 tunnel         # Restart cloudflared

param(
    [Parameter(Position = 0, Mandatory = $true)]
    [string]$Service
)

$ErrorActionPreference = "Stop"
$infraDir = Join-Path (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)) ""
$composeFile = Join-Path (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)) "docker-compose.dev.yml"

# Service name → docker-compose service name mapping
$serviceMap = @{
    "api"         = "saleor-api"
    "worker"      = "saleor-worker"
    "scheduler"   = "saleor-scheduler"
    "dashboard"   = "saleor-dashboard"
    "storefront"  = "saleor-storefront"
    "postgres"    = "postgres"
    "redis"       = "redis"
    "stripe"      = "saleor-stripe-app"
    "smtp"        = "saleor-smtp-app"
    "invoices"    = "saleor-invoice-app"
    "control"     = "saleor-storefront-control-app"
    "newsletter"  = "saleor-newsletter-app"
    "analytics"   = "saleor-sales-analytics-app"
    "bulk"        = "saleor-bulk-manager-app"
    "studio"      = "saleor-image-studio-app"
}

# Container name mapping (for health checks — containers have -dev suffix)
$containerMap = @{
    "saleor-api"                     = "saleor-api-dev"
    "saleor-worker"                  = "saleor-worker-dev"
    "saleor-scheduler"               = "saleor-scheduler-dev"
    "saleor-dashboard"               = "saleor-dashboard-dev"
    "saleor-storefront"              = "saleor-storefront-dev"
    "postgres"                       = "saleor-postgres-dev"
    "redis"                          = "saleor-redis-dev"
    "saleor-stripe-app"              = "saleor-stripe-app-dev"
    "saleor-smtp-app"                = "saleor-smtp-app-dev"
    "saleor-invoice-app"             = "saleor-invoice-app-dev"
    "saleor-storefront-control-app"  = "saleor-storefront-control-app-dev"
    "saleor-newsletter-app"          = "saleor-newsletter-app-dev"
    "saleor-sales-analytics-app"     = "saleor-sales-analytics-app-dev"
    "saleor-bulk-manager-app"        = "saleor-bulk-manager-app-dev"
    "saleor-image-studio-app"        = "saleor-image-studio-app-dev"
}

function Restart-SingleService {
    param([string]$ComposeName, [string]$DisplayName)

    $containerName = $containerMap[$ComposeName]
    Write-Host "  Restarting $DisplayName ($ComposeName)..." -ForegroundColor Cyan

    docker compose -f $composeFile restart $ComposeName 2>&1 | Out-Null

    if ($LASTEXITCODE -ne 0) {
        Write-Host "    Failed to restart!" -ForegroundColor Red
        return
    }

    # Wait for health check (if container has one)
    $hasHealth = docker inspect --format '{{if .State.Health}}true{{else}}false{{end}}' $containerName 2>&1
    if ($hasHealth -eq "true") {
        Write-Host "    Waiting for health check..." -ForegroundColor Gray -NoNewline
        $maxWait = 120
        $waited = 0
        while ($waited -lt $maxWait) {
            $health = docker inspect --format '{{.State.Health.Status}}' $containerName 2>&1
            if ($health -eq "healthy") {
                Write-Host " healthy" -ForegroundColor Green
                return
            }
            Start-Sleep -Seconds 5
            $waited += 5
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
        Write-Host " timeout ($maxWait s)" -ForegroundColor Yellow
    }
    else {
        # No health check — just verify it's running
        Start-Sleep -Seconds 2
        $status = docker inspect --format '{{.State.Status}}' $containerName 2>&1
        if ($status -eq "running") {
            Write-Host "    Running" -ForegroundColor Green
        }
        else {
            Write-Host "    Status: $status" -ForegroundColor Yellow
        }
    }
}

# ---- Main ----

Write-Host ""
Write-Host "  Restart Service" -ForegroundColor Yellow
Write-Host ""

switch ($Service.ToLower()) {
    "all" {
        Write-Host "  Restarting all containers..." -ForegroundColor Cyan
        docker compose -f $composeFile restart 2>&1 | Out-Null
        Write-Host "  All containers restarted. Waiting for health checks..." -ForegroundColor Green
        Start-Sleep -Seconds 10

        # Check core services
        foreach ($key in @("postgres", "redis", "api")) {
            $composeName = $serviceMap[$key]
            $containerName = $containerMap[$composeName]
            $health = docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}running{{end}}' $containerName 2>&1
            Write-Host "    $($key.PadRight(15)) $health" -ForegroundColor $(if ($health -eq "healthy" -or $health -eq "running") { "Green" } else { "Yellow" })
        }
    }

    "apps" {
        Write-Host "  Restarting all apps..." -ForegroundColor Cyan
        $appKeys = @("stripe", "smtp", "invoices", "control", "newsletter", "analytics", "bulk", "studio")
        foreach ($key in $appKeys) {
            Restart-SingleService -ComposeName $serviceMap[$key] -DisplayName $key
        }
    }

    "tunnel" {
        Write-Host "  Restarting Cloudflare tunnel..." -ForegroundColor Cyan
        $procs = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
        if ($procs) {
            $procs | Stop-Process -Force
            Write-Host "    Stopped existing tunnel" -ForegroundColor Gray
        }
        Start-Sleep -Seconds 2

        $tunnelConfig = Join-Path (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)) "cloudflared-config.yml"
        if (Test-Path $tunnelConfig) {
            $logFile = Join-Path $env:TEMP "cloudflared-named-tunnel.log"
            $proc = Start-Process -FilePath "cloudflared" `
                -ArgumentList "tunnel", "--config", $tunnelConfig, "run" `
                -RedirectStandardError $logFile `
                -PassThru `
                -WindowStyle Hidden
            Start-Sleep -Seconds 3
            if (-not $proc.HasExited) {
                Write-Host "    Tunnel restarted (PID: $($proc.Id))" -ForegroundColor Green
            }
            else {
                Write-Host "    Tunnel failed to start! Check: $logFile" -ForegroundColor Red
            }
        }
        else {
            Write-Host "    No tunnel config found. Using ephemeral mode is not supported by this script." -ForegroundColor Yellow
        }
    }

    default {
        if ($serviceMap.ContainsKey($Service.ToLower())) {
            $composeName = $serviceMap[$Service.ToLower()]
            Restart-SingleService -ComposeName $composeName -DisplayName $Service
        }
        else {
            Write-Host "  Unknown service: $Service" -ForegroundColor Red
            Write-Host ""
            Write-Host "  Available services:" -ForegroundColor Yellow
            $serviceMap.Keys | Sort-Object | ForEach-Object {
                Write-Host "    $_" -ForegroundColor White
            }
            Write-Host "    all      (all containers)" -ForegroundColor White
            Write-Host "    apps     (all 8 apps)" -ForegroundColor White
            Write-Host "    tunnel   (cloudflared)" -ForegroundColor White
        }
    }
}

Write-Host ""
