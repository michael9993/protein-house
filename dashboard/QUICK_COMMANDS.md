# Quick Commands for Dashboard

## Important: Working Directory

When running Docker commands, make sure you're in the correct directory:

### ✅ Correct (from `infra/` directory):

```powershell
cd C:\Users\micha\saleor-platform\infra
docker compose -f docker-compose.dev.yml logs -f saleor-dashboard
```

### ❌ Wrong (don't use `infra/` prefix when already in `infra/`):

```powershell
cd C:\Users\micha\saleor-platform\infra
docker compose -f infra/docker-compose.dev.yml logs -f saleor-dashboard  # ❌ Wrong path!
```

## Common Commands

### View Logs

```powershell
# From infra/ directory
docker compose -f docker-compose.dev.yml logs -f saleor-dashboard

# Last 50 lines
docker compose -f docker-compose.dev.yml logs saleor-dashboard --tail=50
```

### Check Status

```powershell
# From infra/ directory
docker compose -f docker-compose.dev.yml ps saleor-dashboard
```

### Restart Dashboard

```powershell
# From infra/ directory
docker compose -f docker-compose.dev.yml restart saleor-dashboard
```

### Start/Stop

```powershell
# From infra/ directory
docker compose -f docker-compose.dev.yml up -d saleor-dashboard
docker compose -f docker-compose.dev.yml stop saleor-dashboard
```

### Access Container

```powershell
# From infra/ directory
docker compose -f docker-compose.dev.yml exec saleor-dashboard sh
```

## Quick Reference

**Always run Docker commands from:**

```
C:\Users\micha\saleor-platform\infra\
```

**Use this file path:**

```
docker-compose.dev.yml  (not infra/docker-compose.dev.yml)
```
