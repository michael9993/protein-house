# Saleor Dashboard Docker Setup

## Overview

The Dashboard is configured to run in Docker with your local code, enabling hot-reload for development.

## Configuration

### Location

- **Local Code**: `C:\Users\micha\saleor-dashboard\`
- **Docker Service**: `saleor-dashboard-dev`
- **Port**: `9000` (mapped to container port `5173`)

### Environment Variables

The dashboard uses these environment variables:

- `API_URL`: GraphQL API endpoint (internal Docker network)
- `VITE_API_URL`: GraphQL API endpoint (for browser access)
- `APPS_MARKETPLACE_API_URL`: Marketplace API URL
- `EXTENSIONS_API_URL`: Extensions API URL
- `APP_MOUNT_URI`: Dashboard mount path (default: `/dashboard/`)
- `STATIC_URL`: Static files URL (default: `/dashboard/`)

### How It Works

1. **Build**: Uses `node:22-alpine` image
2. **Setup**: Installs pnpm, dependencies, and generates GraphQL types
3. **Run**: Starts Vite dev server with hot-reload
4. **Mounts**: Your local code is mounted for instant changes

## Usage

### Start Dashboard

```powershell
cd infra
docker compose -f docker-compose.dev.yml up -d saleor-dashboard
```

### View Logs

```powershell
docker compose -f docker-compose.dev.yml logs -f saleor-dashboard
```

### Access Dashboard

- **URL**: http://localhost:9000
- **GraphQL Playground**: http://localhost:8000/graphql/

### Making Changes

1. Edit files in `C:\Users\micha\saleor-dashboard\src\`
2. Changes hot-reload automatically
3. No rebuild needed!

## Troubleshooting

### Dashboard Not Starting

1. **Check logs**:

   ```powershell
   docker compose -f docker-compose.dev.yml logs saleor-dashboard
   ```

2. **Verify API is running**:

   ```powershell
   docker compose -f docker-compose.dev.yml ps saleor-api
   ```

3. **Rebuild if needed**:
   ```powershell
   docker compose -f docker-compose.dev.yml up -d --build saleor-dashboard
   ```

### API Connection Issues

The dashboard connects to the API using:

- **Internal**: `http://saleor-api:8000/graphql/` (Docker network)
- **Browser**: `http://localhost:8000/graphql/` (from your browser)

If you see connection errors:

1. Ensure `saleor-api` is healthy
2. Check `ALLOWED_CLIENT_HOSTS` includes `localhost:9000`
3. Verify CORS settings in Saleor API

### Port Conflicts

If port 9000 is in use:

1. Change port in `docker-compose.dev.yml`:
   ```yaml
   ports:
     - "9001:5173" # Use 9001 instead
   ```

### Node Modules Issues

If dependencies are missing:

```powershell
docker compose -f docker-compose.dev.yml exec saleor-dashboard pnpm install
```

## Development Workflow

1. **Start all services**:

   ```powershell
   docker compose -f docker-compose.dev.yml up -d
   ```

2. **Edit code** in `C:\Users\micha\saleor-dashboard\src\`

3. **See changes** instantly (hot-reload)

4. **Check logs** if something breaks:
   ```powershell
   docker compose -f docker-compose.dev.yml logs -f saleor-dashboard
   ```

## Notes

- First startup takes longer (installs dependencies)
- GraphQL codegen runs on startup
- Node modules are preserved in a volume
- Source code is mounted for hot-reload
