# Aura Platform — DigitalOcean Deployment Guide

Deploy the full Aura Platform to a single DigitalOcean Droplet using Docker Compose + Nginx.

---

## Architecture

```
Internet → Cloudflare (DNS + optional CDN)
              │
              ▼
     DigitalOcean Droplet (Ubuntu 24.04)
     ┌──────────────────────────────────────┐
     │  Nginx (host-level, ports 80/443)    │
     │  ├── shop.yourdomain.com  → :3000    │
     │  ├── api.yourdomain.com   → :8000    │
     │  ├── dashboard.yourdomain.com → :9002│
     │  └── apps.yourdomain.com  → :3001-7  │
     │                                      │
     │  Docker Compose (13 containers)      │
     │  ├── aura-api           :8000        │
     │  ├── aura-worker                     │
     │  ├── aura-scheduler                  │
     │  ├── storefront         :3000        │
     │  ├── dashboard          :9002        │
     │  ├── stripe-app         :3002        │
     │  ├── smtp-app           :3001        │
     │  ├── invoices-app       :3003        │
     │  ├── storefront-control :3004        │
     │  ├── newsletter-app     :3005        │
     │  ├── analytics-app      :3006        │
     │  ├── bulk-manager-app   :3007        │
     │  ├── postgres           :5432        │
     │  └── redis              :6379        │
     └──────────────────────────────────────┘
```

All ports are bound to `127.0.0.1` (localhost only). Nginx is the only entry point.

---

## Prerequisites

- **DigitalOcean account** with a Droplet
- **Domain** with DNS pointing to the Droplet's IP
- **SSH access** to the Droplet

---

## Step 1: Create the Droplet

On DigitalOcean:

| Setting | Value |
|---------|-------|
| **Image** | Ubuntu 24.04 LTS |
| **Size** | 8 GB RAM / 4 vCPUs ($48/mo) minimum; 16 GB recommended |
| **Region** | Closest to users (e.g., Frankfurt for Israel) |
| **Authentication** | SSH key (never password) |
| **Hostname** | `aura-production` |

> **Why 8GB minimum?** The API (4GB) + Worker (2GB) + Storefront (2GB) alone need ~8GB. With all 13 containers, 16GB is more comfortable.

---

## Step 2: Server Setup

SSH into the Droplet:

```bash
ssh root@YOUR_DROPLET_IP
```

### Install Docker + Nginx

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin (included with Docker now)
docker compose version  # verify

# Install Nginx + Certbot
apt install -y nginx certbot python3-certbot-nginx

# Enable firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Create web directories
mkdir -p /var/www/certbot
mkdir -p /var/www/saleor/media
mkdir -p /var/www/saleor/static
```

### Clone the Repository

```bash
mkdir -p /opt/aura-platform
cd /opt/aura-platform
git clone YOUR_REPO_URL .
```

---

## Step 3: Configure Environment

```bash
cd /opt/aura-platform/infra
cp .env.production.example .env
nano .env  # Edit with your real values
```

Key variables to set:

```env
# CRITICAL — generate unique values
SECRET_KEY=your-50-char-random-string
POSTGRES_PASSWORD=strong-random-password
REDIS_PASSWORD=strong-random-password
WEBHOOK_SECRET_KEY=another-random-string

# Domains
ALLOWED_HOSTS=api.yourdomain.com
ALLOWED_CLIENT_HOSTS=shop.yourdomain.com,dashboard.yourdomain.com
NEXT_PUBLIC_SALEOR_API_URL=https://api.yourdomain.com/graphql/
NEXT_PUBLIC_STOREFRONT_URL=https://shop.yourdomain.com
NEXT_PUBLIC_DEFAULT_CHANNEL=default-channel

# Stripe (use test keys first, switch to live after testing)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (e.g., SendGrid)
EMAIL_URL=smtp://apikey:SG.xxxxx@smtp.sendgrid.net:587/?tls=True

# App URLs (how Dashboard reaches each app)
STRIPE_APP_URL=https://apps.yourdomain.com/stripe
SMTP_APP_URL=https://apps.yourdomain.com/smtp
INVOICES_APP_URL=https://apps.yourdomain.com/invoices
STOREFRONT_CONTROL_APP_URL=https://apps.yourdomain.com/storefront-control
NEWSLETTER_APP_URL=https://apps.yourdomain.com/newsletter
ANALYTICS_APP_URL=https://apps.yourdomain.com/analytics
BULK_MANAGER_APP_URL=https://apps.yourdomain.com/bulk-manager

# App secret keys (generate unique for each)
STRIPE_APP_SECRET_KEY=random-string-1
SMTP_APP_SECRET_KEY=random-string-2
INVOICES_APP_SECRET_KEY=random-string-3
STOREFRONT_CONTROL_APP_SECRET_KEY=random-string-4
NEWSLETTER_APP_SECRET_KEY=random-string-5
ANALYTICS_APP_SECRET_KEY=random-string-6
BULK_MANAGER_APP_SECRET_KEY=random-string-7
```

Generate random secrets:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

---

## Step 4: DNS Setup

Point these DNS records to your Droplet IP:

| Type | Name | Value |
|------|------|-------|
| A | `shop.yourdomain.com` | `YOUR_DROPLET_IP` |
| A | `api.yourdomain.com` | `YOUR_DROPLET_IP` |
| A | `dashboard.yourdomain.com` | `YOUR_DROPLET_IP` |
| A | `apps.yourdomain.com` | `YOUR_DROPLET_IP` |

If using Cloudflare, set proxy status to "DNS only" (grey cloud) initially until SSL is set up on the server.

---

## Step 5: SSL Certificates

Get SSL certs before starting Docker (Nginx needs them):

```bash
# Temporary Nginx config for cert challenge
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80;
    server_name shop.yourdomain.com api.yourdomain.com dashboard.yourdomain.com apps.yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'OK';
    }
}
EOF

systemctl reload nginx

# Get certificates for all domains
certbot certonly --webroot -w /var/www/certbot \
  -d shop.yourdomain.com \
  -d api.yourdomain.com \
  -d dashboard.yourdomain.com \
  -d apps.yourdomain.com \
  --email your@email.com \
  --agree-tos \
  --non-interactive
```

> Certbot auto-renews via systemd timer. Verify: `systemctl status certbot.timer`

---

## Step 6: Install Nginx Config

```bash
# Copy the Nginx config
cp /opt/aura-platform/infra/nginx.conf /etc/nginx/sites-available/aura-platform

# Replace domain placeholders
sed -i 's/yourdomain.com/YOUR_ACTUAL_DOMAIN/g' /etc/nginx/sites-available/aura-platform

# Enable and remove default
ln -sf /etc/nginx/sites-available/aura-platform /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t && systemctl reload nginx
```

---

## Step 7: Build & Start All Containers

```bash
cd /opt/aura-platform/infra

# Build all images (this takes 15-30 minutes on first run)
docker compose -f docker-compose.prod.yml build

# Start everything
docker compose -f docker-compose.prod.yml up -d

# Watch the startup
docker compose -f docker-compose.prod.yml logs -f
```

### Verify containers are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

You should see 13 containers all in "Up" state.

---

## Step 8: Initialize the Database

First time only:

```bash
# Run migrations
docker exec aura-api-prod python manage.py migrate

# Create superuser
docker exec -it aura-api-prod python manage.py createsuperuser

# Collect static files
docker exec aura-api-prod python manage.py collectstatic --no-input

# Copy static/media to Nginx-accessible path
docker cp aura-api-prod:/app/static/. /var/www/saleor/static/
```

---

## Step 9: Register Apps in Dashboard

1. Go to `https://dashboard.yourdomain.com`
2. Log in with the superuser account
3. Go to **Configuration** → **Apps** → **Install external app**
4. Install each app using its manifest URL:

| App | Manifest URL |
|-----|-------------|
| Stripe | `https://apps.yourdomain.com/stripe/api/manifest` |
| SMTP | `https://apps.yourdomain.com/smtp/api/manifest` |
| Invoices | `https://apps.yourdomain.com/invoices/api/manifest` |
| Storefront Control | `https://apps.yourdomain.com/storefront-control/api/manifest` |
| Newsletter | `https://apps.yourdomain.com/newsletter/api/manifest` |
| Sales Analytics | `https://apps.yourdomain.com/analytics/api/manifest` |
| Bulk Manager | `https://apps.yourdomain.com/bulk-manager/api/manifest` |

---

## Step 10: Backup Automation

```bash
# Make backup scripts executable
chmod +x /opt/aura-platform/infra/scripts/backup-db.sh
chmod +x /opt/aura-platform/infra/scripts/restore-db.sh

# Add daily backup cron (2 AM)
crontab -e
# Add this line:
0 2 * * * /opt/aura-platform/infra/scripts/backup-db.sh local aura-postgres-prod >> /var/log/saleor-backup.log 2>&1

# For S3 backups:
# 0 2 * * * BACKUP_S3_BUCKET=my-bucket /opt/aura-platform/infra/scripts/backup-db.sh s3 aura-postgres-prod
```

---

## Updating the Platform

When you push new code:

```bash
cd /opt/aura-platform

# Pull latest code
git pull origin main

# Rebuild only changed services
docker compose -f infra/docker-compose.prod.yml build storefront  # example

# Rolling restart
docker compose -f infra/docker-compose.prod.yml up -d --no-deps storefront

# Or rebuild everything
docker compose -f infra/docker-compose.prod.yml up -d --build
```

---

## Useful Commands

```bash
# View all logs
docker compose -f infra/docker-compose.prod.yml logs -f

# View specific service
docker compose -f infra/docker-compose.prod.yml logs -f aura-api

# Restart a single service
docker compose -f infra/docker-compose.prod.yml restart storefront

# Check resource usage
docker stats

# Run a database backup now
/opt/aura-platform/infra/scripts/backup-db.sh local aura-postgres-prod

# Access Django shell
docker exec -it aura-api-prod python manage.py shell

# Access PostgreSQL
docker exec -it aura-postgres-prod psql -U saleor -d saleor
```

---

## Scaling Up

When traffic grows:

| Action | When |
|--------|------|
| Upgrade Droplet to 16GB | More than 500 daily orders |
| Managed PostgreSQL (DO) | Want automated backups + replication |
| Managed Redis (DO) | High cache hit rates |
| CDN (Cloudflare) | Enable orange cloud proxying |
| Second Droplet | Separate DB from app containers |
| Move Storefront to Vercel | Want edge caching + automatic scaling |

---

## Troubleshooting

### Container won't start
```bash
docker compose -f infra/docker-compose.prod.yml logs <service-name>
```

### Nginx 502 Bad Gateway
Container isn't ready yet or crashed. Check:
```bash
docker compose -f infra/docker-compose.prod.yml ps
docker compose -f infra/docker-compose.prod.yml logs <service-name>
```

### SSL certificate issues
```bash
certbot renew --dry-run  # test renewal
certbot certificates     # list certs
```

### Out of disk space
```bash
docker system prune -a   # remove unused images/containers
```

### Database won't connect
```bash
docker exec aura-postgres-prod pg_isready -U saleor
docker compose -f infra/docker-compose.prod.yml logs postgres
```
