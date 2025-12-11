# PowerShell script to create a tunnel for Saleor API (port 8000)

param(
    [string]$Tool = "cloudflared"  # Options: "cloudflared" or "ngrok"
)

& "$PSScriptRoot\tunnel-stripe.ps1" -Port 8000 -Tool $Tool
