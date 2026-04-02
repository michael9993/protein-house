# Troubleshooting Docker with Local Code

## Common Issues and Solutions

### Container Stuck in "Waiting" or "health: starting"

**Symptoms:**

- Container shows `STATUS: Up X seconds (health: starting)`
- Healthcheck keeps failing
- Server might actually be running but healthcheck isn't passing

**Solutions:**

1. **Check if server is actually running:**

   ```powershell
   # Test from outside
   curl http://localhost:8000/graphql/

   # Or in browser
   # Open http://localhost:8000/graphql/
   ```

2. **Check logs:**

   ```powershell
   docker compose -f infra/docker-compose.dev.yml logs aura-api --tail=50
   ```

3. **Verify server started:**
   Look for these lines in logs:

   ```
   Starting development server at http://0.0.0.0:8000/
   ```

4. **Run migrations if needed:**

   ```powershell
   docker compose -f infra/docker-compose.dev.yml exec aura-api python manage.py migrate
   ```

5. **Restart the service:**
   ```powershell
   docker compose -f infra/docker-compose.dev.yml restart aura-api
   ```

### Healthcheck Failing

**Issue:** Healthcheck uses `curl` which isn't in slim Python images.

**Solution:** Updated to use Python socket check. If still failing:

1. **Increase start_period** in docker-compose.dev.yml:

   ```yaml
   healthcheck:
     start_period: 120s # Give more time for server to start
   ```

2. **Disable healthcheck temporarily** (for debugging):
   ```yaml
   # Comment out healthcheck section
   ```

### Server Not Starting

**Check logs for errors:**

```powershell
docker compose -f infra/docker-compose.dev.yml logs aura-api | Select-String -Pattern "error|Error|exception"
```

**Common causes:**

- Missing migrations
- Database connection issues
- Missing environment variables
- Port conflicts

### Volume Mount Issues

**Issue:** Code changes not reflecting

**Solutions:**

1. **Verify volume mount:**

   ```powershell
   docker compose -f infra/docker-compose.dev.yml exec aura-api ls /app
   ```

2. **Check file permissions:**

   ```powershell
   docker compose -f infra/docker-compose.dev.yml exec aura-api ls -la /app/manage.py
   ```

3. **Restart to remount:**
   ```powershell
   docker compose -f infra/docker-compose.dev.yml restart aura-api
   ```

### Build Failures

**Issue:** `docker compose build` fails

**Solutions:**

1. **Check Dockerfile exists:**

   ```powershell
   Test-Path saleor/Dockerfile
   ```

2. **Check build context:**

   ```yaml
   build:
     context: ../saleor # Should point to saleor directory
   ```

3. **Clean build:**
   ```powershell
   docker compose -f infra/docker-compose.dev.yml build --no-cache
   ```

### Dependencies Not Found

**Issue:** Import errors in container

**Solutions:**

1. **Verify packages installed:**

   ```powershell
   docker compose -f infra/docker-compose.dev.yml exec aura-api python -c "import django; print(django.get_version())"
   ```

2. **Rebuild image:**
   ```powershell
   docker compose -f infra/docker-compose.dev.yml build --no-cache aura-api
   ```

### Port Already in Use

**Issue:** Port 8000 already in use

**Solutions:**

1. **Find what's using the port:**

   ```powershell
   netstat -ano | findstr :8000
   ```

2. **Stop conflicting service:**

   ```powershell
   # If local Python is running
   # Stop it first

   # Or change Docker port
   ports:
     - "8001:8000"  # Use 8001 instead
   ```

## Quick Diagnostic Commands

```powershell
# Check all services
docker compose -f infra/docker-compose.dev.yml ps

# View API logs
docker compose -f infra/docker-compose.dev.yml logs aura-api --tail=50

# Test API from outside
curl http://localhost:8000/graphql/

# Test API from inside container
docker compose -f infra/docker-compose.dev.yml exec aura-api python -c "import socket; s = socket.socket(); s.connect(('127.0.0.1', 8000)); print('Port open')"

# Check database connection
docker compose -f infra/docker-compose.dev.yml exec aura-api python manage.py check --database default

# Run migrations
docker compose -f infra/docker-compose.dev.yml exec aura-api python manage.py migrate

# Restart everything
docker compose -f infra/docker-compose.dev.yml restart
```

## Still Not Working?

1. **Check Docker Desktop is running**
2. **Check Docker has enough resources** (CPU, Memory)
3. **Try rebuilding from scratch:**

   ```powershell
   docker compose -f infra/docker-compose.dev.yml down -v
   docker compose -f infra/docker-compose.dev.yml build --no-cache
   docker compose -f infra/docker-compose.dev.yml up -d
   ```

4. **Check Docker logs:**
   ```powershell
   docker logs aura-api-dev
   ```
