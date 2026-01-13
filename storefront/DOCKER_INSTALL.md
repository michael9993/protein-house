# Installing react-slider in Docker Container

Since you're using Docker containers, here's how to install the `react-slider` library:

## Option 1: Automatic Installation (Recommended)

The Docker container will automatically install dependencies when it starts. Since we've already added `react-slider` to `package.json`, you just need to restart the storefront container:

```powershell
# From the infra/ directory
docker compose -f docker-compose.dev.yml restart saleor-storefront
```

The container runs `pnpm install` on startup, so it will automatically install the new dependency.

## Option 2: Manual Installation (If needed)

If you want to install it manually inside the container:

```powershell
# Execute into the storefront container
docker compose -f docker-compose.dev.yml exec saleor-storefront sh

# Inside the container, install the package
pnpm add react-slider @types/react-slider

# Exit the container
exit
```

## Option 3: Rebuild Container (If issues persist)

If the automatic installation doesn't work, you can force a rebuild:

```powershell
# Stop the storefront container
docker compose -f docker-compose.dev.yml stop saleor-storefront

# Remove the container (keeps volumes)
docker compose -f docker-compose.dev.yml rm saleor-storefront

# Start again (will reinstall dependencies)
docker compose -f docker-compose.dev.yml up -d saleor-storefront
```

## Verify Installation

Check that the package is installed:

```powershell
# Check package.json (should show react-slider)
docker compose -f docker-compose.dev.yml exec saleor-storefront cat package.json | grep react-slider

# Or check node_modules
docker compose -f docker-compose.dev.yml exec saleor-storefront ls node_modules | grep react-slider
```

## Check Logs

If you encounter issues, check the container logs:

```powershell
# View storefront logs
docker compose -f docker-compose.dev.yml logs -f saleor-storefront
```

Look for any errors during `pnpm install`.

## Notes

- The `package.json` has been updated with `react-slider` and `@types/react-slider`
- The Docker volume `storefront-node-modules` preserves installed packages between restarts
- If you see import errors, make sure the container has restarted after the package.json change

