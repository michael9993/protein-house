# Environment Variables Reference

Complete reference for all environment variables used in the Saleor Platform.

## Configuration File Location

All environment variables are configured in: `infra/.env`

---

## Service Ports

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_PORT` | `5432` | PostgreSQL database port |
| `REDIS_PORT` | `6379` | Redis cache port |
| `SALEOR_API_PORT` | `8000` | Saleor API port |
| `DASHBOARD_PORT` | `9000` | Dashboard port |
| `STOREFRONT_PORT` | `3000` | Storefront port |
| `STRIPE_APP_PORT` | `3002` | Stripe app port |
| `SMTP_APP_PORT` | `3001` | SMTP app port |
| `INVOICE_APP_PORT` | `3003` | Invoice app port |

---

## Database Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `saleor` | Database username |
| `POSTGRES_PASSWORD` | `saleor` | Database password |
| `POSTGRES_DB` | `saleor` | Database name |

---

## Saleor API Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | (required) | Django secret key - **Generate a random string!** |
| `DEBUG` | `True` | Django debug mode |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated allowed hosts |
| `ALLOWED_CLIENT_HOSTS` | `localhost:3000,localhost:9000` | Allowed client origins |
| `ALLOWED_GRAPHQL_ORIGINS` | `*` | CORS origins for GraphQL |
| `PUBLIC_URL` | (optional) | Public URL for JWT issuer |
| `TIME_ZONE` | `UTC` | Server timezone |

### Email Configuration

| Variable | Example | Description |
|----------|---------|-------------|
| `EMAIL_URL` | `smtp://user:pass@smtp.gmail.com:587/?tls=True` | SMTP connection string |
| `DEFAULT_FROM_EMAIL` | `noreply@yourstore.com` | Default sender email |

### Redis/Celery

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection URL |
| `CELERY_BROKER_URL` | `redis://redis:6379/1` | Celery broker URL |
| `CELERY_RESULT_BACKEND` | `redis://redis:6379/2` | Celery results backend |

---

## Dashboard Configuration

| Variable | Description |
|----------|-------------|
| `API_URL` | Saleor API GraphQL endpoint |
| `VITE_API_URL` | Same as API_URL (for Vite) |
| `APP_MOUNT_URI` | Dashboard mount path (default: `/dashboard/`) |
| `STATIC_URL` | Static files path |

---

## Storefront Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SALEOR_API_URL` | Saleor API URL (public) | `https://api.yourstore.com/graphql/` |
| `SALEOR_API_URL` | Saleor API URL (server) | `http://saleor-api:8000/graphql/` |
| `NEXT_PUBLIC_STOREFRONT_URL` | Storefront public URL | `https://yourstore.com` |
| `NEXT_PUBLIC_DEFAULT_CHANNEL` | Default channel slug | `default-channel` |
| `SALEOR_APP_TOKEN` | App authentication token | (generated) |

### Invoice App Integration

| Variable | Description |
|----------|-------------|
| `INVOICES_APP_INTERNAL_URL` | Internal Docker URL for invoices app |
| `INVOICES_APP_URL` | Public URL for invoice downloads |

---

## Stripe App Configuration

| Variable | Description |
|----------|-------------|
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_test_...) |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_APP_URL` | Stripe app public URL |
| `APP_SECRET_KEY` | App-specific secret key |

---

## Tunnel URLs (Development)

When using Cloudflare Tunnel or ngrok for development:

| Variable | Description |
|----------|-------------|
| `SALEOR_API_TUNNEL_URL` | API tunnel URL |
| `DASHBOARD_TUNNEL_URL` | Dashboard tunnel URL |
| `STOREFRONT_TUNNEL_URL` | Storefront tunnel URL |
| `STRIPE_APP_TUNNEL_URL` | Stripe app tunnel URL |
| `SMTP_APP_TUNNEL_URL` | SMTP app tunnel URL |
| `INVOICE_APP_TUNNEL_URL` | Invoice app tunnel URL |

---

## Example Configuration

```env
# infra/.env

# ============================================================================
# SERVICE PORTS
# ============================================================================
POSTGRES_PORT=5432
REDIS_PORT=6379
SALEOR_API_PORT=8000
DASHBOARD_PORT=9000
STOREFRONT_PORT=3000
STRIPE_APP_PORT=3002
SMTP_APP_PORT=3001
INVOICE_APP_PORT=3003

# ============================================================================
# DATABASE
# ============================================================================
POSTGRES_USER=saleor
POSTGRES_PASSWORD=saleor
POSTGRES_DB=saleor

# ============================================================================
# SALEOR API
# ============================================================================
SECRET_KEY=your-secret-key-here-generate-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,saleor-api
ALLOWED_CLIENT_HOSTS=localhost:3000,localhost:9000
ALLOWED_GRAPHQL_ORIGINS=*
TIME_ZONE=UTC

# Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# Email (Gmail example)
EMAIL_URL=smtp://your-email@gmail.com:app-password@smtp.gmail.com:587/?tls=True
DEFAULT_FROM_EMAIL=your-email@gmail.com

# ============================================================================
# DASHBOARD
# ============================================================================
API_URL=http://localhost:8000/graphql/
VITE_API_URL=http://localhost:8000/graphql/
APP_MOUNT_URI=/dashboard/
STATIC_URL=/dashboard/

# ============================================================================
# STOREFRONT
# ============================================================================
NEXT_PUBLIC_SALEOR_API_URL=http://localhost:8000/graphql/
SALEOR_API_URL=http://saleor-api:8000/graphql/
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_CHANNEL=default-channel

# ============================================================================
# STRIPE APP
# ============================================================================
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_APP_URL=http://localhost:3002
APP_SECRET_KEY=your-app-secret-key

# ============================================================================
# INVOICE APP
# ============================================================================
INVOICE_APP_URL=http://localhost:3003
```

---

## Generating Secret Keys

```bash
# Generate Django SECRET_KEY
openssl rand -hex 32

# Generate APP_SECRET_KEY
openssl rand -hex 32

# Or using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Security Notes

⚠️ **Production Security**:

1. **Never commit `.env` files** to version control
2. **Generate unique secret keys** for each environment
3. **Use HTTPS** for all public URLs in production
4. **Restrict `ALLOWED_HOSTS`** to your domains only
5. **Set `DEBUG=False`** in production
6. **Use environment-specific credentials** (don't share between dev/staging/prod)

---

## Docker Network

Services communicate via Docker internal network:

| Service | Internal Hostname | Internal Port |
|---------|-------------------|---------------|
| PostgreSQL | `db` | 5432 |
| Redis | `redis` | 6379 |
| Saleor API | `saleor-api` | 8000 |
| Dashboard | `saleor-dashboard` | 80 |
| Storefront | `saleor-storefront` | 3000 |
| Stripe App | `saleor-stripe-app` | 3000 |
| SMTP App | `saleor-smtp-app` | 3000 |
| Invoice App | `saleor-invoice-app` | 3000 |

---

*Last updated: December 2024*

