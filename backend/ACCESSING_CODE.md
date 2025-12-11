# Accessing Saleor Backend Code

## Current Setup

In this setup, **Saleor backend code is running inside Docker containers**, not in your local filesystem. The code is located at `/app` inside the container.

## Where is the Code?

### Inside Docker Container

The Saleor code is at `/app` inside the `saleor-api` container:

```powershell
# Access the container shell
docker compose -f infra/docker-compose.dev.yml exec saleor-api bash

# Once inside, you can explore:
cd /app
ls -la
cd saleor  # Main Saleor application code
```

### Main Code Locations in Container

- `/app/saleor/` - Main Saleor Django application
- `/app/saleor/core/` - Core functionality
- `/app/saleor/graphql/` - GraphQL API
- `/app/saleor/plugins/` - Built-in plugins
- `/app/manage.py` - Django management script

## Options for Development

### Option 1: Access Code Inside Container (Read-Only)

View code without modifying:

```powershell
# View a file
docker compose -f infra/docker-compose.dev.yml exec saleor-api cat /app/saleor/core/jwt_manager.py

# List directory
docker compose -f infra/docker-compose.dev.yml exec saleor-api ls -la /app/saleor/core/

# Access interactive shell
docker compose -f infra/docker-compose.dev.yml exec saleor-api bash
```

### Option 2: Clone Saleor Repository Locally (For Development)

If you want to modify Saleor core or develop locally:

```powershell
# Clone the official Saleor repository
git clone https://github.com/saleor/saleor.git
cd saleor

# Checkout a specific version (match your Docker image version)
git checkout 4.0.0  # or latest tag

# Now you have the full source code locally
```

**Then modify `docker-compose.dev.yml` to mount your local code:**

```yaml
saleor-api:
  image: ghcr.io/saleor/saleor:latest
  volumes:
    - ./../saleor:/app # Mount your local clone
    - saleor-media:/app/media
```

### Option 3: Create Custom Plugins/Extensions (Recommended)

**Never modify Saleor core directly!** Instead, create custom plugins:

1. **Create a plugin in `backend/plugins/`:**

```python
# backend/plugins/my_custom_plugin/__init__.py
from .plugin import MyCustomPlugin

# backend/plugins/my_custom_plugin/plugin.py
from saleor.plugins.base_plugin import BasePlugin

class MyCustomPlugin(BasePlugin):
    PLUGIN_ID = "my.custom.plugin"
    PLUGIN_NAME = "My Custom Plugin"

    def process_payment(self, payment_information, previous_value):
        # Your custom payment logic
        pass
```

2. **Mount your custom plugins:**

```yaml
saleor-api:
  volumes:
    - ./../backend/plugins:/app/plugins/custom
```

3. **Enable the plugin via Dashboard or environment variables**

## Viewing Current Code Structure

```powershell
# See main Saleor modules
docker compose -f infra/docker-compose.dev.yml exec saleor-api ls /app/saleor/

# See GraphQL schema
docker compose -f infra/docker-compose.dev.yml exec saleor-api cat /app/saleor/graphql/schema.graphql

# See installed plugins
docker compose -f infra/docker-compose.dev.yml exec saleor-api ls /app/saleor/plugins/
```

## Recommended Approach

For production-ready development:

1. **Keep using Docker images** for the core Saleor code (upgrade-friendly)
2. **Create custom plugins** in `backend/plugins/` for your customizations
3. **Mount only your custom code** into the container
4. **Never modify Saleor core** - it makes upgrades impossible

## Resources

- [Saleor Source Code](https://github.com/saleor/saleor)
- [Saleor Plugin Development](https://docs.saleor.io/docs/3.x/developer/plugins)
- [Saleor Architecture](https://docs.saleor.io/docs/3.x/developer/architecture)
