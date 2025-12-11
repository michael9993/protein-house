# PowerShell script to create a tunnel for Saleor Storefront (port 3000)
# This allows external access to your Storefront for testing, demos, etc.

param(
    [string]$Tool = "cloudflared"  # Options: "cloudflared" or "ngrok"
)

Write-Host "Creating tunnel for Saleor Storefront (port 3000)..." -ForegroundColor Green
Write-Host ""
Write-Host "Note: Storefront tunnel is OPTIONAL. You only need this for:" -ForegroundColor Yellow
Write-Host "  - Testing from mobile devices (real phone testing)" -ForegroundColor Gray
Write-Host "  - Sharing storefront with team/clients" -ForegroundColor Gray
Write-Host "  - External demos or user testing" -ForegroundColor Gray
Write-Host ""
Write-Host "For local development, just use http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

if ($Tool -eq "cloudflared") {
    cloudflared tunnel --url http://localhost:3000
}
elseif ($Tool -eq "ngrok") {
    ngrok http 3000
}
else {
    Write-Host "Unknown tool: $Tool. Use 'cloudflared' or 'ngrok'" -ForegroundColor Red
    exit 1
}
