# Alarz.site Migration Plan: Ubuntu 18.04 → 24.04 LTS (New Droplet)

## Context

**Why this migration is needed:**
- Ubuntu 18.04 reached End of Life (April 2023) — no more security patches
- Python 3.7 reached EOL (June 2023) — no security fixes, many modern packages dropped support
- Django 3.0 reached EOL (April 2021) — known security vulnerabilities
- PostgreSQL 10 reached EOL (November 2022) — no bug or security fixes
- The current droplet is a `s-2vcpu-8gb` ($48/mo) — massively oversized for this workload (1.3 GB used of 7.8 GB)
- Credentials exposed in settings.py (DB password, email password in cron.py) — needs cleanup

**Goal:** Migrate to a fresh `s-1vcpu-2gb` ($12/mo) droplet running Ubuntu 24.04 LTS with modern stack, zero data loss, and minimal downtime (<30 minutes).

---

## Current Stack Inventory

| Component | Current Version | Target Version | EOL Status |
|-----------|----------------|----------------|------------|
| Ubuntu | 18.04.6 LTS | 24.04 LTS | **EOL Apr 2023** |
| Python | 3.7.5 | 3.12.x | **EOL Jun 2023** |
| Django | 3.0.8 | 4.2 LTS (not 5.x) | **EOL Apr 2021** |
| PostgreSQL | 10 | 16 | **EOL Nov 2022** |
| gunicorn | 20.1.0 | 22.x | OK |
| nginx | (system) | latest | OK |
| Redis | (system, password-protected) | 7.x | OK |
| Celery | 5.2.7 | 5.4.x | OK-ish |
| psycopg2-binary | 2.8.6 | 2.9.x | OK |
| DRF | 3.11.0 | 3.15.x | **EOL** |
| Pillow | 7.2.0 | 10.x | **EOL** |

**App structure:** 8 Django apps (account, clients, orders, lines, storage, production, filling, charts), ~73 model classes, REST API via DRF, custom Account model, 4 cron jobs, static files on DigitalOcean Spaces (S3), templates with Hebrew UI.

**Database:** 867 MB, largest table `production_container_container_items` (324 MB, 1.8M rows).

---

## Breaking Changes Analysis

### CRITICAL — Will Break Without Fixes

#### 1. Python 3.7 → 3.12
| Breaking Change | Impact | Fix |
|----------------|--------|-----|
| `dict` ordering guaranteed (3.7+) | No impact | Already on 3.7 |
| `asyncio.coroutine` removed (3.11) | Check if any code uses `@asyncio.coroutine` | Replace with `async def` |
| `importlib.resources` changes (3.9+) | Low risk | Update imports |
| `typing` changes — `Optional`, `Union` | Low risk for this codebase | No generics used |
| `collections.abc` must be imported from `collections.abc` not `collections` (3.10) | **Check all imports** | `from collections.abc import ...` |
| `ssl` module changes (3.10+) | Affects `imaplib` in cron.py email fetching | Test email fetch |
| f-string parsing changes (3.12) | Low risk | Already uses f-strings |
| `distutils` removed (3.12) | **setup.py won't work** if any package depends on it | Use `setuptools` |

#### 2. Django 3.0 → 4.2 LTS (Multi-Step)
| Breaking Change | Version | Impact | Fix Required |
|----------------|---------|--------|-------------|
| `DEFAULT_AUTO_FIELD` required | 3.2 | **All models need explicit PK type** | Add `DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'` to settings |
| `url()` removed, must use `path()`/`re_path()` | 4.0 | Already using `path()` — **OK** | None |
| `USE_L10N` deprecated | 4.0 | Setting exists in settings.py | Remove it |
| `CSRF_TRUSTED_ORIGINS` must include scheme | 4.0 | **Currently `['alarz.site']`** — **WILL BREAK** | Change to `['https://alarz.site', 'https://www.alarz.site']` |
| `django.conf.urls.url()` removed | 4.0 | Check all urls.py files | Already uses `path()` — OK |
| `HttpRequest.is_ajax()` removed | 3.1 | **Check all views for `.is_ajax()` calls** | Replace with `request.headers.get('X-Requested-With') == 'XMLHttpRequest'` |
| `JSONField` from `jsonfield` → built-in | 3.1 | account/models.py uses `from jsonfield import JSONField` | Replace with `from django.db.models import JSONField` |
| `NullBooleanField` removed | 4.0 | Check all models | Replace with `BooleanField(null=True)` |
| Template `{% load %}` changes | 3.1 | `{% load staticfiles %}` → `{% load static %}` | Check all templates |
| `django.utils.encoding.force_text` removed | 4.0 | Check if any code uses it | Replace with `force_str` |
| `django.utils.translation.ugettext` removed | 4.0 | Check for `ugettext_lazy` | Replace with `gettext_lazy` |
| Password hashing default changed to Argon2 | 4.0 | Already using argon2-cffi — OK | Verify PASSWORD_HASHERS |
| `i18n_patterns` `prefix_default_language` | 3.0+ | Already using — verify behavior | Test URL generation |

#### 3. PostgreSQL 10 → 16
| Breaking Change | Impact | Fix |
|----------------|--------|-----|
| `pg_dump` format compatibility | Must dump from PG10, restore to PG16 | Use `--format=custom` flag |
| `default_with_oids` removed (PG12) | Low risk — Django doesn't use OIDs | None |
| `password_encryption` default changed to `scram-sha-256` (PG14) | DB user password must be re-set | Re-create DB user with password |
| `jsonb` improvements | No breaking changes | None |
| Extension compatibility | Check if any PG extensions used | Verify |

#### 4. Third-Party Package Breaking Changes
| Package | Current | Target | Breaking Changes |
|---------|---------|--------|-----------------|
| `django-filter` | 21.1 | 24.x | API changes in filterset — test all filters |
| `djangorestframework` | 3.11.0 | 3.15.x | Serializer field changes, router changes — test all API endpoints |
| `django-storages` | 1.11.1 | 1.14.x | S3 backend config key renames — **verify S3 settings** |
| `psycopg2-binary` | 2.8.6 | 2.9.x | `connection.info` API changes |
| `Pillow` | 7.2.0 | 10.x | `Image.ANTIALIAS` removed → `Image.LANCZOS` |
| `jsonfield` | 3.1.0 | **REMOVE** | Replace with Django built-in `JSONField` |
| `celery` | 5.2.7 | 5.4.x | Minor — `CELERY_BROKER_URL` is `amqp://localhost` but no RabbitMQ running! |
| `boto3` | 1.17.59 | 1.35.x | Minor API changes — S3 upload should work |
| `numpy` | 1.19.0 | 1.26.x | `np.float` etc. removed — check usage |
| `pandas` | 1.1.5 | 2.2.x | **Major** — `append()` removed, `inplace` deprecations |
| `opencv-python` | 4.3.0.36 | 4.10.x | Minor — test image processing code |
| `openpyxl` | 3.0.7 | 3.1.x | `get_sheet_by_name()` removed — use `wb[name]` |
| `selenium` | 3.141.0 | 4.x | **Major rewrite** — but only if actively used |
| `django-social-auth` | 0.7.28 | **DEAD package** | Replace with `social-auth-app-django` if needed |
| `django-nose` | 1.4.7 | **DEAD** | Remove — use Django test runner |
| `lxml` | 4.6.2 | 5.x | Need `libxml2-dev` on new server |
| `PyPDF2` | 1.26.0 | **Renamed to `pypdf`** | `import PyPDF2` → `import pypdf` |
| `docusign-esign` | 3.7.1 | 3.x latest | API version changes — test if used |

### CONFIRMED Breaking Changes (from codebase grep)

| Issue | Files Affected | Fix |
|-------|---------------|-----|
| **`.is_ajax()` removed in Django 4.0** | `orders/views.py:370`, `lines/mixins.py:9,16`, `lines/views.py:140` | Replace with `request.headers.get('X-Requested-With') == 'XMLHttpRequest'` |
| **`DataFrame.append()` removed in pandas 2.0** | `orders/api/views.py` (7 calls), `clients/views.py` (3 calls) — **10 total** | Replace with `pd.concat([df, new_row])` |
| **`Image.ANTIALIAS` removed in Pillow 10** | `lines/data_uri.py:27,47` | Replace with `Image.LANCZOS` |
| **`opencv-python` actively used** | 7 files across orders, clients, filling, storage, production serializers + views | **KEEP** — used for image processing |
| **`jsonfield` import** | `account/models.py` | Replace with `from django.db.models import JSONField` |

**Confirmed NOT used (safe to remove):**
- `selenium` / `chromedriver` — zero imports outside venv
- `docusign-esign` — zero imports
- `PyPDF2` — zero imports
- `django-social-auth` — zero imports
- `NullBooleanField` — zero usage
- `{% load staticfiles %}` — zero usage (already using `{% load static %}`)
- `ugettext` / `force_text` / `collections` non-abc — zero usage

### HIGH RISK — Needs Manual Verification

1. **Custom middleware** (`mySite/middleware_safe.py`) — CSRF handling may break with Django 4.x CSRF changes
2. **Email fetching cron** (`cron.py`) — Uses hardcoded Gmail IMAP credentials, may break with Python 3.12 ssl changes
3. **Celery broker** — Settings say `amqp://localhost` (RabbitMQ) but no RabbitMQ is running. `tasks.py` exists with `@shared_task` decorator but no worker runs. Include Celery with Redis broker per user request.
4. **`AllowAllUsersModelBackend`** — Allows inactive users to authenticate. Verify this is intentional.
5. **`django-apscheduler`** — Version 0.5.2 may not support Django 4.2. Check compatibility.
6. **`DEBUG=True` in production** — `settings.ini` has `DEBUG=True`. Must fix.
7. **Many dev packages in production** — jupyter, notebook, ipython, pre-commit — all installed in production venv

---

## Migration Strategy: Blue-Green Deployment

**Approach:** Stand up the new server completely, test everything, then switch DNS. The old server stays running until we confirm success.

### Phase 0: Pre-Migration Preparation (on your local machine)

**Time: ~30 minutes**

1. **Create fresh DigitalOcean droplet**
   - Image: Ubuntu 24.04 LTS
   - Plan: `s-1vcpu-2gb` ($12/mo)
   - Region: AMS3 (same as current — close to DO Spaces)
   - Add your SSH key during creation
   - Enable backups ($2.40/mo extra)

2. **Backup the current database**
   ```bash
   # On old server
   sudo -u postgres pg_dump -Fc -v alarzdb > /tmp/alarzdb_backup.dump
   ```

3. **Copy the full project + database dump to new server**
   ```bash
   # From local machine
   scp root@134.209.199.0:/tmp/alarzdb_backup.dump /tmp/
   scp -r root@134.209.199.0:/home/michael/alarz_dir /tmp/alarz_dir_backup/
   scp root@134.209.199.0:/home/michael/settings.ini /tmp/
   ```

### Phase 1: New Server Base Setup

**Time: ~20 minutes**

```bash
# 1. System update
apt update && apt upgrade -y

# 2. Install system dependencies
apt install -y python3.12 python3.12-venv python3.12-dev \
  postgresql-16 postgresql-client-16 \
  nginx certbot python3-certbot-nginx \
  redis-server \
  libpq-dev libxml2-dev libxslt1-dev libjpeg-dev zlib1g-dev \
  libffi-dev libssl-dev \
  build-essential git curl

# 3. Create swap file (1 GB)
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 4. Create app user
adduser --disabled-password --gecos "" michael
usermod -aG www-data michael
```

### Phase 2: PostgreSQL 16 Setup & Data Restore

**Time: ~15 minutes**

```bash
# 1. Create database user and database
sudo -u postgres createuser --no-superuser --no-createdb --no-createrole alarz_user
sudo -u postgres psql -c "ALTER USER alarz_user WITH PASSWORD '<NEW_STRONG_PASSWORD>';"
sudo -u postgres createdb -O alarz_user alarzdb

# 2. Restore the backup
sudo -u postgres pg_restore -d alarzdb --no-owner --role=alarz_user /tmp/alarzdb_backup.dump

# 3. Grant permissions
sudo -u postgres psql -d alarzdb -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO alarz_user;"
sudo -u postgres psql -d alarzdb -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO alarz_user;"

# 4. Tune PostgreSQL for 2GB RAM
# Edit /etc/postgresql/16/main/postgresql.conf:
#   shared_buffers = 512MB
#   work_mem = 4MB
#   effective_cache_size = 1GB
#   max_connections = 50
```

### Phase 3: Django Code Fixes (BEFORE deploying)

**Time: ~2-4 hours (the most critical phase)**

These changes must be made to the codebase on your local machine and tested:

#### 3.1 — settings.py Changes
```python
# ADD (required for Django 3.2+)
DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

# CHANGE (required for Django 4.0+)
CSRF_TRUSTED_ORIGINS = ['https://alarz.site', 'https://www.alarz.site']

# REMOVE (deprecated in Django 4.0)
# USE_L10N = True   ← delete this line

# UPDATE database config
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# FIX: Move Celery broker to Redis (no RabbitMQ on server)
CELERY_BROKER_URL = 'redis://localhost:6379/0'

# FIX: Security - DEBUG should be False in production
# (Already using decouple, just fix settings.ini)
```

#### 3.2 — Replace `jsonfield` with Django built-in
```python
# account/models.py — CHANGE:
# FROM: from jsonfield import JSONField
# TO:   from django.db.models import JSONField
```

#### 3.3 — Search and fix deprecated patterns
Files to check and fix:
- All `views.py` files (8 apps): Search for `.is_ajax()` → replace
- All `models.py` files: Search for `NullBooleanField` → replace with `BooleanField(null=True)`
- All templates: Search for `{% load staticfiles %}` → `{% load static %}`
- All code: Search for `ugettext_lazy` → `gettext_lazy`
- All code: Search for `force_text` → `force_str`
- All code: Search for `from collections import` (non-abc) → `from collections.abc import`

#### 3.4 — Update requirements.txt
Create a new `requirements.txt` with compatible versions:
```
Django==4.2.18
djangorestframework==3.15.2
django-filter==24.3
django-storages==1.14.4
django-crontab==0.7.1
django-dbbackup==4.1.0
django-bootstrap4==24.4
django-phone-field==1.8.1
django-localflavor==4.0
APScheduler==3.10.4
django-apscheduler==0.7.0
celery==5.4.0
gunicorn==22.0.0
psycopg2-binary==2.9.10
Pillow==10.4.0
boto3==1.35.0
numpy==1.26.4
pandas==2.2.3
openpyxl==3.1.5
XlsxWriter==3.2.0
lxml==5.3.0
beautifulsoup4==4.12.3
requests==2.32.3
python-decouple==3.8
PyYAML==6.0.2
pytz==2024.2
argon2-cffi==23.1.0
imbox==0.9.8
geoip2==4.8.1
googlemaps==4.10.0
PyJWT==2.9.0
python-dateutil==2.9.0
redis==5.2.0
schedule==1.2.2
cryptography==43.0.0
```
**Removed packages** (confirmed unused or dev-only):
- `jupyter`, `notebook`, `ipython`, `ipykernel`, `ipywidgets` — dev tools
- `selenium`, `chromedriver` — confirmed zero imports
- `docusign-esign` — confirmed zero imports
- `PyPDF2` — confirmed zero imports
- `django-social-auth` — confirmed zero imports (dead package)
- `pre-commit`, `pipenv` — dev tools
- `django-nose`, `nose` — dead test runner
- `jsonfield` — replaced by Django built-in `JSONField`
- `certbot`, `acme` — install system-wide, not in venv

**KEEP** (confirmed actively used):
- `opencv-python` — used in 7 files for image processing
- `pandas` — used in orders/clients views (needs `.append()` → `pd.concat()` fix)
- `openpyxl` — used but no deprecated API calls found

#### 3.5 — Fix pandas breaking changes (if used)
Search codebase for:
- `.append(` on DataFrames → replace with `pd.concat()`
- `.iteritems()` → `.items()`

#### 3.6 — Fix openpyxl breaking changes (if used)
Search for:
- `get_sheet_by_name()` → `wb[sheet_name]`
- `get_sheet_names()` → `wb.sheetnames`

#### 3.7 — Fix Pillow breaking changes (if used)
Search for:
- `Image.ANTIALIAS` → `Image.LANCZOS`

### Phase 4: Deploy to New Server

**Time: ~30 minutes**

```bash
# 1. Copy fixed codebase to new server
scp -r ./alarz_dir root@<NEW_IP>:/home/michael/

# 2. Create virtualenv with Python 3.12
cd /home/michael/alarz_dir
python3.12 -m venv env

# 3. Install dependencies
source env/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 4. Create settings.ini with secure values
cat > /home/michael/settings.ini << 'EOF'
[settings]
DEBUG=False
SECRET_KEY=<GENERATE_NEW_64_CHAR_KEY>
DB_NAME=alarzdb
DB_USER=alarz_user
DB_PASSWORD=<NEW_DB_PASSWORD>
DB_HOST=localhost
DB_PORT=5432
AWS_ACCESS_KEY_ID=CEGDLPQHGMPA5VVGMR64
AWS_SECRET_ACCESS_KEY=<your_key>
AWS_STORAGE_BUCKET_NAME=alarz-assets
AWS_S3_ENDPOINT_URL=https://ams3.digitaloceanspaces.com
AWS_LOCATION=alarz-site-static
EOF

# 5. Run migrations (Django will add any 3.2→4.2 system migrations)
python manage.py migrate

# 6. Collect static files (if needed locally)
python manage.py collectstatic --noinput

# 7. Test the app manually
python manage.py runserver 0.0.0.0:8080
# Visit http://<NEW_IP>:8080 and verify everything works

# 8. Set ownership
chown -R michael:www-data /home/michael/alarz_dir
```

### Phase 5: Gunicorn + Nginx + SSL Setup

**Time: ~20 minutes**

```bash
# 1. Create gunicorn systemd service (same pattern as old server)
# /etc/systemd/system/gunicorn.socket
# /etc/systemd/system/gunicorn.service
# Use 2 workers instead of 3 (2GB RAM)

# 2. Create nginx config for alarz.site
# Same config as old server but with modern SSL settings

# 3. Start services
systemctl enable --now gunicorn.socket
systemctl enable --now nginx

# 4. Test with IP directly
# Visit http://<NEW_IP> — should see the app

# 5. Point DNS to new IP (DigitalOcean DNS panel)
# alarz.site → <NEW_IP>
# www.alarz.site → <NEW_IP>

# 6. Wait for DNS propagation (5-30 minutes)

# 7. Get SSL certificate
certbot --nginx -d alarz.site -d www.alarz.site
```

### Phase 6: Cron Jobs + Redis + Final Config

**Time: ~15 minutes**

```bash
# 1. Set up cron jobs
python manage.py crontab add

# 2. Configure Redis (if Celery is actually needed)
# Edit /etc/redis/redis.conf — set password, bind to localhost only

# 3. Set up systemd journal size limit
# Edit /etc/systemd/journald.conf:
#   SystemMaxUse=100M

# 4. Set up automatic security updates
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# 5. Set up UFW firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# 6. Install fail2ban
apt install -y fail2ban
systemctl enable --now fail2ban
```

### Phase 7: Verification Checklist

**Time: ~1 hour**

| Test | How | Expected |
|------|-----|----------|
| Homepage loads | Visit https://alarz.site | Login page in Hebrew |
| Admin works | Visit https://alarz.site/he/admin/ | Django admin loads |
| Login works | Use existing credentials | Successful login |
| All 8 app pages load | Navigate through all sections | No 500 errors |
| REST API responds | `curl https://alarz.site/api/account/` | JSON response |
| Cron job runs | `python manage.py crontab show` | 4 jobs listed |
| DB backup works | Trigger manual backup | File created in backup/ |
| Static files load | Check CSS/JS in browser | Served from DO Spaces |
| SSL certificate valid | Browser padlock | Valid Let's Encrypt cert |
| Email fetch works | Wait for cron or trigger manually | No errors in logs |
| Data integrity | Spot-check key tables | Row counts match old server |

### Phase 8: Decommission Old Server

**Time: ~5 minutes (after 1-2 weeks of parallel running)**

1. Verify new server has been stable for 1-2 weeks
2. Take final DB snapshot from old server, compare row counts
3. Power off old droplet (don't destroy yet)
4. After 1 month, destroy old droplet

---

## Cost Savings

| Item | Before | After | Savings |
|------|--------|-------|---------|
| Droplet | s-2vcpu-8gb ($48/mo) | s-1vcpu-2gb ($12/mo) | **$36/mo** |
| Backups | None | Enabled ($2.40/mo) | -$2.40/mo |
| **Total** | **$48/mo** | **$14.40/mo** | **$33.60/mo ($403/yr)** |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Data loss during migration | pg_dump backup + old server stays running |
| Package incompatibility | Test on new server before DNS switch |
| Django migration failures | Run `migrate` before switching; can revert to old server |
| SSL downtime during DNS switch | Use Cloudflare proxy or accept ~30 min of HTTP-only |
| Forgot a breaking change | Old server stays running for 2+ weeks as rollback |
| Redis connection issues | Celery appears unused (no RabbitMQ running); can skip initially |

---

## Security Improvements (While We're At It)

These should be fixed during migration:

1. **`DEBUG=True` in production** → Set to `False`
2. **DB password in settings.py** → Move ALL secrets to `settings.ini` via `python-decouple`
3. **Email password hardcoded in cron.py** → Move to `settings.ini`
4. **Insecure SECRET_KEY** → Generate new 64-char key
5. **Redis exposed to public IP** → Bind to `127.0.0.1` only
6. **No firewall** → Enable UFW
7. **No fail2ban** → Install and configure
8. **PostgreSQL `root` user** → Create dedicated DB user with limited permissions
9. **No swap** → Add 1 GB swap

---

## Exact Code Changes Required (Confirmed via grep)

| # | File | Line(s) | Change |
|---|------|---------|--------|
| 1 | `mySite/settings.py` | top-level | Add `DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'` |
| 2 | `mySite/settings.py` | CSRF_TRUSTED_ORIGINS | `['alarz.site', ...]` → `['https://alarz.site', 'https://www.alarz.site']` |
| 3 | `mySite/settings.py` | USE_L10N | Delete the `USE_L10N = True` line |
| 4 | `mySite/settings.py` | DATABASES | Move credentials to settings.ini via `config()` |
| 5 | `mySite/settings.py` | CELERY_BROKER_URL | `'amqp://localhost'` → `'redis://localhost:6379/0'` |
| 6 | `mySite/cron.py` | email_pass | Move `ytjf2mdhi7j` to settings.ini, use `config('EMAIL_PASSWORD')` |
| 7 | `account/models.py` | import | `from jsonfield import JSONField` → `from django.db.models import JSONField` |
| 8 | `orders/views.py` | :370 | `request.is_ajax` → `request.headers.get('X-Requested-With') == 'XMLHttpRequest'` |
| 9 | `lines/mixins.py` | :9, :16 | `self.request.is_ajax()` → `self.request.headers.get(...)` |
| 10 | `lines/views.py` | :140 | `request.is_ajax()` → `request.headers.get(...)` |
| 11 | `orders/api/views.py` | :322, :521, :535, :551, :582, :597, :612 | `rv_dataframe.append(...)` → `pd.concat([rv_dataframe, ...])` (7 places) |
| 12 | `clients/views.py` | :48, :66, :75 | `rv_dataframe.append(...)` → `pd.concat([...])` (3 places) |
| 13 | `lines/data_uri.py` | :27, :47 | `Image.ANTIALIAS` → `Image.LANCZOS` |
| 14 | `settings.ini` | all | New file with `DEBUG=False`, new SECRET_KEY, DB creds, email creds |
| 15 | `requirements.txt` | all | Full rewrite with compatible versions (see Phase 3.4) |

**Total: 15 files, ~25 individual line changes**

**Confirmed NOT needed** (zero matches in grep):
- No `NullBooleanField` usage
- No `{% load staticfiles %}` in templates
- No `ugettext` / `force_text` / `from collections import` (non-abc)
- No deprecated `openpyxl` API calls

---

## Recommended Upgrade Path (Step-by-Step Django Versions)

**Do NOT jump directly from Django 3.0 → 4.2.** The recommended path:

1. **3.0.8 → 3.2 LTS** — Fix `DEFAULT_AUTO_FIELD`, `JSONField` migration, deprecation warnings
2. **3.2 → 4.0** — Fix `CSRF_TRUSTED_ORIGINS`, remove `USE_L10N`, fix any remaining deprecations
3. **4.0 → 4.2 LTS** — Final target, stable LTS

Each step: install version → run `python -Wa manage.py test` to see deprecation warnings → fix → next version.

**Why not Django 5.x?** Several third-party packages (django-apscheduler, django-bootstrap4, django-crontab) may not support Django 5.x yet. Django 4.2 LTS is supported until April 2026, giving you time to upgrade later.