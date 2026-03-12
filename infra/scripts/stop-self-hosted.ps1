# ========================================
# Saleor Platform - Self-Hosted Stop Script
# ========================================
# Gracefully stops the platform and optionally takes a backup.
#
# Usage:
#   .\infra\scripts\stop-self-hosted.ps1                # Stop tunnel + containers
#   .\infra\scripts\stop-self-hosted.ps1 -Backup        # Backup DB before stopping
#   .\infra\scripts\stop-self-hosted.ps1 -RestoreDev    # Stop + restore dev .env
#   .\infra\scripts\stop-self-hosted.ps1 -TunnelOnly    # Stop tunnel only (containers keep running)

param(
    [switch]$Backup,       # Take a database backup before stopping
    [switch]$RestoreDev,   # Restore .env.dev-backup after stopping
    [switch]$TunnelOnly    # Only stop the tunnel, keep containers running
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$infraDir = Split-Path -Parent $scriptDir
$composeFile = Join-Path $infraDir "docker-compose.dev.yml"
$envFile = Join-Path $infraDir ".env"
$envDevBackup = Join-Path $infraDir ".env.dev-backup"

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "   Aura E-Commerce Platform" -ForegroundColor White
Write-Host "   Stopping Self-Hosted Services" -ForegroundColor Yellow
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Optional backup
if ($Backup) {
    Write-Host "[1/4] Taking database backup before stopping..." -ForegroundColor Cyan
    $backupScript = Join-Path $scriptDir "backup-self-hosted.ps1"
    if (Test-Path $backupScript) {
        & $backupScript
    }
    else {
        # Inline backup if script doesn't exist yet
        $timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
        $backupDir = if ($env:SALEOR_BACKUP_DIR) { $env:SALEOR_BACKUP_DIR } else { Join-Path $env:USERPROFILE "saleor-backups" }
        if (-not (Test-Path $backupDir)) {
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        }
        $backupFile = Join-Path $backupDir "saleor-$timestamp.sql"
        Write-Host "  Dumping database to $backupFile..." -ForegroundColor Gray
        docker exec saleor-postgres-dev pg_dump -U saleor saleor > $backupFile 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Backup saved: $backupFile" -ForegroundColor Green
        }
        else {
            Write-Host "  Backup failed (container may already be stopped)" -ForegroundColor Yellow
        }
    }
}
else {
    Write-Host "[1/4] Skipping backup (use -Backup flag to backup before stopping)" -ForegroundColor Gray
}

# Step 2: Stop Cloudflare tunnel
Write-Host "[2/4] Stopping Cloudflare tunnel..." -ForegroundColor Cyan
$tunnelProcesses = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($tunnelProcesses) {
    $tunnelProcesses | ForEach-Object {
        Write-Host "  Stopping cloudflared (PID: $($_.Id))..." -ForegroundColor Gray
        $_ | Stop-Process -Force
    }
    Write-Host "  All tunnel processes stopped" -ForegroundColor Green
}
else {
    Write-Host "  No cloudflared processes running" -ForegroundColor Gray
}

# Step 3: Stop Docker containers
if (-not $TunnelOnly) {
    Write-Host "[3/4] Stopping Docker containers..." -ForegroundColor Cyan
    docker compose -f $composeFile down 2>&1 | ForEach-Object {
        if ($_ -match "Stopped|Removed") {
            Write-Host "  $_" -ForegroundColor Gray
        }
    }
    Write-Host "  All containers stopped" -ForegroundColor Green
}
else {
    Write-Host "[3/4] Skipping container stop (--TunnelOnly flag)" -ForegroundColor Gray
    Write-Host "  Containers still running on localhost" -ForegroundColor Gray
}

# Step 4: Restore dev .env if requested
if ($RestoreDev) {
    Write-Host "[4/4] Restoring development .env..." -ForegroundColor Cyan
    if (Test-Path $envDevBackup) {
        Copy-Item $envDevBackup $envFile -Force
        Write-Host "  Restored .env from .env.dev-backup" -ForegroundColor Green
        Write-Host "  Next: docker compose -f $composeFile up -d" -ForegroundColor Gray
    }
    else {
        Write-Host "  No .env.dev-backup found — .env unchanged" -ForegroundColor Yellow
    }
}
else {
    Write-Host "[4/4] Keeping self-hosted .env (use -RestoreDev to switch back)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "  Platform stopped." -ForegroundColor Green
if (-not $TunnelOnly) {
    Write-Host "  To restart: .\infra\scripts\launch-self-hosted.ps1" -ForegroundColor Gray
}
else {
    Write-Host "  Tunnel stopped. Containers available on localhost." -ForegroundColor Gray
    Write-Host "  To restart tunnel: cloudflared tunnel --config infra/cloudflared-config.yml run" -ForegroundColor Gray
}
Write-Host ""
