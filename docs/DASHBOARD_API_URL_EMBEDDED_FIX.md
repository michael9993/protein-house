# Fixing Dashboard API_URL Embedded in HTML

## The Problem

The Dashboard's Vite configuration embeds `API_URL` directly into the HTML template at startup. Even if you update the environment variable and restart the container, the HTML might still contain the old `localhost:8000` value.

## Why This Happens

1. Vite reads `API_URL` from environment variables when it starts
2. Vite injects this value into the HTML template using `createHtmlPlugin`
3. The HTML is served to the browser with the API_URL embedded
4. If Vite started with `localhost:8000`, that value is in the HTML
5. Even after updating the environment variable, Vite needs to restart to regenerate the HTML

## Solution

### Step 1: Ensure .env File is Correct

```powershell
cd infra

# Create/update .env file
@"
DASHBOARD_API_URL=https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/
STRIPE_APP_URL=https://indiana-decades-burn-cold.trycloudflare.com
"@ | Out-File -FilePath .env -Encoding utf8 -Force
```

### Step 2: Completely Recreate Dashboard

**Important**: You must **remove** the container, not just restart it:

```powershell
# Stop and remove
docker compose -f docker-compose.dev.yml stop saleor-dashboard
docker compose -f docker-compose.dev.yml rm -f saleor-dashboard

# Recreate (this will read the new .env file)
docker compose -f docker-compose.dev.yml up -d saleor-dashboard

# Wait 45-60 seconds for Vite to fully start and generate HTML
Start-Sleep -Seconds 45
```

### Step 3: Verify HTML Contains Tunnel URL

Check the Dashboard HTML to see what API_URL is embedded:

```powershell
# Fetch Dashboard HTML
$html = Invoke-WebRequest -Uri "https://lately-tue-river-risks.trycloudflare.com" -UseBasicParsing

# Check if it contains the tunnel URL
if ($html.Content -match "refugees-fleece-peterson-incurred") {
    Write-Host "✓ HTML contains tunnel URL" -ForegroundColor Green
} elseif ($html.Content -match "localhost:8000") {
    Write-Host "✗ HTML still contains localhost:8000" -ForegroundColor Red
    Write-Host "  Wait 30 more seconds and check again" -ForegroundColor Yellow
}
```

### Step 4: Hard Refresh Browser

After the Dashboard is recreated:

1. **Close all Dashboard tabs**
2. **Open a new incognito/private window**
3. **Navigate to**: `https://lately-tue-river-risks.trycloudflare.com`
4. **Open DevTools (F12)** → Network tab
5. **Check GraphQL requests** - they should go to the tunnel URL

## Alternative: Set Environment Variable Explicitly

If the `.env` file isn't being read, set the environment variable explicitly:

```powershell
cd infra

# Set environment variable for this PowerShell session
$env:DASHBOARD_API_URL = "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/"

# Recreate Dashboard (it will use the environment variable)
docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-dashboard
```

## Why Regular Restart Doesn't Work

A simple `restart` command doesn't work because:

- Vite has already generated the HTML with the old API_URL
- Restarting doesn't regenerate the HTML
- You need to **remove and recreate** the container so Vite starts fresh

## Verification Checklist

- [ ] `.env` file exists in `infra/` directory
- [ ] `.env` file contains `DASHBOARD_API_URL` with tunnel URL
- [ ] Dashboard container was **removed** (not just restarted)
- [ ] Dashboard container was **recreated**
- [ ] Waited 45+ seconds for Vite to start
- [ ] Dashboard HTML contains tunnel URL (check via curl/Invoke-WebRequest)
- [ ] Browser shows GraphQL requests going to tunnel URL (DevTools)
- [ ] Hard refresh performed (Ctrl+Shift+R or incognito window)

## Quick Fix Script

Use the fix script:

```powershell
cd infra
.\scripts\fix-dashboard-api-url-final.ps1
```

This script will:

1. Update `.env` file
2. Remove Dashboard container completely
3. Recreate with new environment
4. Wait for Vite to regenerate HTML
5. Verify the configuration

## If Still Not Working

If the Dashboard HTML still contains `localhost:8000` after recreating:

1. **Check .env file location**: Docker Compose reads `.env` from the same directory as `docker-compose.dev.yml`

   ```powershell
   # Should be in infra/ directory
   Get-Content infra\.env
   ```

2. **Set environment variable explicitly**:

   ```powershell
   $env:DASHBOARD_API_URL = "https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/"
   docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-dashboard
   ```

3. **Check Docker Compose is reading it**:

   ```powershell
   docker compose -f docker-compose.dev.yml config | Select-String -Pattern "API_URL"
   ```

4. **Wait longer**: Vite might need more time to regenerate HTML (try 60 seconds)

5. **Check Dashboard logs**:
   ```powershell
   docker compose -f docker-compose.dev.yml logs saleor-dashboard | Select-String -Pattern "API_URL|VITE"
   ```
