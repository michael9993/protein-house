# Saleor Platform Agent Guide

This repo is a multi-project workspace. Follow the conventions of the directory you are working in.
If rules exist in .cursor/rules/, .cursorrules, or .github/copilot-instructions.md, they must be followed.
No Cursor or Copilot rules were found at the repo root at the time of writing.

## Workspace Layout

- saleor/ - Django/GraphQL backend (Python)
- dashboard/ - Admin dashboard (React + Vite, TypeScript)
- storefront/ - Next.js storefront (TypeScript)
- apps/ - Saleor Apps monorepo (Next.js + TypeScript, Turborepo)
- infra/ - Docker compose and setup scripts

## Global Setup Notes

- Use Docker Compose for the full stack: `docker compose -f infra/docker-compose.dev.yml up -d`
- Avoid committing .env files or secrets.
- Prefer running commands inside the project directory they belong to.

## Docker Development Workflow

This project uses Docker Compose for local development. All services run in containers.

### Main Containers

- **saleor-api** - Django/GraphQL backend (Saleor API)
- **saleor-worker** - Celery worker for background tasks
- **saleor-scheduler** - Celery beat scheduler for periodic tasks
- **saleor-dashboard** - React admin dashboard
- **saleor-storefront** - Next.js storefront
- **saleor-storefront-control-app** - Storefront control CMS app
- **saleor-stripe-app** - Stripe payment app
- **saleor-smtp-app** - SMTP email app
- **saleor-invoice-app** - Invoice generation app
- **saleor-postgres** - PostgreSQL database
- **saleor-redis** - Redis cache/broker

### Container Restart Guidelines

**After making changes, always determine which container(s) need to be restarted:**

1. **Backend changes (saleor/)**:
   - Schema/model changes: Restart `saleor-api`, `saleor-worker`, `saleor-scheduler`
   - Code changes only: Restart `saleor-api` (auto-reload may work, but restart ensures consistency)
   - Migration changes: Restart `saleor-api` after running migrations

2. **Dashboard changes (dashboard/)**:
   - Restart `saleor-dashboard-dev`
   - If GraphQL schema changed: Run `pnpm generate` in dashboard, then restart container

3. **Storefront changes (storefront/)**:
   - Restart `saleor-storefront-dev`
   - If GraphQL schema changed: Run `pnpm generate` in storefront, then restart container

4. **Storefront Control App changes (apps/apps/storefront-control/)**:
   - Restart `saleor-storefront-control-app`
   - If schema/config structure changed: Update sample config files (see below)

5. **Other App changes (apps/apps/*/)**:
   - Restart the corresponding app container (e.g., `saleor-stripe-app` for Stripe app)

6. **Database/Redis changes**:
   - Usually no restart needed (data persists in volumes)
   - Only restart if configuration changed

**Restart command:**
```bash
docker compose -f infra/docker-compose.dev.yml restart <container-name>
```

**View logs:**
```bash
docker compose -f infra/docker-compose.dev.yml logs -f <container-name>
```

**Check container status:**
```bash
docker compose -f infra/docker-compose.dev.yml ps
```

## Build / Lint / Test Commands

### Saleor API (saleor/)

- Install deps (uv/venv expected): `uv sync` or project-specific setup
- Start dev server: `poe start` (runs `uvicorn saleor.asgi:application --reload`)
- Migrations: `poe migrate` / `poe make-migrations`
- Build GraphQL schema: `poe build-schema`
- Lint (Ruff): `ruff check .`
- Type check (mypy): `mypy saleor`
- Tests (all): `pytest --reuse-db`
- Tests (single file): `pytest --reuse-db path/to/test_file.py`
- Tests (single test): `pytest --reuse-db path/to/test_file.py -k test_name`

### Dashboard (dashboard/)

- Install deps: `pnpm install`
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Type check: `pnpm check-types` or `pnpm check-types:src`
- Lint: `pnpm lint` (runs eslint + prettier)
- Lint fix: `pnpm lint:eslint` / `pnpm lint:prettier`
- Tests (Jest): `pnpm test`
- Tests (single file): `pnpm test path/to/test.tsx`
- Tests (watch): `pnpm test:watch`
- Playwright e2e: `pnpm e2e`
- Playwright single test: `pnpm exec playwright test path/to/spec.ts`

### Storefront (storefront/)

- Install deps: `pnpm install`
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Type check: `pnpm type-check`
- Tests: (none configured in scripts; rely on lint/type-check)
- GraphQL types: `pnpm generate`

### Apps Monorepo (apps/)

- Install deps: `pnpm install`
- Dev (all): `pnpm dev` (turbo)
- Build (all): `pnpm build`
- Lint (all): `pnpm lint`
- Lint fix: `pnpm lint:fix`
- Type check: `pnpm check-types`
- Tests (all): `pnpm test` or `pnpm test:ci`
- Run a single app: `pnpm --filter <app-name> dev`
- App lint: `pnpm --filter <app-name> lint`
- App tests: `pnpm --filter <app-name> test`
- App unit tests (Vitest): `vitest --project units`
- App e2e tests (Vitest): `vitest --project e2e`
- GraphQL codegen: `pnpm generate`

## Code Style Guidelines

### General

- Respect existing patterns in the target package (do not mix styles).
- Prefer small, composable functions over large blocks.
- Keep edits minimal and localized; avoid wide refactors without request.
- Never add emojis to source unless the user requests them.

### Python (saleor/)

- Formatting follows Black-style rules (EditorConfig: 4 spaces, 88 columns).
- Linting uses Ruff with a large rule set; fix violations or justify ignores.
- Type hints are required for public functions and complex logic.
- Prefer fixtures over mocking in tests; use pytest fixtures from `tests/fixtures`.
- Tests should be flat functions (no test classes) and use given/when/then naming.
- Error handling: raise specific exceptions; avoid bare except.

### TypeScript / React (dashboard/, storefront/, apps/)

- Use TypeScript everywhere; avoid `any` unless absolutely necessary.
- Prefer functional components and hooks; keep components focused.
- Keep file exports consistent; avoid default exports if the folder uses named.
- Use Prettier formatting; do not hand-format.
- Use ESLint rules as source of truth (import sorting, no unused vars, etc.).
- Error handling: use explicit error boundaries or Result-style handling when used.

### Apps-Specific Patterns (apps/)

- Result-based error handling with `neverthrow` (`Result<T, E>`); avoid throwing.
- Branded types with Zod for validated primitives (see ADR 0002).
- Error classes via `BaseError.subclass()` from `@saleor/apps-errors`.
- Repository pattern for storage; do not access DBs directly in handlers.
- Use cases encapsulate business logic; keep webhook handlers thin.

### Dashboard Patterns (dashboard/)

- Uses React 18, Vite, and Jest; keep test files near source.
- Imports should be sorted (simple-import-sort ESLint rule).
- Prefer `React.FC` only if existing file uses it; otherwise use function components.
- Keep GraphQL operations in the codegen flow; run `pnpm generate` if changed.

### Storefront Patterns (storefront/)

- Next.js App Router; keep server/client boundaries explicit.
- Use `next lint` rules; Tailwind is used for styling (prettier-plugin-tailwindcss).
- Keep GraphQL documents in the codegen flow; run `pnpm generate` if changed.

## Naming Conventions

- TypeScript: camelCase for variables/functions, PascalCase for components/types.
- Python: snake_case for functions/variables, PascalCase for classes.
- Filenames follow existing patterns in each package (do not rename unless asked).

## Imports

- Group imports by module type (external, internal, local) per ESLint/ruff rules.
- Avoid deep relative imports if the project uses path aliases.
- Keep side-effect imports at the top only when required.

## Error Handling

- Prefer explicit error types and structured error responses.
- Avoid swallowing exceptions; log and rethrow when appropriate.
- Use Result objects in apps where `neverthrow` is the pattern.

## Testing Guidance

- Add or update tests when behavior changes.
- Keep unit tests deterministic; avoid real network calls.
- Use existing mocks/fixtures instead of ad-hoc stubs.

## Changesets (apps/)

- Functional changes require a changeset: `pnpm changeset add`.
- Skip changesets for refactors without user-visible impact.

## Documentation Rules

- Do not create new docs unless the user asks.
- Update existing docs only when required by the change.

## When in Doubt

- Prefer the closest existing pattern in the directory you touch.
- Ask for clarification if a change might affect multiple packages.

## Post-Change Checklist

After completing any changes, verify:

1. **Docker Containers**: Determine which container(s) need restarting based on what changed
2. **Configuration Files**: If `storefront-control` schema/config changed:
   - [ ] Sample config files updated
   - [ ] UI inventory updated (if UI components affected)
   - [ ] Default values updated
   - [ ] Types updated
3. **Build/Lint**: Run appropriate lint/type-check commands for changed packages
4. **Documentation**: Update relevant docs only if structure/behavior significantly changed
