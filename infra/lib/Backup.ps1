# ============================================================================
# Backup.ps1 -- Database Backup and Restore
# ============================================================================
# pg_dump-based backup/restore via the postgres container.
# Supports optional gzip compression and automatic rotation.
#
# Usage:
#   . "$PSScriptRoot\lib\Backup.ps1"
#   New-DatabaseBackup -Config $config -Compress
#   Restore-Database -BackupFile "~/saleor-backups/saleor-2026-03-12.sql.gz"
# ============================================================================

function New-DatabaseBackup {
    <#
    .SYNOPSIS
    Creates a timestamped pg_dump of the Saleor database.
    Saves to the configured backup directory. Rotates old backups.
    #>
    param(
        [hashtable]$Config,
        [switch]$Compress,
        [switch]$Quiet
    )

    $backupConfig = $Config.backup
    $dir = $backupConfig.directory
    # Expand ~ on Windows
    if ($dir -match "^~") {
        $dir = $dir -replace "^~", $env:USERPROFILE
    }
    $dir = $dir -replace "/", "\"

    # Determine compress from config if not explicitly passed via -Compress switch
    $doCompress = [bool]$Compress
    if (-not $doCompress -and $backupConfig.compress) {
        $doCompress = $true
    }

    # Postgres container info
    $pgContainer = $Config.services.postgres.container
    if (-not $pgContainer) {
        $prefix = if ($env:COMPOSE_PREFIX) { $env:COMPOSE_PREFIX } else { "aura" }
        $pgContainer = "$prefix-postgres-dev"
    }

    # Ensure backup dir exists
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        if (-not $Quiet) { Write-Host "Created backup directory: $dir" -ForegroundColor Gray }
    }

    $timestamp  = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $ext        = if ($doCompress) { ".sql.gz" } else { ".sql" }
    $filename   = "saleor-$timestamp$ext"
    $outputPath = Join-Path $dir $filename

    if (-not $Quiet) {
        Write-Host "Creating database backup..." -ForegroundColor Yellow
        Write-Host "  Container : $pgContainer" -ForegroundColor Gray
        Write-Host "  Output    : $outputPath" -ForegroundColor Gray
    }

    try {
        if ($doCompress) {
            # pg_dump | gzip piped through docker exec, output captured
            $dumpOutput = docker exec $pgContainer pg_dump -U saleor saleor 2>$null
            if ($LASTEXITCODE -ne 0) {
                throw "pg_dump failed (exit $LASTEXITCODE)"
            }
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($dumpOutput)
            $ms    = New-Object System.IO.MemoryStream
            $gz    = New-Object System.IO.Compression.GZipStream($ms, [System.IO.Compression.CompressionMode]::Compress)
            $gz.Write($bytes, 0, $bytes.Length)
            $gz.Close()
            [System.IO.File]::WriteAllBytes($outputPath, $ms.ToArray())
        } else {
            $dumpOutput = docker exec $pgContainer pg_dump -U saleor saleor
            if ($LASTEXITCODE -ne 0) {
                throw "pg_dump failed (exit $LASTEXITCODE)"
            }
            $dumpOutput | Set-Content $outputPath -Encoding UTF8
        }
    } catch {
        throw "Backup failed: $_"
    }

    $sizeMB = [math]::Round((Get-Item $outputPath).Length / 1MB, 2)
    if (-not $Quiet) {
        Write-Host "[OK] Backup created: $filename ($sizeMB MB)" -ForegroundColor Green
    }

    # Rotate old backups
    $retain = if ($backupConfig.retain) { [int]$backupConfig.retain } else { 30 }
    $allBackups = Get-ChildItem -Path $dir -Filter "saleor-*.sql*" |
        Sort-Object LastWriteTime -Descending
    if ($allBackups.Count -gt $retain) {
        $toDelete = $allBackups | Select-Object -Skip $retain
        foreach ($old in $toDelete) {
            Remove-Item $old.FullName -Force
            if (-not $Quiet) {
                Write-Host "  Rotated: $($old.Name)" -ForegroundColor Gray
            }
        }
    }

    return $outputPath
}

function Restore-Database {
    <#
    .SYNOPSIS
    Restores the Saleor database from a .sql or .sql.gz backup file.
    DROPS the existing database and recreates it -- use with care.
    #>
    param(
        [string]$BackupFile
    )

    if (-not $BackupFile) {
        throw "BackupFile parameter is required."
    }

    # Expand ~ on Windows
    $BackupFile = $BackupFile -replace "^~", $env:USERPROFILE
    $BackupFile = $BackupFile -replace "/", "\"

    if (-not (Test-Path $BackupFile)) {
        throw "Backup file not found: $BackupFile"
    }

    $prefix = if ($env:COMPOSE_PREFIX) { $env:COMPOSE_PREFIX } else { "aura" }
    $pgContainer = "$prefix-postgres-dev"
    $isGz        = $BackupFile.EndsWith(".gz")

    Write-Host "Restoring database from: $BackupFile" -ForegroundColor Yellow
    Write-Host "[WARN] This will DROP and recreate the saleor database." -ForegroundColor Red
    $confirm = Read-Host "Type 'yes' to continue"
    if ($confirm -ne "yes") {
        Write-Host "Restore cancelled." -ForegroundColor Gray
        return
    }

    # Drop and recreate
    Write-Host "Dropping existing database..." -ForegroundColor Yellow
    docker exec $pgContainer psql -U saleor -d postgres -c "DROP DATABASE IF EXISTS saleor;" 2>$null
    docker exec $pgContainer psql -U saleor -d postgres -c "CREATE DATABASE saleor OWNER saleor;" 2>$null

    Write-Host "Restoring..." -ForegroundColor Yellow

    if ($isGz) {
        # Decompress locally, pipe into psql via docker exec stdin
        $bytes      = [System.IO.File]::ReadAllBytes($BackupFile)
        $ms         = New-Object System.IO.MemoryStream(, $bytes)
        $gz         = New-Object System.IO.Compression.GZipStream($ms, [System.IO.Compression.CompressionMode]::Decompress)
        $reader     = New-Object System.IO.StreamReader($gz)
        $sqlContent = $reader.ReadToEnd()
        $reader.Close()

        $sqlContent | docker exec -i $pgContainer psql -U saleor saleor
    } else {
        Get-Content $BackupFile | docker exec -i $pgContainer psql -U saleor saleor
    }

    if ($LASTEXITCODE -ne 0) {
        throw "Restore failed (psql exit $LASTEXITCODE)"
    }

    Write-Host "[OK] Database restored from $BackupFile." -ForegroundColor Green
    Write-Host "Remember to restart the API container after restore:" -ForegroundColor Gray
    Write-Host "  docker compose -f infra/docker-compose.dev.yml restart saleor-api" -ForegroundColor Gray
}

function Get-BackupHistory {
    <#
    .SYNOPSIS
    Lists recent backups in the configured backup directory.
    Returns an array of file info objects sorted newest-first.
    #>
    param(
        [hashtable]$Config
    )

    $dir = $Config.backup.directory
    if ($dir -match "^~") {
        $dir = $dir -replace "^~", $env:USERPROFILE
    }
    $dir = $dir -replace "/", "\"

    if (-not (Test-Path $dir)) {
        Write-Host "No backup directory found at: $dir" -ForegroundColor Gray
        return @()
    }

    $backups = Get-ChildItem -Path $dir -Filter "saleor-*.sql*" |
        Sort-Object LastWriteTime -Descending

    if ($backups.Count -eq 0) {
        Write-Host "No backups found in $dir" -ForegroundColor Gray
        return @()
    }

    Write-Host ""
    Write-Host "Recent backups in $dir :" -ForegroundColor Cyan
    Write-Host ("-" * 70) -ForegroundColor DarkGray

    $i = 0
    foreach ($f in $backups) {
        $i++
        $age    = (Get-Date) - $f.LastWriteTime
        $ageStr = if ($age.Days -gt 0) { "$($age.Days)d ago" } `
                  elseif ($age.Hours -gt 0) { "$($age.Hours)h ago" } `
                  else { "$($age.Minutes)m ago" }
        $sizeMB = [math]::Round($f.Length / 1MB, 2)
        $marker = if ($i -eq 1) { " (latest)" } else { "" }
        Write-Host "  $($f.Name.PadRight(45)) $("$sizeMB MB".PadRight(10)) $ageStr$marker" -ForegroundColor White
    }
    Write-Host ""

    return $backups
}

# Functions are auto-exported when dot-sourced (Export-ModuleMember removed -- only valid in .psm1)
