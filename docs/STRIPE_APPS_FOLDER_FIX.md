# Fixing "No package.json found in /app" Error

## The Problem

The Stripe app container shows this error:

```
ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND  No package.json (or package.yaml, or package.json5) was found in "/app".
```

The container is restarting repeatedly because it can't find the `package.json` file.

## Root Cause

The apps folder might not be properly mounted, or the volume path isn't resolving correctly on Windows.

## Solution

### Step 1: Verify Apps Folder Exists

```powershell
cd c:\Users\micha\saleor-platform
Test-Path apps
Test-Path apps\package.json
```

Both should return `True`. If not, clone the apps repository:

```powershell
cd c:\Users\micha\saleor-platform
git clone https://github.com/saleor/apps.git
```

### Step 2: Use Absolute Path in Docker Compose

On Windows, Docker Compose sometimes has issues with relative paths. Update `infra/docker-compose.dev.yml`:

**Option A: Use ${PWD} variable (Recommended)**

```yaml
volumes:
  - ${PWD}/../apps:/app
```

**Option B: Use absolute path (if ${PWD} doesn't work)**

```yaml
volumes:
  - C:/Users/micha/saleor-platform/apps:/app
```

### Step 3: Recreate Container

```powershell
cd c:\Users\micha\saleor-platform\infra
docker compose -f docker-compose.dev.yml stop saleor-stripe-app
docker compose -f docker-compose.dev.yml rm -f saleor-stripe-app
docker compose -f docker-compose.dev.yml up -d saleor-stripe-app
```

### Step 4: Verify Container Can See package.json

```powershell
docker compose -f infra/docker-compose.dev.yml exec saleor-stripe-app ls -la /app/package.json
```

Should show the package.json file. If it says "No such file", the volume mount isn't working.

## Alternative: Use the Fix Script

Run the automated fix script:

```powershell
cd c:\Users\micha\saleor-platform\infra
.\scripts\fix-stripe-apps-folder.ps1
```

This script will:

1. Check if apps folder exists
2. Clone it if missing
3. Verify package.json exists
4. Recreate the container
5. Check logs for errors

## Verification Checklist

- [ ] Apps folder exists at `saleor-platform/apps`
- [ ] `package.json` exists at `saleor-platform/apps/package.json`
- [ ] Stripe app folder exists at `saleor-platform/apps/apps/stripe`
- [ ] Docker Compose volume path is correct
- [ ] Container can see `/app/package.json` inside container
- [ ] Container logs show no "No package.json" errors

## If Still Not Working

1. **Check Docker Desktop settings**: Ensure file sharing is enabled for `C:\Users\micha\saleor-platform`

2. **Try absolute path**: Use full Windows path in docker-compose.dev.yml:

   ```yaml
   volumes:
     - C:/Users/micha/saleor-platform/apps:/app
   ```

3. **Check container logs**:

   ```powershell
   docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app
   ```

4. **Verify mount inside container**:

   ```powershell
   docker compose -f infra/docker-compose.dev.yml exec saleor-stripe-app sh -c "ls -la /app"
   ```

5. **Check if apps folder has correct structure**:
   ```powershell
   cd c:\Users\micha\saleor-platform
   Get-ChildItem apps | Select-Object Name
   ```
   Should show: `apps`, `package.json`, `pnpm-workspace.yaml`, etc.

## Notes

- The apps repository is a monorepo, so `package.json` must be at the root (`apps/package.json`)
- Docker Compose on Windows may need absolute paths or `${PWD}` variable
- The volume mount must point to the monorepo root, not the Stripe app folder
- The container command runs `pnpm install` from `/app` (monorepo root), then `cd apps/stripe && pnpm dev`
