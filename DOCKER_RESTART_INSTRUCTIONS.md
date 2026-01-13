# Docker Restart Instructions for Dashboard Changes

**Date**: January 2025  
**Changes**: Copied files from Saleor Dashboard 3.22.24

---

## ✅ Good News: Files Are Already in Container!

Your `docker-compose.dev.yml` mounts the dashboard directory as a volume:
```yaml
volumes:
  - ../dashboard:/app  # Your local files are mounted!
```

This means the files we copied are **already accessible** in the container.

---

## 🔄 Restart Dashboard Container

The dashboard container needs to rebuild to pick up the changes. Here's how:

### Option 1: Restart Dashboard Service (Recommended)

```powershell
cd infra
docker compose -f docker-compose.dev.yml restart saleor-dashboard
```

**Note**: This restarts the container, but it may need to rebuild. If changes don't appear, use Option 2.

---

### Option 2: Rebuild and Restart (If Option 1 Doesn't Work)

```powershell
cd infra
docker compose -f docker-compose.dev.yml up -d --build saleor-dashboard
```

This will:
1. Rebuild the container
2. Run `pnpm install` (if package.json changed)
3. Run `pnpm run generate:main` (generate GraphQL types)
4. Run `pnpm run build` (build the app)
5. Start the preview server

---

### Option 3: Full Rebuild (If You Have Issues)

```powershell
cd infra
# Stop the container
docker compose -f docker-compose.dev.yml stop saleor-dashboard

# Remove the container (keeps volumes)
docker compose -f docker-compose.dev.yml rm -f saleor-dashboard

# Rebuild and start
docker compose -f docker-compose.dev.yml up -d --build saleor-dashboard
```

---

## 📋 What Happens When Container Restarts

The dashboard container runs this command:
```bash
pnpm install --prefer-offline && 
pnpm run generate:main && 
pnpm run build && 
pnpm run preview --host 0.0.0.0 --port 9000
```

This means:
1. ✅ Dependencies are installed (if needed)
2. ✅ GraphQL types are generated
3. ✅ Application is built with your new files
4. ✅ Preview server starts on port 9000

---

## 🔍 Check Container Status

```powershell
# Check if container is running
docker ps | Select-String "saleor-dashboard"

# View logs
docker compose -f docker-compose.dev.yml logs -f saleor-dashboard

# Check container health
docker inspect saleor-dashboard-dev | Select-String -Pattern "Health|Status"
```

---

## ⚠️ Important Notes

### 1. Build Time
The build process can take 2-5 minutes, especially on first build. Be patient!

### 2. GraphQL Types
If you see TypeScript errors, the container will regenerate GraphQL types automatically via `pnpm run generate:main`.

### 3. Node Modules
The container uses a volume for `node_modules` to preserve installed packages:
```yaml
- dashboard-node-modules:/app/node_modules
```
This means dependencies persist between restarts.

### 4. Hot Reload
The dashboard runs in **production preview mode** (not dev mode), so changes require a rebuild.

---

## 🚀 Quick Restart Command

```powershell
# Navigate to infra directory
cd C:\Users\micha\saleor-platform\infra

# Restart dashboard (rebuilds if needed)
docker compose -f docker-compose.dev.yml up -d --build saleor-dashboard

# Watch logs to see build progress
docker compose -f docker-compose.dev.yml logs -f saleor-dashboard
```

---

## ✅ Verify Changes After Restart

1. **Wait for build to complete** (watch logs)
2. **Access dashboard**: http://localhost:9000 (or your configured port)
3. **Test features**:
   - Hover over logo → Cloud icon should appear
   - Open metadata dialogs → Should show confirmation
   - Check product assignment modals → Should have Filter button (if using AssignProductDialog)

---

## 🐛 Troubleshooting

### Container Won't Start
```powershell
# Check logs for errors
docker compose -f docker-compose.dev.yml logs saleor-dashboard

# Check if port is in use
netstat -ano | findstr :9000
```

### Build Fails
```powershell
# Clear node_modules and rebuild
docker compose -f docker-compose.dev.yml exec saleor-dashboard sh -c "rm -rf node_modules && pnpm install"
```

### TypeScript Errors
The container will regenerate GraphQL types automatically. If errors persist:
```powershell
# Regenerate types manually
docker compose -f docker-compose.dev.yml exec saleor-dashboard pnpm run generate:main
```

---

## 📝 Summary

**Files Copied**:
- ✅ `MountingPoint.tsx` - Cloud icon on hover
- ✅ `AssignProductDialog/` - Filter button feature
- ✅ `MetadataDialog.tsx` - Cleaner confirmation dialog

**Next Step**:
```powershell
cd infra
docker compose -f docker-compose.dev.yml up -d --build saleor-dashboard
```

**That's it!** The container will rebuild with your new files.

