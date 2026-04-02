# Local Development Setup Guide

This guide shows you how to run Saleor locally for development while using Docker for PostgreSQL and Redis.

## Architecture

- **Saleor Core**: Running locally (Python/Django) - you can modify code
- **PostgreSQL**: Running in Docker (shared with Docker setup)
- **Redis**: Running in Docker (shared with Docker setup)
- **Custom Plugins**: In `saleor/plugins/custom/` - mounted into local Saleor

## Prerequisites

1. ✅ Saleor repository cloned (already done)
2. ✅ Python virtual environment created (already done)
3. ✅ Dependencies installed (already done)
4. ✅ Docker PostgreSQL and Redis running

## Quick Start

### 1. Ensure Docker Services Are Running

```powershell
cd infra
docker compose -f docker-compose.dev.yml up -d postgres redis
```

### 2. Activate Virtual Environment

```powershell
cd saleor
.\venv\Scripts\Activate.ps1
```

### 3. Run Local Development Server

```powershell
# Option A: Use the helper script
.\run-local-dev.ps1

# Option B: Manual
python manage.py runserver 0.0.0.0:8000
```

The API will be available at: **http://localhost:8000/graphql/**

## Environment Configuration

The `.env.local` file is configured to connect to Docker services:

- **Database**: `postgres://saleor:saleor@localhost:5432/saleor`
- **Redis**: `redis://localhost:6379/0`

## Development Workflow

### Making Changes to Saleor Core

1. Edit files in `saleor/saleor/`
2. Save the file
3. Django's auto-reloader will restart the server
4. Changes are immediately available

### Creating Custom Plugins

1. Create plugin in `saleor/plugins/custom/my_plugin/`:

```python
# saleor/plugins/custom/my_plugin/__init__.py
from .plugin import MyCustomPlugin

# saleor/plugins/custom/my_plugin/plugin.py
from saleor.plugins.base_plugin import BasePlugin

class MyCustomPlugin(BasePlugin):
    PLUGIN_ID = "my.custom.plugin"
    PLUGIN_NAME = "My Custom Plugin"
    
    def process_payment(self, payment_information, previous_value):
        # Your custom logic
        return previous_value
```

2. Add to Saleor's plugin directory or configure plugin path in settings

3. Enable via Dashboard or environment variables

### Running Migrations

```powershell
python manage.py migrate
```

### Creating Superuser

```powershell
python manage.py createsuperuser
```

### Loading Demo Data

```powershell
python manage.py populatedb --createsuperuser
```

## Switching Between Docker and Local

### Use Docker API (Production-like)

```powershell
cd infra
docker compose -f docker-compose.dev.yml up -d aura-api
```

### Use Local API (For Development)

```powershell
cd saleor
.\run-local-dev.ps1
```

**Note**: Both can't run on port 8000 at the same time. Stop Docker API first:

```powershell
docker compose -f infra/docker-compose.dev.yml stop aura-api
```

## Benefits of This Setup

✅ **Full code access**: Modify Saleor core as needed
✅ **Hot reload**: Changes reflect immediately
✅ **IDE support**: Full debugging, breakpoints, IntelliSense
✅ **Shared database**: Same data for Docker and local
✅ **Plugin development**: Can still use plugin strategy
✅ **Easy switching**: Use Docker for production-like testing

## Troubleshooting

### Port Already in Use

If port 8000 is in use:

```powershell
# Stop Docker API
docker compose -f infra/docker-compose.dev.yml stop aura-api

# Or use different port
python manage.py runserver 0.0.0.0:8001
```

### Database Connection Error

Ensure PostgreSQL is running:

```powershell
docker compose -f infra/docker-compose.dev.yml ps postgres
```

### Import Errors

Make sure virtual environment is activated:

```powershell
.\venv\Scripts\Activate.ps1
```

## Next Steps

- Start developing your customizations
- Create plugins in `saleor/plugins/custom/`
- Modify Saleor core in `saleor/saleor/` as needed
- Use the same database for consistency

