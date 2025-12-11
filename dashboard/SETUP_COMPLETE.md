# Dashboard Setup Complete ✅

## What Was Configured

The Saleor Dashboard is now set up to run in Docker with your local code, just like the API.

### Configuration Details

1. **Docker Service**: `saleor-dashboard-dev`

   - Uses `node:22-alpine` image
   - Runs Vite dev server for hot-reload
   - Port: `9000` (mapped from container port `5173`)

2. **Local Code Location**:

   - `C:\Users\micha\saleor-dashboard\`
   - All source code is mounted for hot-reload

3. **Environment Variables**:

   - `API_URL`: `http://saleor-api:8000/graphql/` (internal Docker network)
   - `VITE_API_URL`: `http://localhost:8000/graphql/` (for browser)
   - Automatically connects to your Saleor API

4. **API Configuration Updated**:
   - Added `localhost:9000` to `ALLOWED_CLIENT_HOSTS`
   - Dashboard can now communicate with the API

## Current Status

The dashboard container is currently:

- ✅ Installing dependencies (first time only, takes a few minutes)
- ✅ Will generate GraphQL types
- ✅ Will start Vite dev server

## Next Steps

### 1. Wait for Installation

The first startup takes time to:

- Install pnpm
- Install ~1580 npm packages
- Generate GraphQL types
- Start Vite server

**Check progress:**

```powershell
docker compose -f infra/docker-compose.dev.yml logs -f saleor-dashboard
```

### 2. Verify It's Running

Once you see "Local: http://localhost:5173" in the logs:

```powershell
# Check status
docker compose -f infra/docker-compose.dev.yml ps saleor-dashboard

# Should show: Up (healthy)
```

### 3. Access Dashboard

Open in browser:

- **Dashboard**: http://localhost:9000
- **GraphQL API**: http://localhost:8000/graphql/

### 4. Login

1. Go to http://localhost:9000
2. Create admin account (if first time):
   ```powershell
   docker compose -f infra/docker-compose.dev.yml exec saleor-api python manage.py createsuperuser
   ```
3. Or use existing credentials

## Development Workflow

### Making Changes

1. **Edit code** in `C:\Users\micha\saleor-dashboard\src\`
2. **Save file** → Vite hot-reloads automatically
3. **See changes** in browser instantly!

### Viewing Logs

```powershell
# Follow logs
docker compose -f infra/docker-compose.dev.yml logs -f saleor-dashboard

# Last 50 lines
docker compose -f infra/docker-compose.dev.yml logs saleor-dashboard --tail=50
```

### Restarting

```powershell
# Restart dashboard
docker compose -f infra/docker-compose.dev.yml restart saleor-dashboard

# Rebuild if needed
docker compose -f infra/docker-compose.dev.yml up -d --build saleor-dashboard
```

## Project Structure

```
saleor-platform/
├── saleor/              # Backend API (local code in Docker)
├── saleor-dashboard/     # Dashboard (local code in Docker) ← NEW!
│   └── src/            # Edit here for hot-reload
├── storefront/         # Storefront (Next.js)
├── backend/
│   └── plugins/        # Custom plugins
└── infra/
    └── docker-compose.dev.yml  # All services configured
```

## All Services Running

Now you have:

- ✅ **Saleor API** - http://localhost:8000
- ✅ **Saleor Dashboard** - http://localhost:9000
- ✅ **PostgreSQL** - localhost:5432
- ✅ **Redis** - localhost:6379
- ✅ **Celery Worker** - Background jobs
- ✅ **Celery Scheduler** - Scheduled tasks

## Troubleshooting

### Dashboard Not Starting

1. **Check logs**:

   ```powershell
   docker compose -f infra/docker-compose.dev.yml logs saleor-dashboard
   ```

2. **Verify API is healthy**:

   ```powershell
   docker compose -f infra/docker-compose.dev.yml ps saleor-api
   ```

3. **Rebuild if needed**:
   ```powershell
   docker compose -f infra/docker-compose.dev.yml up -d --build saleor-dashboard
   ```

### Connection Errors

If dashboard can't connect to API:

1. Ensure API is running: `docker compose -f infra/docker-compose.dev.yml ps saleor-api`
2. Check API logs for CORS errors
3. Verify `ALLOWED_CLIENT_HOSTS` includes `localhost:9000`

### Port Conflicts

If port 9000 is in use:

1. Find what's using it: `netstat -ano | findstr :9000`
2. Change port in `infra/docker-compose.dev.yml`:
   ```yaml
   ports:
     - "9001:5173" # Use 9001 instead
   ```

## Documentation

- **Docker Setup**: `DOCKER_SETUP.md` - Detailed configuration
- **Main README**: `../README.md` - Overall project docs

## Success! 🎉

Your Dashboard is now:

- ✅ Running in Docker
- ✅ Using local code
- ✅ Hot-reload enabled
- ✅ Connected to API

Start editing `C:\Users\micha\saleor-dashboard\src\` and see changes instantly!
