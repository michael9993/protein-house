# PowerShell script to create a tunnel for Saleor Dashboard (port 9000)
# This allows external access to your Dashboard for demos, mobile testing, etc.

param(
    [string]$Tool = "cloudflared"  # Options: "cloudflared" or "ngrok"
)

Write-Host "Creating tunnel for Saleor Dashboard (port 9000)..." -ForegroundColor Green
Write-Host ""
Write-Host "Note: Dashboard tunnel is OPTIONAL. You only need this for:" -ForegroundColor Yellow
Write-Host "  - Accessing Dashboard from mobile devices" -ForegroundColor Gray
Write-Host "  - Sharing Dashboard with team/clients" -ForegroundColor Gray
Write-Host "  - External demos" -ForegroundColor Gray
Write-Host ""
Write-Host "For local development, just use http://localhost:9000" -ForegroundColor Cyan
Write-Host ""

if ($Tool -eq "cloudflared") {
    cloudflared tunnel --url http://localhost:9000
}
elseif ($Tool -eq "ngrok") {
    ngrok http 9000
}
else {
    Write-Host "Unknown tool: $Tool. Use 'cloudflared' or 'ngrok'" -ForegroundColor Red
    exit 1
}
