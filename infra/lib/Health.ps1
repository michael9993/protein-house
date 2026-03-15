# ============================================================================
# Health.ps1 — Service Health Checking
# ============================================================================
# Functions to wait for containers to become healthy and test URL reachability.
#
# Usage:
#   . "$PSScriptRoot\lib\Health.ps1"
#   Wait-ForHealthy -ContainerName "saleor-api-dev"
#   $health = Get-AllServiceHealth -Config $config
# ============================================================================

function Wait-ForHealthy {
    <#
    .SYNOPSIS
    Polls a container until its status is "running" or the timeout is reached.
    Returns $true if healthy, $false on timeout.
    #>
    param(
        [string]$ContainerName,
        [int]$MaxWaitSeconds = 120
    )

    Write-Host "Waiting for $ContainerName to be ready..." -ForegroundColor Yellow
    $elapsed = 0
    $interval = 3

    while ($elapsed -lt $MaxWaitSeconds) {
        try {
            $state = docker inspect --format "{{.State.Status}}" $ContainerName 2>$null
            if ($LASTEXITCODE -eq 0 -and $state.Trim() -eq "running") {
                # Also check Docker health status if available
                $health = docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" $ContainerName 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $health = $health.Trim()
                    if ($health -eq "none" -or $health -eq "healthy") {
                        Write-Host "  [OK] $ContainerName is ready." -ForegroundColor Green
                        return $true
                    } elseif ($health -eq "unhealthy") {
                        Write-Host "  [WARN] $ContainerName reported unhealthy." -ForegroundColor Yellow
                        return $false
                    }
                    # still starting — fall through to wait
                } else {
                    Write-Host "  [OK] $ContainerName is running." -ForegroundColor Green
                    return $true
                }
            }
        } catch { }

        Start-Sleep -Seconds $interval
        $elapsed += $interval
        Write-Host "  Still waiting for $ContainerName... ($elapsed/$MaxWaitSeconds s)" -ForegroundColor Gray
    }

    Write-Host "  [WARN] $ContainerName did not become healthy within $MaxWaitSeconds s." -ForegroundColor Yellow
    return $false
}

function Test-UrlReachable {
    <#
    .SYNOPSIS
    Makes an HTTP GET to the given URL and returns $true if it responds (any 2xx/3xx/4xx).
    Returns $false on network error or timeout.
    #>
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 5
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSeconds `
            -UseBasicParsing -ErrorAction Stop -MaximumRedirection 0
        return ($response.StatusCode -lt 500)
    } catch [System.Net.WebException] {
        # A 4xx response still means the server is reachable
        $resp = $_.Exception.Response
        if ($resp -and [int]$resp.StatusCode -lt 500) {
            return $true
        }
        return $false
    } catch {
        return $false
    }
}

function Get-AllServiceHealth {
    <#
    .SYNOPSIS
    Checks health of all services that have a container defined.
    Returns a hashtable mapping service key -> @{ Status, Reachable }.
    #>
    param(
        [hashtable]$Config
    )

    $results = @{}

    foreach ($key in $Config.services.Keys) {
        $svc = $Config.services[$key]
        $containerStatus = "n/a"
        $urlReachable    = $null

        if ($svc.container) {
            try {
                $state = docker inspect --format "{{.State.Status}}" $svc.container 2>$null
                if ($LASTEXITCODE -eq 0 -and $state) {
                    $containerStatus = $state.Trim()
                } else {
                    $containerStatus = "not-found"
                }
            } catch {
                $containerStatus = "not-found"
            }
        }

        # Test URL reachability for services with a health_path
        if ($svc.port -and $svc.health_path -and $containerStatus -eq "running") {
            $url = "http://localhost:$($svc.port)$($svc.health_path)"
            $urlReachable = Test-UrlReachable -Url $url -TimeoutSeconds 3
        }

        $results[$key] = @{
            Status    = $containerStatus
            Reachable = $urlReachable
        }
    }

    return $results
}

# Functions are auto-exported when dot-sourced (Export-ModuleMember removed — only valid in .psm1)
