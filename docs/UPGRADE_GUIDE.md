# Saleor Upgrade Guide

This guide helps you upgrade Saleor between major versions while maintaining your customizations and data.

## Upgrade Philosophy

- **Never modify Saleor core directly**
- **Isolate all customizations** in separate plugins or extensions
- **Test upgrades in staging** before production
- **Backup everything** before upgrading
- **Follow official migration guides**

## Pre-Upgrade Checklist

- [ ] Review [Saleor Release Notes](https://github.com/saleor/saleor/releases)
- [ ] Check for breaking changes in the target version
- [ ] Review your customizations and plugins
- [ ] Test upgrade in staging environment
- [ ] Backup database and media files
- [ ] Document current version and configuration

## General Upgrade Process

### 1. Backup Everything

**Database Backup:**

```bash
# Development
docker compose -f infra/docker-compose.dev.yml exec postgres pg_dump -U saleor saleor > backup_$(date +%Y%m%d).sql

# Production
docker compose -f infra/docker-compose.prod.yml --env-file .env.prod exec postgres pg_dump -U saleor saleor > backup_$(date +%Y%m%d).sql
```

**Media Files Backup:**

```bash
# Development
docker compose -f infra/docker-compose.dev.yml exec saleor-api tar -czf /tmp/media_backup.tar.gz /app/media

# Production
tar -czf /home/saleor/backups/media_backup_$(date +%Y%m%d).tar.gz /var/www/saleor/media
```

### 2. Update Docker Images

**Update docker-compose files:**

Edit `docker-compose.dev.yml` and `docker-compose.prod.yml`:

```yaml
saleor-api:
  image: saleor/saleor:4.0.0  # Update to target version
  # ...
```

**Pull new images:**

```bash
docker compose -f infra/docker-compose.dev.yml pull
```

### 3. Run Migrations

**Stop services:**

```bash
docker compose -f infra/docker-compose.dev.yml down
```

**Start with new images:**

```bash
docker compose -f infra/docker-compose.dev.yml up -d
```

**Run migrations:**

```bash
docker compose -f infra/docker-compose.dev.yml exec saleor-api python manage.py migrate
```

### 4. Update Dependencies

**Update Storefront dependencies:**

```bash
cd storefront
pnpm update
pnpm codegen  # Regenerate GraphQL types
```

**Update Dashboard dependencies:**

```bash
cd dashboard
pnpm update
```

### 5. Test Everything

- [ ] API GraphQL queries work
- [ ] Products display correctly
- [ ] Checkout flow works
- [ ] Payment processing works
- [ ] Admin dashboard functions
- [ ] Custom plugins/extensions work

## Version-Specific Upgrades

### Upgrading from Saleor 3.x to 4.x

**Breaking Changes:**

- GraphQL API schema changes
- Plugin system updates
- Database schema changes
- Environment variable changes

**Steps:**

1. **Review Migration Guide:**
   - [Saleor 4.0 Release Notes](https://github.com/saleor/saleor/releases/tag/4.0.0)

2. **Update Environment Variables:**
   - Check for new required variables
   - Update deprecated variables

3. **Update GraphQL Queries:**
   - Regenerate types: `pnpm codegen`
   - Update queries/mutations if schema changed

4. **Update Plugins:**
   - Check plugin compatibility
   - Update or replace incompatible plugins

5. **Test Extensively:**
   - Test all custom functionality
   - Verify data integrity

### Upgrading from Saleor 4.x to 5.x

**Follow the same process as above, checking for:**
- New breaking changes
- Updated plugin APIs
- Schema modifications

## Handling Breaking Changes

### GraphQL Schema Changes

**Identify Changes:**

```bash
# Compare schemas
curl http://localhost:8000/graphql/ > schema_old.json
# After upgrade
curl http://localhost:8000/graphql/ > schema_new.json
diff schema_old.json schema_new.json
```

**Update Queries:**

1. Regenerate GraphQL types
2. Fix TypeScript errors
3. Update queries/mutations
4. Test thoroughly

### Database Schema Changes

**Automatic Migrations:**

Saleor handles most migrations automatically:

```bash
docker compose -f infra/docker-compose.dev.yml exec saleor-api python manage.py migrate
```

**Manual Migrations:**

If custom models exist, create migration files:

```bash
docker compose -f infra/docker-compose.dev.yml exec saleor-api python manage.py makemigrations
```

### Plugin Compatibility

**Check Plugin Status:**

1. Review plugin documentation
2. Check GitHub issues for compatibility
3. Test plugins in staging

**Update or Replace:**

- Update plugins to compatible versions
- Replace incompatible plugins
- Remove unused plugins

## Rollback Procedure

If upgrade fails, rollback immediately:

### 1. Stop Services

```bash
docker compose -f infra/docker-compose.dev.yml down
```

### 2. Restore Database

```bash
# Restore from backup
docker compose -f infra/docker-compose.dev.yml up -d postgres
docker compose -f infra/docker-compose.dev.yml exec -T postgres psql -U saleor -d saleor < backup_YYYYMMDD.sql
```

### 3. Restore Media

```bash
docker compose -f infra/docker-compose.dev.yml exec saleor-api tar -xzf /tmp/media_backup.tar.gz -C /
```

### 4. Revert Docker Images

Edit docker-compose files to use previous version:

```yaml
saleor-api:
  image: saleor/saleor:3.20.0  # Previous version
```

### 5. Restart Services

```bash
docker compose -f infra/docker-compose.dev.yml pull
docker compose -f infra/docker-compose.dev.yml up -d
```

## Post-Upgrade Tasks

### 1. Verify Data Integrity

```bash
# Check database
docker compose -f infra/docker-compose.dev.yml exec postgres psql -U saleor -d saleor -c "SELECT COUNT(*) FROM product_product;"

# Check API
curl http://localhost:8000/graphql/ -X POST -H "Content-Type: application/json" -d '{"query": "{ shop { name } }"}'
```

### 2. Update Documentation

- Update version numbers in README
- Document any manual changes required
- Update environment variable documentation

### 3. Monitor Performance

- Check service logs
- Monitor resource usage
- Verify background jobs are running

### 4. Test Critical Paths

- [ ] User registration
- [ ] Product browsing
- [ ] Add to cart
- [ ] Checkout process
- [ ] Payment processing
- [ ] Order fulfillment
- [ ] Admin operations

## Staging Environment Best Practices

**Always test upgrades in staging first:**

1. **Mirror Production:**
   - Use same Docker images
   - Copy production database (anonymized)
   - Use same environment variables

2. **Test Scenarios:**
   - Common user flows
   - Edge cases
   - Error handling
   - Performance under load

3. **Document Issues:**
   - Track any problems encountered
   - Document solutions
   - Share with team

## Automated Upgrade Script

Create a custom upgrade script for your setup:

```bash
#!/bin/bash
# upgrade-saleor.sh

set -e

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: ./upgrade-saleor.sh <version>"
    exit 1
fi

echo "Upgrading Saleor to $VERSION..."

# Backup
./backup-db.sh
./backup-media.sh

# Update docker-compose
sed -i "s|saleor/saleor:.*|saleor/saleor:$VERSION|" docker-compose.dev.yml

# Pull and restart
docker compose pull
docker compose up -d

# Migrate
docker compose exec saleor-api python manage.py migrate

echo "Upgrade complete!"
```

## Resources

- [Saleor Releases](https://github.com/saleor/saleor/releases)
- [Saleor Changelog](https://github.com/saleor/saleor/blob/main/CHANGELOG.md)
- [Saleor Migration Guide](https://docs.saleor.io/docs/3.x/developer/upgrade)
- [Saleor Community](https://github.com/saleor/saleor/discussions)

## Support

If you encounter issues during upgrade:

1. Check [Saleor GitHub Issues](https://github.com/saleor/saleor/issues)
2. Search [Saleor Discussions](https://github.com/saleor/saleor/discussions)
3. Review [Saleor Documentation](https://docs.saleor.io)
4. Contact Saleor support (if using Saleor Cloud)

