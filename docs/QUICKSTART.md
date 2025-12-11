\# Quick Start Guide

Follow these steps to get your Saleor platform running locally.

## Step 1: Create Environment File

1. Navigate to the `infra` folder
2. Create a new file called `.env` (not `.env.example`)
3. Copy this content into it:

```env
# Core Settings
SECRET_KEY=changeme-generate-secure-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
ALLOWED_CLIENT_HOSTS=localhost:3000,localhost:3001

# Database (defaults work for local dev)
DATABASE_URL=postgres://saleor:saleor@postgres:5432/saleor

# Redis (defaults work for local dev)
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# Media Files
MEDIA_ROOT=/app/media
MEDIA_URL=/media/

# Email (console for development)
EMAIL_URL=consolemail://

# Timezone
TIME_ZONE=UTC

# Enable Playground in Development
GRAPHQL_PLAYGROUND_ENABLED=True
```

4. **Generate a SECRET_KEY**:
   - Open PowerShell
   - Run: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
   - Copy the output and replace `changeme-generate-secure-key-here` in the `.env` file

## Step 2: Start Docker Services

Open PowerShell or Command Prompt in the `infra` folder and run:

```powershell
docker compose -f docker-compose.dev.yml up -d
```

This will start:

- PostgreSQL database
- Redis cache
- Saleor API
- Celery worker
- Celery scheduler

Wait about 30 seconds for services to start.

## Step 3: Check Services Are Running

```powershell
docker compose -f docker-compose.dev.yml ps
```

All services should show "Up" and "healthy" status.

## Step 4: Initialize Database

```powershell
docker compose -f docker-compose.dev.yml exec saleor-api python manage.py migrate
```

## Step 5: Create Admin User

```powershell
docker compose -f docker-compose.dev.yml exec saleor-api python manage.py createsuperuser
```

Follow the prompts to create your admin account.

## Step 6: (Optional) Load Demo Data

```powershell
docker compose -f docker-compose.dev.yml exec saleor-api python manage.py populatedb --createsuperuser
```

This creates sample products, categories, and a default channel.

## Step 7: Verify API is Working

Open your browser and go to:

- **GraphQL Playground**: http://localhost:8000/graphql/

Try this query:

```graphql
query {
  shop {
    name
    description
  }
}
```

## Step 8: Set Up Storefront

1. Open a new terminal/PowerShell window
2. Navigate to the `storefront` folder
3. Create `.env.local` file with:

   ```env
   NEXT_PUBLIC_SALEOR_API_URL=http://localhost:8000/graphql/
   NEXT_PUBLIC_DEFAULT_CHANNEL=default-channel
   ```

4. Install dependencies:

   ```powershell
   npm install
   # or
   pnpm install
   ```

5. Generate GraphQL types:

   ```powershell
   npm run codegen
   # or
   pnpm codegen
   ```

6. Start the storefront:

   ```powershell
   npm run dev
   # or
   pnpm dev
   ```

7. Open http://localhost:3000 in your browser

## Step 9: Set Up Dashboard (Optional)

### Option A: Use Docker (Easiest)

Add this to your `docker-compose.dev.yml` in the `services` section:

```yaml
saleor-dashboard:
  image: saleor/saleor-dashboard:latest
  ports:
    - "9000:80"
  environment:
    API_URI: http://localhost:8000/graphql/
  depends_on:
    - saleor-api
```

Then run:

```powershell
docker compose -f docker-compose.dev.yml up -d saleor-dashboard
```

### Option B: Run Locally

1. Clone the dashboard:

   ```powershell
   git clone https://github.com/saleor/saleor-dashboard.git
   cd saleor-dashboard
   ```

2. Create `.env`:

   ```env
   API_URI=http://localhost:8000/graphql/
   ```

3. Install and run:

   ```powershell
   pnpm install
   pnpm start
   ```

4. Open http://localhost:9000 and log in with your superuser account

## You're Done! 🎉

Your services are now running at:

- **API**: http://localhost:8000/graphql/
- **Storefront**: http://localhost:3000
- **Dashboard**: http://localhost:9000

## Common Commands

**View logs:**

```powershell
docker compose -f docker-compose.dev.yml logs -f
```

**Stop services:**

```powershell
docker compose -f docker-compose.dev.yml down
```

**Restart a service:**

```powershell
docker compose -f docker-compose.dev.yml restart saleor-api
```

**Access database:**

```powershell
docker compose -f docker-compose.dev.yml exec postgres psql -U saleor -d saleor
```

## Next Steps

1. **Configure your shop**: See `docs/SALEOR_CONFIGURATION.md`

   - Create channels
   - Add products
   - Set up shipping
   - Configure payments

2. **Customize storefront**: Edit files in `storefront/src/`

3. **Read the docs**:
   - `docs/LOCAL_SETUP.md` - Detailed local setup
   - `docs/PRODUCTION_DEPLOYMENT.md` - Production deployment
   - `storefront/README.md` - Storefront development

## Troubleshooting

**Docker not starting?**

- Make sure Docker Desktop is running
- Check if ports 8000, 5432, 6379 are available

**Can't connect to API?**

- Wait a bit longer for services to start
- Check logs: `docker compose -f docker-compose.dev.yml logs saleor-api`

**Storefront can't connect?**

- Verify `NEXT_PUBLIC_SALEOR_API_URL` in `.env.local`
- Make sure API is running: http://localhost:8000/graphql/

**Need help?**

- Check `docs/LOCAL_SETUP.md` for detailed troubleshooting
- Review Saleor docs: https://docs.saleor.io
