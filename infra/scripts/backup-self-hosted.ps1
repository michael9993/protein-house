# ========================================
# Saleor Platform - Self-Hosted Backup Script
# ========================================
# Dumps the PostgreSQL database and manages backup rotation.
#
# Usage:
#   .\infra\scripts\backup-self-hosted.ps1                    # Backup now
#   .\infra\scripts\backup-self-hosted.ps1 -Retain 30         # Keep last 30 backups (default)
#   .\infra\scripts\backup-self-hosted.ps1 -Compress          # Gzip the backup
#   .\infra\scripts\backup-self-hosted.ps1 -Quiet             # No output (for Task Scheduler)
#
# Task Scheduler Setup (daily at 2 AM):
#   Name:    Saleor Daily Backup
#   Trigger: Daily at 2:00 AM
#   Action:  PowerShell.exe
#   Args:    -ExecutionPolicy Bypass -File "C:\Users\micha\saleor-platform\infra\scripts\backup-self-hosted.ps1" -Compress -Quiet
#   Cond:    Start only if computer is ON

param(
    [int]$Retain = 30,       # Number of backups to keep
    [switch]$Compress,       # Gzip the backup (requires 7z or gzip)
    [switch]$Quiet,          # Suppress output (for scheduled tasks)
    [string]$BackupDir = ""  # Override backup directory (default: SALEOR_BACKUP_DIR env var or ~/saleor-backups)
)

$ErrorActionPreference = "Stop"
$backupDir = if ($BackupDir) { $BackupDir } elseif ($env:SALEOR_BACKUP_DIR) { $env:SALEOR_BACKUP_DIR } else { Join-Path $env:USERPROFILE "saleor-backups" }
$container = "saleor-postgres-dev"
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupFile = Join-Path $backupDir "saleor-$timestamp.sql"
$logFile = Join-Path $backupDir "backup.log"

function Log {
    param([string]$Message, [string]$Color = "White")
    $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
    Add-Content -Path $logFile -Value $logEntry -ErrorAction SilentlyContinue
    if (-not $Quiet) {
        Write-Host $Message -ForegroundColor $Color
    }
}

# Ensure backup directory exists
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

Log "Starting database backup..." "Cyan"

# Check if container is running
$status = docker inspect --format '{{.State.Status}}' $container 2>&1
if ($status -ne "running") {
    Log "ERROR: PostgreSQL container ($container) is not running. Status: $status" "Red"
    exit 1
}

# Perform pg_dump
Log "  Dumping database to: $backupFile" "Gray"
try {
    docker exec $container pg_dump -U saleor --no-owner --no-acl saleor > $backupFile 2>$null

    if ($LASTEXITCODE -ne 0) {
        Log "ERROR: pg_dump failed with exit code $LASTEXITCODE" "Red"
        if (Test-Path $backupFile) { Remove-Item $backupFile -Force }
        exit 1
    }

    # Verify backup is not empty
    $fileSize = (Get-Item $backupFile).Length
    if ($fileSize -lt 1000) {
        Log "ERROR: Backup file is suspiciously small ($fileSize bytes)" "Red"
        exit 1
    }

    $sizeMB = [math]::Round($fileSize / 1MB, 1)
    Log "  Backup complete: $sizeMB MB" "Green"
}
catch {
    Log "ERROR: Backup failed: $_" "Red"
    if (Test-Path $backupFile) { Remove-Item $backupFile -Force }
    exit 1
}

# Optional compression
if ($Compress) {
    $compressedFile = "$backupFile.gz"
    Log "  Compressing backup..." "Gray"

    # Try gzip (WSL or Git Bash)
    $gzipPath = Get-Command gzip -ErrorAction SilentlyContinue
    $sevenZipPath = Get-Command 7z -ErrorAction SilentlyContinue

    if ($gzipPath) {
        & gzip $backupFile
        if (Test-Path $compressedFile) {
            $compressedSize = [math]::Round((Get-Item $compressedFile).Length / 1MB, 1)
            Log "  Compressed: $compressedSize MB (gzip)" "Green"
        }
    }
    elseif ($sevenZipPath) {
        & 7z a -tgzip $compressedFile $backupFile | Out-Null
        if (Test-Path $compressedFile) {
            Remove-Item $backupFile -Force
            $compressedSize = [math]::Round((Get-Item $compressedFile).Length / 1MB, 1)
            Log "  Compressed: $compressedSize MB (7z)" "Green"
        }
    }
    else {
        # Use PowerShell built-in compression (creates .zip instead of .gz)
        $zipFile = "$backupFile.zip"
        Compress-Archive -Path $backupFile -DestinationPath $zipFile -Force
        if (Test-Path $zipFile) {
            Remove-Item $backupFile -Force
            $compressedSize = [math]::Round((Get-Item $zipFile).Length / 1MB, 1)
            Log "  Compressed: $compressedSize MB (zip)" "Green"
        }
    }
}

# Rotate old backups
$allBackups = Get-ChildItem $backupDir -Filter "saleor-*" | Sort-Object LastWriteTime -Descending
if ($allBackups.Count -gt $Retain) {
    $toDelete = $allBackups | Select-Object -Skip $Retain
    $deleteCount = $toDelete.Count
    $toDelete | Remove-Item -Force
    Log "  Rotated: deleted $deleteCount old backup(s), keeping last $Retain" "Gray"
}

# Summary
$totalBackups = (Get-ChildItem $backupDir -Filter "saleor-*").Count
$totalSize = (Get-ChildItem $backupDir -Filter "saleor-*" | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 1)
Log "  Total: $totalBackups backups ($totalSizeMB MB)" "White"
Log "Backup complete." "Green"
