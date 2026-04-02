---
description:
alwaysApply: true
---

# Saleor Backend

Django/GraphQL backend (Python 3.12). All commands run inside Docker via `docker exec`.

## Commands

```bash
# Migrations
docker exec -it aura-api-dev python manage.py migrate
docker exec -it aura-api-dev python manage.py makemigrations

# GraphQL schema (regenerate after model/type changes)
docker exec -it aura-api-dev python manage.py build_schema

# Admin user
docker exec -it aura-api-dev python manage.py createsuperuser

# Testing
docker exec -it aura-api-dev pytest --reuse-db                          # All tests
docker exec -it aura-api-dev pytest --reuse-db path/to/test.py          # Single file
docker exec -it aura-api-dev pytest --reuse-db path/to/test.py -k name  # Specific test

# Linting & type checking
docker exec -it aura-api-dev ruff check .
docker exec -it aura-api-dev mypy saleor

# Interactive shell
docker exec -it aura-api-dev python manage.py shell
```

## Architecture

- **Framework**: Django 4.x + Graphene (GraphQL)
- **Settings**: `saleor/saleor/settings.py`
- **Background jobs**: Celery (worker: `aura-worker-dev`, scheduler: `aura-scheduler-dev`)
- **Custom auth backend**: Supports JWT via `@saleor/auth-sdk`

After schema/model changes, restart dependent containers:
```bash
docker compose -f infra/docker-compose.dev.yml restart aura-api aura-worker-dev aura-scheduler-dev
```

## Testing Conventions

- Use `pytest` with `--reuse-db` for speed
- Use given/when/then structure for clarity
- Use `pytest` fixtures (from `tests/fixtures/`) over mocking
- Declare test functions flat in file — do not wrap in classes
- Prefer fixtures decorated with `@pytest.fixture`

## Directory Structure

```
saleor/
├── saleor/
│   ├── settings.py          # Django settings (installed apps, middleware, DB)
│   ├── graphql/              # GraphQL schema (Graphene types, mutations, resolvers)
│   │   ├── account/          # User/auth types
│   │   ├── checkout/         # Checkout mutations
│   │   ├── order/            # Order types
│   │   ├── product/          # Product types
│   │   └── ...
│   ├── checkout/             # Checkout business logic
│   ├── order/                # Order processing
│   ├── payment/              # Payment gateway integrations
│   ├── plugins/              # Plugin system (webhooks, events)
│   ├── warehouse/            # Stock management
│   └── core/                 # Shared utilities, base models
├── tests/
│   ├── fixtures/             # Pytest fixtures (@pytest.fixture)
│   └── ...                   # Test files mirror src structure
└── manage.py
```

## GraphQL Development Workflow

1. **Modify schema**: Edit types/mutations in `saleor/graphql/<domain>/`
2. **Rebuild schema**: `docker exec -it aura-api-dev python manage.py build_schema`
3. **Regenerate frontend types**: `docker exec -it aura-dashboard-dev pnpm generate` and `docker exec -it aura-storefront-dev pnpm generate`
4. **Restart**: `docker compose -f infra/docker-compose.dev.yml restart aura-api`

## Plugin & Webhook System

Apps communicate with Saleor via webhooks. Key concepts:
- **Synchronous webhooks**: Payment processing, tax calculation, shipping price
- **Asynchronous webhooks**: Order events, product updates, fulfillment
- Plugin manager in `saleor/plugins/manager.py` dispatches events to registered apps

## Debugging Tips

- **GraphQL playground**: `http://localhost:8000/graphql/` — interactive query editor
- **Django shell**: `docker exec -it aura-api-dev python manage.py shell` — test queries interactively
- **Check migrations**: `docker exec -it aura-api-dev python manage.py showmigrations` — see applied/pending
- **Celery tasks**: Check worker logs: `docker compose -f infra/docker-compose.dev.yml logs aura-worker-dev`
- **DB queries**: Connect via `docker exec -it aura-postgres-dev psql -U saleor -d saleor`

## Code Style

- Black-style formatting (4 spaces, 88 columns)
- Ruff linting (replaces flake8/isort)
- Type hints required for public functions
