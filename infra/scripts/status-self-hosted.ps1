# ========================================
# Saleor Platform - Self-Hosted Status Check
# ========================================
# Shows the health of all platform services at a glance.
#
# Usage: .\infra\scripts\status-self-hosted.ps1

$ErrorActionPreference = "SilentlyContinue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$infraDir = Split-Path -Parent $scriptDir

$domain = "halacosmetics.org"

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "   Aura E-Commerce Platform — Status" -ForegroundColor White
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

# ---- Docker Desktop ----
Write-Host "  Docker Desktop" -ForegroundColor Yellow
$dockerRunning = $false
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host "    Status: Running" -ForegroundColor Green
    }
    else {
        Write-Host "    Status: Not Running" -ForegroundColor Red
    }
}
catch {
    Write-Host "    Status: Not Running" -ForegroundColor Red
}
Write-Host ""

if (-not $dockerRunning) {
    Write-Host "  Docker is not running. Start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# ---- Container Status ----
Write-Host "  Containers" -ForegroundColor Yellow

$containers = @(
    @{Name = "PostgreSQL";         Container = "saleor-postgres-dev";               Port = 5432},
    @{Name = "Redis";              Container = "saleor-redis-dev";                  Port = 6379},
    @{Name = "Saleor API";         Container = "saleor-api-dev";                    Port = 8000},
    @{Name = "Worker";             Container = "saleor-worker-dev";                 Port = $null},
    @{Name = "Scheduler";          Container = "saleor-scheduler-dev";              Port = $null},
    @{Name = "Dashboard";          Container = "saleor-dashboard-dev";              Port = 9000},
    @{Name = "Storefront";         Container = "saleor-storefront-dev";             Port = 3000},
    @{Name = "Stripe App";         Container = "saleor-stripe-app-dev";             Port = 3002},
    @{Name = "SMTP App";           Container = "saleor-smtp-app-dev";               Port = 3001},
    @{Name = "Invoice App";        Container = "saleor-invoice-app-dev";            Port = 3003},
    @{Name = "Control App";        Container = "saleor-storefront-control-app-dev"; Port = 3004},
    @{Name = "Newsletter App";     Container = "saleor-newsletter-app-dev";         Port = 3005},
    @{Name = "Analytics App";      Container = "saleor-sales-analytics-app-dev";    Port = 3006},
    @{Name = "Bulk Manager App";   Container = "saleor-bulk-manager-app-dev";       Port = 3007},
    @{Name = "Image Studio App";   Container = "saleor-image-studio-app-dev";       Port = 3008}
)

$runningCount = 0
$totalCount = $containers.Count

foreach ($svc in $containers) {
    $status = docker inspect --format '{{.State.Status}}' $svc.Container 2>&1
    $health = docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}n/a{{end}}' $svc.Container 2>&1

    $name = $svc.Name.PadRight(20)

    if ($status -eq "running") {
        $runningCount++
        if ($health -eq "healthy") {
            Write-Host "    $name running (healthy)" -ForegroundColor Green
        }
        elseif ($health -eq "starting") {
            Write-Host "    $name running (starting...)" -ForegroundColor Yellow
        }
        elseif ($health -eq "unhealthy") {
            Write-Host "    $name running (unhealthy!)" -ForegroundColor Red
        }
        else {
            Write-Host "    $name running" -ForegroundColor Green
        }
    }
    elseif ($status -match "exited|created") {
        Write-Host "    $name stopped" -ForegroundColor Red
    }
    else {
        Write-Host "    $name not found" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "    $runningCount / $totalCount containers running" -ForegroundColor $(if ($runningCount -eq $totalCount) { "Green" } else { "Yellow" })
Write-Host ""

# ---- Cloudflare Tunnel ----
Write-Host "  Cloudflare Tunnel" -ForegroundColor Yellow
$tunnelProcs = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($tunnelProcs) {
    foreach ($proc in $tunnelProcs) {
        $uptime = (Get-Date) - $proc.StartTime
        $uptimeStr = "{0}d {1}h {2}m" -f $uptime.Days, $uptime.Hours, $uptime.Minutes
        Write-Host "    Status: Connected (PID: $($proc.Id), uptime: $uptimeStr)" -ForegroundColor Green
    }
}
else {
    Write-Host "    Status: Not Running" -ForegroundColor Red
    Write-Host "    Start with: cloudflared tunnel --config infra/cloudflared-config.yml run" -ForegroundColor Gray
}
Write-Host ""

# ---- Resource Usage ----
Write-Host "  Resource Usage" -ForegroundColor Yellow
try {
    $stats = docker stats --no-stream --format "{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>&1
    if ($stats -and $LASTEXITCODE -eq 0) {
        $totalMem = 0
        foreach ($line in $stats) {
            $parts = $line -split "\t"
            if ($parts.Count -ge 3) {
                $containerName = $parts[0].PadRight(40)
                $cpu = $parts[1].PadRight(10)
                $mem = $parts[2]
                # Extract numeric MB from mem string like "123.4MiB / 7.7GiB"
                if ($mem -match "(\d+\.?\d*)(MiB|GiB)") {
                    $memVal = [double]$matches[1]
                    if ($matches[2] -eq "GiB") { $memVal *= 1024 }
                    $totalMem += $memVal
                }
                Write-Host "    $containerName CPU: $cpu  Mem: $mem" -ForegroundColor Gray
            }
        }
        Write-Host ""
        Write-Host "    Total Memory: $([math]::Round($totalMem / 1024, 1)) GB" -ForegroundColor White
    }
}
catch {
    Write-Host "    Could not retrieve stats" -ForegroundColor Yellow
}
Write-Host ""

# ---- Database Size ----
Write-Host "  Database" -ForegroundColor Yellow
try {
    $dbSize = docker exec saleor-postgres-dev psql -U saleor -d saleor -t -c "SELECT pg_size_pretty(pg_database_size('saleor'));" 2>&1
    if ($LASTEXITCODE -eq 0 -and $dbSize) {
        Write-Host "    Size: $($dbSize.Trim())" -ForegroundColor White
    }
    else {
        Write-Host "    Size: unavailable (container not running)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "    Size: unavailable" -ForegroundColor Yellow
}

# Product count
try {
    $productCount = docker exec saleor-postgres-dev psql -U saleor -d saleor -t -c "SELECT COUNT(*) FROM product_product;" 2>&1
    if ($LASTEXITCODE -eq 0 -and $productCount) {
        Write-Host "    Products: $($productCount.Trim())" -ForegroundColor White
    }
}
catch {}

# Order count
try {
    $orderCount = docker exec saleor-postgres-dev psql -U saleor -d saleor -t -c "SELECT COUNT(*) FROM order_order;" 2>&1
    if ($LASTEXITCODE -eq 0 -and $orderCount) {
        Write-Host "    Orders: $($orderCount.Trim())" -ForegroundColor White
    }
}
catch {}
Write-Host ""

# ---- Last Backup ----
Write-Host "  Backups" -ForegroundColor Yellow
$backupDir = "C:\Users\micha\saleor-backups"
if (Test-Path $backupDir) {
    $latestBackup = Get-ChildItem $backupDir -Filter "saleor-*.sql*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latestBackup) {
        $age = (Get-Date) - $latestBackup.LastWriteTime
        $ageStr = if ($age.Days -gt 0) { "$($age.Days) days ago" } else { "$($age.Hours) hours ago" }
        $sizeStr = "{0:N1} MB" -f ($latestBackup.Length / 1MB)
        Write-Host "    Latest: $($latestBackup.Name) ($sizeStr, $ageStr)" -ForegroundColor White

        $backupCount = (Get-ChildItem $backupDir -Filter "saleor-*.sql*").Count
        Write-Host "    Total backups: $backupCount" -ForegroundColor Gray

        if ($age.Days -gt 1) {
            Write-Host "    WARNING: Last backup is more than 24 hours old!" -ForegroundColor Red
        }
    }
    else {
        Write-Host "    No backups found in $backupDir" -ForegroundColor Yellow
    }
}
else {
    Write-Host "    Backup directory not found: $backupDir" -ForegroundColor Yellow
    Write-Host "    Run: .\infra\scripts\backup-self-hosted.ps1" -ForegroundColor Gray
}
Write-Host ""

# ---- Service URLs ----
Write-Host "  Service URLs" -ForegroundColor Yellow
if ($tunnelProcs) {
    Write-Host "    Storefront:  https://shop.$domain" -ForegroundColor White
    Write-Host "    Dashboard:   https://dash.$domain" -ForegroundColor White
    Write-Host "    API:         https://api.$domain/graphql/" -ForegroundColor White
}
else {
    Write-Host "    Storefront:  http://localhost:3000" -ForegroundColor Gray
    Write-Host "    Dashboard:   http://localhost:9000" -ForegroundColor Gray
    Write-Host "    API:         http://localhost:8000/graphql/" -ForegroundColor Gray
    Write-Host "    (tunnel not running — showing localhost URLs)" -ForegroundColor DarkGray
}
Write-Host ""

# ---- Environment Mode ----
Write-Host "  Environment" -ForegroundColor Yellow
$envFile = Join-Path $infraDir ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw -ErrorAction SilentlyContinue
    if ($envContent -match "SELF-HOSTED CONFIGURATION") {
        Write-Host "    Mode: Self-Hosted (halacosmetics.org)" -ForegroundColor Green
    }
    else {
        Write-Host "    Mode: Development (localhost)" -ForegroundColor Yellow
    }
}
Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""
