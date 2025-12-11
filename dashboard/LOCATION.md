# Dashboard Code Location

## ✅ Moved Successfully!

The Saleor Dashboard code has been moved to:

```
saleor-platform/dashboard/
```

## Structure

```
saleor-platform/
├── dashboard/              # ← Dashboard code is here now!
│   ├── src/              # Main source code
│   ├── package.json      # Dependencies
│   ├── vite.config.js    # Vite config
│   └── ...
├── saleor/               # Backend API
├── storefront/          # Storefront
├── backend/             # Custom plugins
└── infra/               # Docker config
```

## Docker Configuration

The `infra/docker-compose.dev.yml` has been updated to mount:

```yaml
volumes:
  - ../dashboard:/app # Mounts saleor-platform/dashboard to /app in container
```

## Edit Code

Edit files in:

```
saleor-platform/dashboard/src/
```

Changes will hot-reload automatically in Docker!

## Access

- **Dashboard**: http://localhost:9000
- **GraphQL API**: http://localhost:8000/graphql/
