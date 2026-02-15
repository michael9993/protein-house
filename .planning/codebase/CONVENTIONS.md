# Coding Conventions

**Analysis Date:** 2026-02-15

## Naming Patterns

**Files:**
- TypeScript/React: camelCase for components and utilities, kebab-case for GraphQL files
  - React components: `HomePage.tsx`, `ProductCard.tsx`
  - Utilities: `graphql.ts`, `cms.ts`, `preview-mode.ts`
  - GraphQL operations: `HomepageProducts.graphql` (kebab-case preferred)
  - Tests: `*.test.ts`, `*.test.tsx`, `*.spec.ts` (E2E)
- Python: snake_case for all Python files and modules
  - Models: `models.py`, `tasks.py`
  - Services: `notifications.py`, `search.py`, `utils.py`
  - Tests: `test_*.py`

**Functions:**
- TypeScript: camelCase for all functions (exported and internal)
  - Hooks: `useStoreConfig()`, `useConfigSection()`, `useRtlLocale()`
  - Utility functions: `executeGraphQL()`, `isRtlLocale()`, `getThemeCSSVariables()`
  - Event handlers: `handleConfigUpdate()`, `handleChange()`
- Python: snake_case for all functions
  - Task functions: `trigger_send_password_reset_notification()`
  - Helper functions: `_prepare_redirect_url()` (leading underscore for private)

**Variables:**
- TypeScript: camelCase, avoid `_` prefix except for intentionally unused parameters
  - Unused parameters: `_param` (prefixed underscore)
  - Constants: camelCase or UPPER_CASE (both used depending on context)
  - React state: `const [config, setConfig] = useState()`
  - Configuration objects: `storeConfig`, `cssVariables`, `brandGridConfig`
- Python: snake_case throughout
  - Constants: UPPER_CASE (e.g., `TEST_DATABASES`)
  - Private variables: `_private_var`
  - Configuration: `default_shipping_address_pk`, `user_default_shipping_address_pk`

**Types:**
- TypeScript: PascalCase for all types, interfaces, and classes
  - Interfaces: `StoreConfigProviderProps`, `DialogProps`, `IAppConfig`
  - Type aliases: `GraphQLErrorResponse`, `GetConfigForChannelResult`, `ConfigPerChannelErrors`
  - Classes: `AppConfig`, `Address`, `BaseError`
  - Enums: `ListViews`, `AccountPermissions`
- Python: PascalCase for classes
  - Models: `Address`, `User`, `Order`
  - Custom exceptions: `ValidationError`, `InvalidChannelSlugError`

## Code Style

**Formatting:**
- **All TypeScript/JavaScript**: Prettier with shared config
  - Print width: Dashboard 100, Storefront 110, Apps (per-app config)
  - Quotes: double quotes throughout
  - Trailing commas: all
  - Arrow function parens: avoid (`(x) => x` becomes `x => x`)
  - Tabs: Storefront uses tabs; Dashboard uses spaces
- **Python**: Black-style (4 spaces, 88 columns implicit via Ruff)

**Linting:**
- **TypeScript/React/Next.js**: ESLint with flat config (eslint.config.mjs/js)
  - Dashboard: Custom ESLint config with formatjs, simple-import-sort, unused-imports, unicorn
  - Storefront: Strict config with import ordering, no-default-export, type imports
  - Apps: Shared `@saleor/eslint-config-apps` extended per-app with custom overrides
  - Key rules: `simple-import-sort/imports` enforced, `no-default-export` (except page routes), `no-console` (allow warn/error only)
  - GraphQL: `@graphql-eslint` with no-anonymous-operations, no-duplicate-fields, no-deprecated checks
- **Python**: Ruff (multiple rule sets)
  - Selected rules: ASYNC, B, C4, D, DTZ, E, F, FURB, G, I, ISC001/ISC002, LOG, PGH, PIE, PT, PYI, RET, T20, UP, W
  - Ignored: D10x (docstring), D20x (blank lines), D407, E501 (line length), PT019 (fixtures), etc.
  - Import sorting: isort plugin configured
- **Mypy**: Type checking enforced with django-stubs plugin
  - Migrations excluded from checking
  - Untyped globals allowed but functions require type hints
  - Ignore missing imports allowed

## Import Organization

**TypeScript/JavaScript:**
1. External packages (React, Next.js, third-party libraries)
2. Type imports from external packages (`import type { X }`)
3. Internal absolute imports (using path aliases like `@/`, `@dashboard/`, `@saleor/`)
4. Relative imports (last)
5. Grouped by: imports → types → exports
6. Simple-import-sort rule enforces this automatically

**Order example from `StoreConfigProvider.tsx`:**
```typescript
import React, { createContext, useContext, useEffect, useMemo } from "react";
import { StoreConfig, getThemeCSSVariables, storeConfig, DEFAULT_RTL_LOCALES, ANIMATION_PRESETS } from "@/config";
import { initPreviewMode } from "@/lib/preview-mode";
import type {
  TrustStripConfig,
  BrandGridConfig,
  // ... more types
} from "@saleor/apps-storefront-config";
```

**Path Aliases:**
- Storefront: `@/` → `src/`, configured in `tsconfig.json` and Prettier tailwindcss plugin
- Dashboard: `@dashboard/` → `src/`
- Apps: `@saleor/` for shared packages, workspace-relative paths
- Checkout (separate): Cannot import from Next.js packages (enforced ESLint rule)

**Python:**
1. Standard library
2. Third-party packages (Django, GraphQL, etc.)
3. Internal imports (from saleor modules)
4. Grouped with blank lines between groups
5. isort enforces ordering automatically

## Error Handling

**TypeScript/JavaScript:**

**Apps (neverthrow pattern):**
- Use `Result<Success, Error>` pattern from `neverthrow` library
- Never throw exceptions in public functions; return `Result`
- Error handling example from `app-config.ts`:
```typescript
import { err, ok, Result } from "neverthrow";
import { BaseError } from "../error";

class AppConfig {
  static InvalidChannelSlugError = BaseError.subclass("InvalidChannelSlugError", {});

  getConfigForChannelSlug(slug: string): Result<Config, InvalidChannelSlugError> {
    if (!found) {
      return err(new AppConfig.InvalidChannelSlugError("message", {
        props: { channelSlug: slug }
      }));
    }
    return ok(config);
  }
}

// Usage:
const result = config.getConfigForChannelSlug("default");
result
  .map(cfg => console.log(cfg))
  .mapErr(err => console.error(err));

// Testing:
expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppConfig.InvalidChannelSlugError);
```
- Error classes created via `BaseError.subclass()` (from `@saleor/apps-errors`)
- All custom errors include `props` object for context

**Storefront (Next.js):**
- Server actions throw errors which are caught and returned as `{ success: false, error: message }`
- `invariant()` from `ts-invariant` for critical preconditions (e.g., missing env vars)
- GraphQL errors captured in response object with retry logic
- No custom error classes; use native `Error` or specific GraphQL error types

**Dashboard:**
- Apollo Client handles GraphQL errors automatically
- Event handlers wrapped in try-catch for async operations
- User-facing errors displayed via toast notifications

**Python (Saleor):**
- Raise Django exceptions (`ValidationError`, `PermissionDenied`) for validation
- Use logging for warnings/errors in tasks (`logger.warning()`)
- Celery tasks use `cast()` for type safety after database queries
- Custom exception classes inherit from Django exceptions
- No try-catch in tasks; let errors propagate and Celery retries handle

## Logging

**Framework:**
- TypeScript: `console.log()` / `console.error()` / `console.warn()`
  - Dashboard: console restricted (no-console rule); only warn/error allowed
  - Storefront: Custom logging per GraphQL request (verbose flag in env)
  - Apps: Logger from `@saleor/apps-logger` in some apps
- Python: `logging.getLogger(__name__)` for all modules
  - Creates module-specific logger: `logger = logging.getLogger(__name__)`
  - Used in tasks and services

**Patterns:**
- **TypeScript**: Log only when explicitly needed; avoid noise
  - GraphQL URL logging: only if `NODE_ENV === 'development'` and `GRAPHQL_VERBOSE_LOGGING=true`
  - Event updates: `window.addEventListener('storefront-config-updated', handleUpdate)`
- **Python**: Log warnings/errors during critical operations
  - Task execution: `logger.warning("Channel slug was not provided for user %s", user_pk)`
  - Context: Include IDs and relevant data for debugging

## Comments

**When to Comment:**
- TypeScript/JavaScript:
  - Explain WHY, not WHAT. Code should be self-documenting.
  - Document complex logic: "Apply all DOM mutations in a single effect to batch into one paint cycle"
  - Mark FOUC prevention: "Note: Initial direction is set server-side to prevent FOUC"
  - Warn about gotchas: "Hot-reload does NOT work reliably in this Docker setup"
  - Section headers for large functions: `// --- CSS Variables ---`, `// --- Direction ---`
- Python: Similar — explain non-obvious logic, not implementation details

**JSDoc/TSDoc:**
- Not widely used in this codebase; prefer clear function names and type signatures
- When used, provide parameter descriptions and return types
- Example minimal pattern (rarely seen):
```typescript
/**
 * Detects RTL locale from language code
 */
function isRtlLocale(locale: string | undefined, rtlLocales: string[] = DEFAULT_RTL_LOCALES): boolean {
```

## Function Design

**Size:**
- Keep functions small and focused (under 50 lines for complex logic)
- Large provider components acceptable if they manage lifecycle (e.g., `StoreConfigProvider.tsx` 1,975 lines)
- Split long functions into descriptive helper functions

**Parameters:**
- Use object parameters for multiple arguments (avoid parameter tuples)
- Example from `executeGraphQL()`:
```typescript
async function executeGraphQL<Result, Variables>(
  operation: TypedDocumentString<Result, Variables>,
  options: {
    headers?: HeadersInit;
    cache?: RequestCache;
    revalidate?: number;
    withAuth?: boolean;
  } & (Variables extends Record<string, never> ? { variables?: never } : { variables: Variables }),
): Promise<Result>
```
- Optional parameters suffix with `?`
- Python: Type hints required for public functions

**Return Values:**
- Explicit return types on exported functions (ESLint `@typescript-eslint/explicit-function-return-type` rule)
- Use `| null` or `| undefined` explicitly, not implicit
- `Result<T, E>` in apps for error handling (never throw)
- Python: Type hints in function signature

## Module Design

**Exports:**
- TypeScript: Named exports preferred (enforced in Dashboard/Storefront)
  - Default exports only for: page/layout/error/loading components in Next.js, Storybook stories
  - Use `export const Component = () => {}`
- Python: All public functions and classes exported from `__init__.py` in packages

**Barrel Files:**
- Storefront: Minimal use; mostly direct imports
- Apps: Some packages have `index.ts` re-exporting from modules
- Example: `apps/packages/storefront-config/src/index.ts` exports `StoreConfig`, `migrations`, types

**Code Organization in Apps:**
- Pattern: `src/modules/[domain]/` structure
- Each module has clear responsibility (avatax config, channel config, etc.)
- Services/utilities in `lib/` directory
- Tests colocated with source (`*.test.ts` next to `*.ts`)

---

*Convention analysis: 2026-02-15*
