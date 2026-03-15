$files = @(
    "$PSScriptRoot\platform.ps1",
    "$PSScriptRoot\lib\Config.ps1",
    "$PSScriptRoot\lib\Display.ps1",
    "$PSScriptRoot\lib\Docker.ps1",
    "$PSScriptRoot\lib\Health.ps1",
    "$PSScriptRoot\lib\Tunnels.ps1",
    "$PSScriptRoot\lib\EnvManager.ps1",
    "$PSScriptRoot\lib\Apps.ps1",
    "$PSScriptRoot\lib\Backup.ps1"
)

foreach ($f in $files) {
    $tokens = $null
    $errors = $null
    $null = [System.Management.Automation.Language.Parser]::ParseFile($f, [ref]$tokens, [ref]$errors)
    $name = Split-Path $f -Leaf
    if ($errors.Count -gt 0) {
        foreach ($e in $errors) {
            Write-Host "FAIL $name line $($e.Extent.StartLineNumber): $($e.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "OK   $name" -ForegroundColor Green
    }
}
