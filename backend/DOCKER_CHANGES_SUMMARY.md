# Docker Configuration Updated for Local Code

## What Changed

The `docker-compose.dev.yml` has been updated to use your **local Saleor code** instead of the Docker image.

### Before
- Used `image: ghcr.io/saleor/saleor:latest`
- Code was inside the Docker image (read-only)
- Changes required rebuilding the image

### After
- Uses `build: context: ../saleor` (your local code)
- Code is mounted as a volume (hot-reload enabled)
- Changes reflect immediately
- Custom plugins mounted from `backend/plugins/`

## Key Changes

### 1. Saleor API Service

```yaml
saleor-api:
  build:
    context: ../saleor
    dockerfile: Dockerfile
  volumes:
    - ../saleor:/app              # Your local code
    - saleor-media:/app/media     # Media files
    - ../backend/plugins:/app/plugins/custom:ro  # Custom plugins
```

### 2. Worker & Scheduler

Both now use the same build context and mount your local code.

## How to Use

### First Time Setup

```powershell
cd infra
docker compose -f docker-compose.dev.yml build
docker compose -f docker-compose.dev.yml up -d
```

### Making Changes

1. **Edit Saleor core**: Modify files in `saleor/saleor/`
2. **Save**: Django auto-reloader will restart the server
3. **Changes are live**: No rebuild needed!

### Adding Custom Plugins

1. Create plugin in `backend/plugins/my_plugin/`
2. It's automatically available in Docker
3. Enable via Dashboard

## Benefits

✅ **Hot-reload**: Changes reflect immediately  
✅ **Full control**: Modify any Saleor code  
✅ **Plugin support**: Custom plugins automatically mounted  
✅ **Consistent environment**: Still using Docker for DB/Redis  
✅ **Easy debugging**: Can use both Docker and local Python  

## Switching Between Modes

### Use Docker (Current Setup)
```powershell
docker compose -f infra/docker-compose.dev.yml up -d
```

### Use Local Python
```powershell
# Stop Docker API
docker compose -f infra/docker-compose.dev.yml stop saleor-api

# Run locally
cd saleor
.\venv\Scripts\Activate.ps1
python manage.py runserver 0.0.0.0:8000
```

## Rebuilding

Only needed if you:
- Add new Python dependencies
- Change `pyproject.toml`
- Want a fresh build

```powershell
docker compose -f infra/docker-compose.dev.yml build --no-cache
docker compose -f infra/docker-compose.dev.yml up -d
```

## Troubleshooting

### Build Fails
- Check Python version (needs 3.12)
- Ensure `saleor/Dockerfile` exists
- Check Docker has enough resources

### Changes Not Reflecting
- Check logs: `docker compose -f infra/docker-compose.dev.yml logs saleor-api`
- Restart: `docker compose -f infra/docker-compose.dev.yml restart saleor-api`
- Verify volume mount: `docker compose -f infra/docker-compose.dev.yml exec saleor-api ls /app`

### Plugin Not Found
- Ensure plugin is in `backend/plugins/`
- Check plugin structure (needs `__init__.py`)
- Verify mount: `docker compose -f infra/docker-compose.dev.yml exec saleor-api ls /app/plugins/custom`

## Next Steps

1. **Rebuild and start**:
   ```powershell
   cd infra
   docker compose -f docker-compose.dev.yml build
   docker compose -f docker-compose.dev.yml up -d
   ```

2. **Start developing**:
   - Edit `saleor/saleor/` for core changes
   - Create `backend/plugins/` for custom plugins
   - Changes hot-reload automatically!

3. **View logs**:
   ```powershell
   docker compose -f infra/docker-compose.dev.yml logs -f saleor-api
   ```

## Documentation

- **Docker with Local Code**: `backend/DOCKER_WITH_LOCAL_CODE.md`
- **Local Development**: `backend/LOCAL_DEV_SETUP.md`
- **Development Approaches**: `backend/DEVELOPMENT_APPROACHES.md`

