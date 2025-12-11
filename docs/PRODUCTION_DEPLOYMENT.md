# Production Deployment Guide

This guide covers deploying the Saleor platform to production on a VPS using Docker Compose and Nginx.

## Overview

Production deployment consists of:

1. **VPS Setup**: Server provisioning and initial configuration
2. **Docker Deployment**: Running Saleor Core with Docker Compose
3. **Nginx Reverse Proxy**: SSL termination and routing
4. **Storefront Deployment**: Deploying Next.js storefront to Vercel or similar
5. **Monitoring & Maintenance**: Logging, backups, updates

## Prerequisites

- VPS with Ubuntu 22.04 LTS (or similar)
- Root or sudo access
- Domain name with DNS access
- Basic knowledge of Linux, Docker, and Nginx

## Step 1: VPS Setup

### 1.1 Initial Server Configuration

**Connect to your VPS:**

```bash
ssh root@your-server-ip
```

**Update system:**

```bash
apt update && apt upgrade -y
```

**Install required packages:**

```bash
apt install -y \
  docker.io \
  docker-compose \
  nginx \
  certbot \
  python3-certbot-nginx \
  git \
  curl \
  ufw
```

**Start Docker:**

```bash
systemctl enable docker
systemctl start docker
```

**Configure firewall:**

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### 1.2 Create Application User

**Create a non-root user:**

```bash
adduser saleor
usermod -aG docker saleor
usermod -aG sudo saleor
```

**Switch to the new user:**

```bash
su - saleor
```

## Step 2: Deploy Saleor Core

### 2.1 Clone Repository

```bash
cd /home/saleor
git clone <your-repo-url> saleor-platform
cd saleor-platform/infra
```

### 2.2 Configure Environment Variables

**Create production environment file:**

```bash
cp .env.example .env.prod
nano .env.prod
```

**Configure all required variables:**

```env
# Security
SECRET_KEY=<generate-secure-key>
WEBHOOK_SECRET_KEY=<generate-secure-key>

# Database
POSTGRES_USER=saleor
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=saleor
DATABASE_URL=postgres://saleor:<strong-password>@postgres:5432/saleor

# Redis
REDIS_PASSWORD=<strong-password>
REDIS_URL=redis://:<strong-password>@redis:6379/0
CELERY_BROKER_URL=redis://:<strong-password>@redis:6379/1
CELERY_RESULT_BACKEND=redis://:<strong-password>@redis:6379/2
CACHE_URL=redis://:<strong-password>@redis:6379/3

# Application
DEBUG=False
ALLOWED_HOSTS=api.yourdomain.com,yourdomain.com
ALLOWED_CLIENT_HOSTS=https://shop.yourdomain.com,https://yourdomain.com

# Media
MEDIA_URL=/media/

# Email
EMAIL_URL=smtp://user:pass@smtp.gmail.com:587/?tls=True

# Timezone
TIME_ZONE=UTC
```

**Generate secure keys:**

```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**Set file permissions:**

```bash
chmod 600 .env.prod
```

### 2.3 Start Services

**Start the production stack:**

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

**Check service status:**

```bash
docker compose -f docker-compose.prod.yml ps
```

**View logs:**

```bash
docker compose -f docker-compose.prod.yml logs -f
```

### 2.4 Initialize Database

**Run migrations:**

```bash
docker compose -f docker-compose.prod.yml exec saleor-api python manage.py migrate
```

**Create superuser:**

```bash
docker compose -f docker-compose.prod.yml exec saleor-api python manage.py createsuperuser
```

## Step 3: Configure Nginx

### 3.1 Install Nginx Configuration

**Copy Nginx config:**

```bash
sudo cp nginx.conf /etc/nginx/sites-available/saleor
sudo ln -s /etc/nginx/sites-available/saleor /etc/nginx/sites-enabled/
```

**Edit configuration:**

```bash
sudo nano /etc/nginx/sites-available/saleor
```

**Update server names:**

Replace `yourdomain.com` with your actual domain names:
- `api.yourdomain.com` → Your API domain
- `dashboard.yourdomain.com` → Your Dashboard domain
- `shop.yourdomain.com` → Your Storefront domain (if self-hosting)

### 3.2 Configure Media Files

**Create media directory:**

```bash
sudo mkdir -p /var/www/saleor/media
sudo chown -R saleor:saleor /var/www/saleor
```

**Update Docker Compose to mount media:**

Edit `docker-compose.prod.yml` to add volume mount:

```yaml
saleor-api:
  volumes:
    - /var/www/saleor/media:/app/media
```

**Restart API:**

```bash
docker compose -f docker-compose.prod.yml restart saleor-api
```

### 3.3 Set Up SSL with Let's Encrypt

**Obtain SSL certificates:**

```bash
sudo certbot --nginx -d api.yourdomain.com
sudo certbot --nginx -d dashboard.yourdomain.com
```

**Auto-renewal:**

```bash
sudo certbot renew --dry-run
```

Certbot will automatically renew certificates.

### 3.4 Test and Reload Nginx

**Test configuration:**

```bash
sudo nginx -t
```

**Reload Nginx:**

```bash
sudo systemctl reload nginx
```

## Step 4: Configure DNS

**Set up DNS records:**

1. **API**: `A` record for `api.yourdomain.com` → Your VPS IP
2. **Dashboard**: `A` record for `dashboard.yourdomain.com` → Your VPS IP
3. **Storefront**: `CNAME` record for `shop.yourdomain.com` → Vercel (if using Vercel)

**Wait for DNS propagation** (can take up to 48 hours, usually much faster).

## Step 5: Deploy Storefront

### Option A: Vercel (Recommended)

1. **Push code to GitHub/GitLab**

2. **Import project in Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Select the `storefront` directory as root

3. **Configure environment variables:**
   ```
   NEXT_PUBLIC_SALEOR_API_URL=https://api.yourdomain.com/graphql/
   NEXT_PUBLIC_DEFAULT_CHANNEL=default-channel
   ```

4. **Deploy**

5. **Configure custom domain:**
   - Add `shop.yourdomain.com` in Vercel dashboard
   - Update DNS with CNAME record

### Option B: Self-Hosted

1. **Build the storefront:**

   ```bash
   cd /home/saleor/saleor-platform/storefront
   pnpm install
   pnpm build
   ```

2. **Run with PM2:**

   ```bash
   npm install -g pm2
   pm2 start npm --name "storefront" -- start
   pm2 save
   pm2 startup
   ```

3. **Update Nginx config** to proxy to `localhost:3000`

## Step 6: Configure Dashboard Access

### Option A: IP Whitelist

Edit Nginx config:

```nginx
# In dashboard server block
allow 1.2.3.4;  # Your IP
deny all;
```

### Option B: Basic Auth

**Create password file:**

```bash
sudo apt install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

**Update Nginx config:**

```nginx
auth_basic "Restricted Access";
auth_basic_user_file /etc/nginx/.htpasswd;
```

**Reload Nginx:**

```bash
sudo systemctl reload nginx
```

## Step 7: Configure Saleor Shop

See [SALEOR_CONFIGURATION.md](./SALEOR_CONFIGURATION.md) for detailed shop setup:

1. Create channels
2. Configure shipping zones
3. Set up payment gateways
4. Add products
5. Configure taxes

## Step 8: Set Up Backups

### 8.1 Database Backups

**Create backup script:**

```bash
nano /home/saleor/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/saleor/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker compose -f /home/saleor/saleor-platform/infra/docker-compose.prod.yml exec -T postgres pg_dump -U saleor saleor > $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
```

**Make executable:**

```bash
chmod +x /home/saleor/backup-db.sh
```

**Add to crontab:**

```bash
crontab -e
```

Add:

```
0 2 * * * /home/saleor/backup-db.sh
```

### 8.2 Media Backups

**Backup media files:**

```bash
nano /home/saleor/backup-media.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/saleor/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/media_$DATE.tar.gz /var/www/saleor/media

# Keep only last 7 days
find $BACKUP_DIR -name "media_*.tar.gz" -mtime +7 -delete
```

**Add to crontab:**

```
0 3 * * * /home/saleor/backup-media.sh
```

## Step 9: Monitoring and Logging

### 9.1 Set Up Log Rotation

**Configure logrotate:**

```bash
sudo nano /etc/logrotate.d/saleor
```

```
/var/log/nginx/saleor-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### 9.2 Monitor Services

**Check service health:**

```bash
docker compose -f docker-compose.prod.yml ps
```

**Monitor logs:**

```bash
docker compose -f docker-compose.prod.yml logs --tail=100 -f
```

**Set up monitoring** (optional):

- Use tools like Prometheus + Grafana
- Or use managed services like Datadog, New Relic

## Step 10: Security Hardening

### 10.1 Firewall Rules

**Review and tighten firewall:**

```bash
sudo ufw status
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
```

### 10.2 SSH Hardening

**Disable root login:**

```bash
sudo nano /etc/ssh/sshd_config
```

Set:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

**Restart SSH:**

```bash
sudo systemctl restart sshd
```

### 10.3 Regular Updates

**Set up automatic security updates:**

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Maintenance

### Updating Saleor

1. **Pull latest changes:**

   ```bash
   cd /home/saleor/saleor-platform
   git pull
   ```

2. **Update Docker images:**

   ```bash
   cd infra
   docker compose -f docker-compose.prod.yml pull
   ```

3. **Backup database:**

   ```bash
   ./backup-db.sh
   ```

4. **Update services:**

   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

5. **Run migrations:**

   ```bash
   docker compose -f docker-compose.prod.yml exec saleor-api python manage.py migrate
   ```

6. **Verify everything works:**

   ```bash
   docker compose -f docker-compose.prod.yml ps
   curl https://api.yourdomain.com/graphql/
   ```

### Scaling

**Increase API workers:**

Edit `docker-compose.prod.yml`:

```yaml
saleor-api:
  deploy:
    replicas: 3
```

**Use a load balancer** (Nginx, HAProxy) for multiple API instances.

## Troubleshooting

### Services Not Starting

**Check logs:**

```bash
docker compose -f docker-compose.prod.yml logs
```

**Check disk space:**

```bash
df -h
```

**Check memory:**

```bash
free -h
```

### SSL Certificate Issues

**Renew certificates manually:**

```bash
sudo certbot renew
```

**Check certificate status:**

```bash
sudo certbot certificates
```

### Performance Issues

**Check resource usage:**

```bash
docker stats
```

**Optimize database:**

```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U saleor -d saleor -c "VACUUM ANALYZE;"
```

## Next Steps

- Configure your shop: [SALEOR_CONFIGURATION.md](./SALEOR_CONFIGURATION.md)
- Set up monitoring and alerts
- Configure CDN for media files
- Set up staging environment

## Additional Resources

- [Saleor Deployment Guide](https://docs.saleor.io/docs/3.x/developer/deployment)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

