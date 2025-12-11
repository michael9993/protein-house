# Local Development Setup Complete! 🎉

You now have **both** Docker and local development capabilities:

## What's Set Up

### ✅ Local Saleor Development
- Saleor repository cloned to `saleor/`
- Python virtual environment created
- All dependencies installed
- Ready to modify Saleor core code

### ✅ Docker Services (Shared)
- PostgreSQL running in Docker
- Redis running in Docker
- Both accessible from local Saleor

### ✅ Configuration
- `.env.local` template created (you'll need to create the actual file)
- Helper script: `run-local-dev.ps1`
- Documentation: `LOCAL_DEV_SETUP.md`

## Quick Start

### 1. Create Environment File

Create `saleor/.env.local` with this content:

```env
# Database - Connect to Docker PostgreSQL
DATABASE_URL=postgres://saleor:saleor@localhost:5432/saleor

# Redis - Connect to Docker Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
CACHE_URL=redis://localhost:6379/3

# Core Settings
SECRET_KEY=ead)7k@m3pbtp0k4h+vp()%xy)(my7xf3dztzt0z$8qfsuyj#3
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
ALLOWED_CLIENT_HOSTS=localhost:3000,localhost:3001

# Media Files
MEDIA_ROOT=media
MEDIA_URL=/media/

# Email (console for development)
EMAIL_URL=consolemail://

# Timezone
TIME_ZONE=UTC

# Enable Playground in Development
GRAPHQL_PLAYGROUND_ENABLED=True
```

### 2. Ensure Docker Services Are Running

```powershell
cd infra
docker compose -f docker-compose.dev.yml up -d postgres redis
```

### 3. Run Local Development Server

```powershell
cd saleor
.\venv\Scripts\Activate.ps1
.\run-local-dev.ps1
```

Or manually:

```powershell
cd saleor
.\venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## You Can Now:

### ✅ Modify Saleor Core
- Edit files in `saleor/saleor/`
- Changes hot-reload automatically
- Full IDE support (debugging, IntelliSense)

### ✅ Create Custom Plugins
- Create plugins in `backend/plugins/`
- Use plugin strategy for most customizations
- Keep upgrades easy

### ✅ Switch Between Modes
- **Local**: For development and core modifications
- **Docker**: For production-like testing

## Project Structure

```
saleor-platform/
├── saleor/              # Local Saleor clone (modify core here)
│   ├── saleor/         # Main application code
│   ├── venv/           # Python virtual environment
│   ├── .env.local      # Local development config (create this)
│   └── run-local-dev.ps1  # Helper script
├── backend/
│   ├── plugins/        # Your custom plugins (create this)
│   └── LOCAL_DEV_SETUP.md  # Detailed guide
└── infra/              # Docker setup
    └── docker-compose.dev.yml
```

## Next Steps

1. **Create `.env.local`** in `saleor/` directory (see above)
2. **Start Docker services**: `docker compose -f infra/docker-compose.dev.yml up -d postgres redis`
3. **Run local server**: `cd saleor && .\run-local-dev.ps1`
4. **Start developing!**

## Documentation

- **Local Development**: `backend/LOCAL_DEV_SETUP.md`
- **Development Approaches**: `backend/DEVELOPMENT_APPROACHES.md`
- **Accessing Code**: `backend/ACCESSING_CODE.md`

## Tips

- Use **local development** when modifying core
- Use **plugins** for most customizations (upgrade-friendly)
- Use **Docker API** for production-like testing
- Both share the same database (consistent data)

Happy coding! 🚀

