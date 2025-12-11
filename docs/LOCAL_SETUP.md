# Local Development Setup Guide

This guide provides detailed instructions for setting up and running the Saleor platform locally.

## Prerequisites

Before starting, ensure you have:

- **Docker** and **Docker Compose** installed ([Install Docker](https://docs.docker.com/get-docker/))
- **Node.js** 18+ installed ([Download Node.js](https://nodejs.org/))
- **pnpm**, **yarn**, or **npm** installed
- At least **4GB RAM** available for Docker
- Ports **8000**, **9000**, **3000**, **5432**, and **6379** available

## Step 1: Clone and Navigate

```bash
git clone <your-repo-url>
cd saleor-platform
```

## Step 2: Configure Environment Variables

1. Navigate to the infrastructure directory:

   ```bash
   cd infra
   ```

2. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and configure the following (minimum required):

   ```env
   SECRET_KEY=your-secret-key-here
   ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
   ALLOWED_CLIENT_HOSTS=localhost:3000,localhost:3001
   ```

   **Generate a secure SECRET_KEY:**

   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

   Or use the helper script:

   ```bash
   ./scripts/init-dev.sh
   ```

## Step 3: Start Saleor Core Services

1. Start all services:

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

2. Wait for services to be healthy (check status):

   ```bash
   docker compose -f docker-compose.dev.yml ps
   ```

   All services should show "healthy" status.

3. View logs to ensure everything started correctly:

   ```bash
   docker compose -f docker-compose.dev.yml logs -f
   ```

   Press `Ctrl+C` to exit log view.

## Step 4: Initialize Database

1. Run database migrations:

   ```bash
   docker compose -f docker-compose.dev.yml exec saleor-api python manage.py migrate
   ```

2. Create a superuser account:

   ```bash
   docker compose -f docker-compose.dev.yml exec saleor-api python manage.py createsuperuser
   ```

   Follow the prompts to create your admin account.

3. **(Optional)** Load demo data:

   ```bash
   docker compose -f docker-compose.dev.yml exec saleor-api python manage.py populatedb --createsuperuser
   ```

   This will:
   - Create sample products, categories, and collections
   - Set up a default channel
   - Create a superuser (if you haven't already)

## Step 5: Verify API is Running

1. Open your browser and navigate to:

   http://localhost:8000/graphql/

2. You should see the GraphQL Playground interface.

3. Try a simple query:

   ```graphql
   query {
     shop {
       name
       description
     }
   }
   ```

   Click the play button to execute. You should see a response.

## Step 6: Set Up Saleor Dashboard

### Option A: Run Dashboard via Docker

Add this to your `docker-compose.dev.yml` (or run separately):

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

Then:

```bash
docker compose -f docker-compose.dev.yml up -d saleor-dashboard
```

### Option B: Run Dashboard via Node.js

1. Clone the official dashboard:

   ```bash
   cd ..
   git clone https://github.com/saleor/saleor-dashboard.git
   cd saleor-dashboard
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create `.env` file:

   ```env
   API_URI=http://localhost:8000/graphql/
   ```

4. Start the development server:

   ```bash
   pnpm start
   ```

5. Access the dashboard at http://localhost:9000/

6. Log in with the superuser credentials you created earlier.

## Step 7: Set Up Storefront

1. Navigate to the storefront directory:

   ```bash
   cd ../storefront
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create environment file:

   ```bash
   cp .env.example .env.local
   ```

4. Edit `.env.local`:

   ```env
   NEXT_PUBLIC_SALEOR_API_URL=http://localhost:8000/graphql/
   NEXT_PUBLIC_DEFAULT_CHANNEL=default-channel
   ```

5. Generate GraphQL types:

   ```bash
   pnpm codegen
   ```

6. Start the development server:

   ```bash
   pnpm dev
   ```

7. Open http://localhost:3000/ in your browser.

## Daily Development Workflow

### Starting Everything

1. **Start Docker services:**

   ```bash
   cd infra
   docker compose -f docker-compose.dev.yml up -d
   ```

2. **Start Dashboard** (if running via Node.js):

   ```bash
   cd dashboard
   pnpm start
   ```

3. **Start Storefront:**

   ```bash
   cd storefront
   pnpm dev
   ```

### Making Changes

1. **Configure shop in Dashboard:**
   - Log in at http://localhost:9000/
   - Create channels, products, shipping zones, etc.
   - See [SALEOR_CONFIGURATION.md](./SALEOR_CONFIGURATION.md) for details

2. **Update Storefront:**
   - Modify components in `storefront/src/`
   - Add GraphQL queries/mutations
   - Run `pnpm codegen` after GraphQL changes
   - Changes hot-reload automatically

3. **Test API changes:**
   - Use GraphQL Playground at http://localhost:8000/graphql/
   - Test queries and mutations
   - Check API logs: `docker compose -f infra/docker-compose.dev.yml logs -f saleor-api`

### Stopping Everything

1. Stop Storefront: `Ctrl+C` in the storefront terminal
2. Stop Dashboard: `Ctrl+C` in the dashboard terminal (if Node.js)
3. Stop Docker services:

   ```bash
   cd infra
   docker compose -f docker-compose.dev.yml down
   ```

   To also remove volumes (⚠️ deletes data):

   ```bash
   docker compose -f docker-compose.dev.yml down -v
   ```

## Common Tasks

### Database Management

**Run migrations:**

```bash
docker compose -f infra/docker-compose.dev.yml exec saleor-api python manage.py migrate
```

**Create a new superuser:**

```bash
docker compose -f infra/docker-compose.dev.yml exec saleor-api python manage.py createsuperuser
```

**Access Django shell:**

```bash
docker compose -f infra/docker-compose.dev.yml exec saleor-api python manage.py shell
```

**Access PostgreSQL:**

```bash
docker compose -f infra/docker-compose.dev.yml exec postgres psql -U saleor -d saleor
```

### Viewing Logs

**All services:**

```bash
docker compose -f infra/docker-compose.dev.yml logs -f
```

**Specific service:**

```bash
docker compose -f infra/docker-compose.dev.yml logs -f saleor-api
docker compose -f infra/docker-compose.dev.yml logs -f saleor-worker
docker compose -f infra/docker-compose.dev.yml logs -f postgres
```

### Restarting Services

**Restart all:**

```bash
docker compose -f infra/docker-compose.dev.yml restart
```

**Restart specific service:**

```bash
docker compose -f infra/docker-compose.dev.yml restart saleor-api
```

### Clearing Data

**Reset database (⚠️ deletes all data):**

```bash
docker compose -f infra/docker-compose.dev.yml down -v
docker compose -f infra/docker-compose.dev.yml up -d
docker compose -f infra/docker-compose.dev.yml exec saleor-api python manage.py migrate
docker compose -f infra/docker-compose.dev.yml exec saleor-api python manage.py createsuperuser
```

## Troubleshooting

### Services Won't Start

**Check port availability:**

```bash
# Check if ports are in use
netstat -an | grep :8000
netstat -an | grep :5432
netstat -an | grep :6379
```

**Check Docker resources:**

```bash
docker system df
docker system prune  # Clean up if needed
```

**View service status:**

```bash
docker compose -f infra/docker-compose.dev.yml ps
```

### Database Connection Errors

**Check PostgreSQL is running:**

```bash
docker compose -f infra/docker-compose.dev.yml ps postgres
```

**Check database logs:**

```bash
docker compose -f infra/docker-compose.dev.yml logs postgres
```

**Verify DATABASE_URL in .env:**

```bash
cat infra/.env | grep DATABASE_URL
```

### API Not Responding

**Check API health:**

```bash
curl http://localhost:8000/graphql/
```

**Check API logs:**

```bash
docker compose -f infra/docker-compose.dev.yml logs saleor-api
```

**Restart API:**

```bash
docker compose -f infra/docker-compose.dev.yml restart saleor-api
```

### Storefront Can't Connect

**Verify environment variables:**

```bash
cat storefront/.env.local
```

**Check API is accessible:**

```bash
curl http://localhost:8000/graphql/
```

**Regenerate GraphQL types:**

```bash
cd storefront
pnpm codegen
```

### Worker/Scheduler Issues

**Check worker logs:**

```bash
docker compose -f infra/docker-compose.dev.yml logs saleor-worker
```

**Check scheduler logs:**

```bash
docker compose -f infra/docker-compose.dev.yml logs saleor-scheduler
```

**Restart workers:**

```bash
docker compose -f infra/docker-compose.dev.yml restart saleor-worker saleor-scheduler
```

## Next Steps

- Configure your shop: See [SALEOR_CONFIGURATION.md](./SALEOR_CONFIGURATION.md)
- Deploy to production: See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
- Customize the storefront: See `storefront/README.md`

## Additional Resources

- [Saleor Documentation](https://docs.saleor.io)
- [Docker Documentation](https://docs.docker.com)
- [Next.js Documentation](https://nextjs.org/docs)

