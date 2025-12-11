# Using Docker with Local Saleor Code

The Docker setup has been configured to use your local Saleor code instead of the Docker image. This gives you the best of both worlds:

- ✅ **Docker environment** (consistent, production-like)
- ✅ **Your local code** (modifications, hot-reload)
- ✅ **Custom plugins** (mounted from `backend/plugins/`)

## How It Works

The `docker-compose.dev.yml` now:

1. **Builds from local code**: Uses `../saleor` as the build context
2. **Mounts local code**: Your changes are immediately available in containers
3. **Mounts custom plugins**: Plugins from `backend/plugins/` are available
4. **Hot-reload enabled**: Django's auto-reloader works in Docker too

## Starting Services

```powershell
cd infra
docker compose -f docker-compose.dev.yml up -d --build
```

The `--build` flag rebuilds the image with your local code.

## Making Changes

### Modify Saleor Core

1. Edit files in `saleor/saleor/`
2. Save the file
3. Django auto-reloader restarts the server
4. Changes are live immediately

### Add Custom Plugins

1. Create plugin in `backend/plugins/my_plugin/`
2. It's automatically mounted at `/app/plugins/custom/`
3. Enable via Dashboard or environment variables

## Rebuilding After Major Changes

If you add new dependencies or change `pyproject.toml`:

```powershell
cd infra
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d
```

## Development Workflow

### Option 1: Docker with Local Code (Current Setup)

```powershell
# Start all services
cd infra
docker compose -f docker-compose.dev.yml up -d

# Make changes to saleor/saleor/
# Changes hot-reload automatically

# View logs
docker compose -f docker-compose.dev.yml logs -f saleor-api
```

**Benefits:**
- Production-like environment
- All services in Docker
- Easy to share with team
- Consistent across machines

### Option 2: Local Python + Docker Services

```powershell
# Start only DB/Redis
cd infra
docker compose -f docker-compose.dev.yml up -d postgres redis

# Run Saleor locally
cd saleor
.\venv\Scripts\Activate.ps1
python manage.py runserver 0.0.0.0:8000
```

**Benefits:**
- Faster iteration (no Docker overhead)
- Better IDE integration
- Easier debugging

## Volume Mounts

The Docker setup mounts:

- `../saleor:/app` - Your local Saleor code
- `../backend/plugins:/app/plugins/custom:ro` - Custom plugins (read-only)
- `saleor-media:/app/media` - Media files (persistent)

## Custom Plugins Location

Create plugins in `backend/plugins/`:

```
backend/
└── plugins/
    └── my_custom_plugin/
        ├── __init__.py
        └── plugin.py
```

They'll be available in Docker at `/app/plugins/custom/my_custom_plugin/`

## Troubleshooting

### Changes Not Reflecting

1. Check if auto-reloader is working:
   ```powershell
   docker compose -f infra/docker-compose.dev.yml logs saleor-api | Select-String "Watching for file changes"
   ```

2. Restart the service:
   ```powershell
   docker compose -f infra/docker-compose.dev.yml restart saleor-api
   ```

### Build Errors

If build fails, check:
- Python version matches (3.12)
- All dependencies in `pyproject.toml`
- Docker has enough resources

### Plugin Not Found

Ensure plugin is in `backend/plugins/` and properly structured:
- Must have `__init__.py`
- Must inherit from `BasePlugin`
- Must have `PLUGIN_ID`

## Switching Back to Docker Image

If you want to use the official image instead:

```yaml
saleor-api:
  image: ghcr.io/saleor/saleor:latest
  # Remove build: and volumes: sections
```

## Best Practices

1. **Use Docker for**: Production-like testing, team consistency
2. **Use Local for**: Fast iteration, debugging, IDE features
3. **Use Plugins for**: Most customizations (upgrade-friendly)
4. **Modify Core for**: Deep changes, contributions, debugging

## Next Steps

- Start developing: `docker compose -f infra/docker-compose.dev.yml up -d`
- Create plugins: `backend/plugins/my_plugin/`
- Modify core: `saleor/saleor/`
- View logs: `docker compose -f infra/docker-compose.dev.yml logs -f`

