# Apps Folder Moved to saleor-platform

## Changes Made

The `apps` folder (Saleor Apps repository) has been moved **inside** the `saleor-platform` directory instead of being a sibling directory.

### Previous Structure

```
c:\Users\micha\
  ├── saleor-platform\
  └── apps\                    ← Was here (sibling)
```

### New Structure

```
c:\Users\micha\saleor-platform\
  ├── apps\                    ← Now here (inside)
  ├── dashboard\
  ├── saleor\
  ├── storefront\
  └── infra\
```

## Updated Files

### 1. `infra/docker-compose.dev.yml`

**Changed**: Volume mount path for Stripe app

**Before**:

```yaml
volumes:
  - ../../apps:/app
```

**After**:

```yaml
volumes:
  # Apps folder is now inside saleor-platform directory
  - ../apps:/app
```

### 2. `infra/scripts/setup-stripe-app.ps1`

**Changed**: Script now clones apps repository into saleor-platform instead of parent directory

**Before**: Cloned to `../apps` (parent directory)  
**After**: Clones to `./apps` (inside saleor-platform)

## Benefits

1. **Self-contained**: All Saleor-related code is now in one directory
2. **Easier to manage**: No need to navigate between sibling directories
3. **Better organization**: Everything related to the platform is together
4. **Simpler paths**: Relative paths are shorter and clearer

## Verification

To verify the apps folder is in the correct location:

```powershell
cd c:\Users\micha\saleor-platform
Test-Path apps
Test-Path apps\apps\stripe
```

Both should return `True`.

## Docker Compose

The Stripe app service in `docker-compose.dev.yml` now correctly mounts:

- `../apps:/app` (from `infra/` directory, goes up one level to `saleor-platform/`, then into `apps/`)

This means when you run:

```powershell
cd infra
docker compose -f docker-compose.dev.yml up -d saleor-stripe-app
```

The apps folder will be correctly mounted at `/app` inside the container.

## Next Steps

1. **If apps folder was already cloned elsewhere**: You can either:

   - Move it: `Move-Item C:\Users\micha\apps C:\Users\micha\saleor-platform\apps`
   - Or re-clone it: `cd saleor-platform && git clone https://github.com/saleor/apps.git`

2. **If apps folder doesn't exist**: Run:

   ```powershell
   cd c:\Users\micha\saleor-platform
   git clone https://github.com/saleor/apps.git
   ```

3. **Restart Stripe app container** (if running):
   ```powershell
   cd infra
   docker compose -f docker-compose.dev.yml restart saleor-stripe-app
   ```

## Notes

- The apps repository is a monorepo containing multiple Saleor apps
- The Stripe app is located at: `apps/apps/stripe`
- The docker-compose mounts the entire monorepo root (`apps/`) to `/app` in the container
- The Stripe app command runs from `/app/apps/stripe` inside the container
