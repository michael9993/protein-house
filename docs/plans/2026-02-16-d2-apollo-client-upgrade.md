# Phase D2: Apollo Client 3.4 → 3.14 Upgrade

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade `@apollo/client` from 3.4.17 to 3.14.0 (final 3.x) in the dashboard, fixing all compile-time breakage and easy deprecation fixes.

**Architecture:** Bump the package version, fix type errors that arise from 10 minor versions of changes, address the `connectToDevTools` deprecation, and handle the `GraphQLError` → `GraphQLFormattedError` type change. Leave pervasive deprecation warnings (892 `onCompleted`/`onError` in useQuery) as-is — those are 4.0 prep work, not D2 scope.

**Tech Stack:** `@apollo/client@3.14.0`, TypeScript, GraphQL

---

## Pre-Upgrade Audit Summary

**Current state:** `@apollo/client@3.4.17` (Jan 2023, 3 years behind)

**Key patterns in dashboard:**
- 217 files import from `@apollo/client`
- Custom wrappers: `makeQuery.ts` (useQuery + loadMore), `makeMutation.ts` (useMutation + error handling), `makeSearch.ts`
- `fetchMore` with deprecated `updateQuery` callback in `makeQuery.ts:125`
- `ObservableQuery.updateQuery()` used in `VoucherDetails.tsx:193`
- `connectToDevTools` in `client.ts:51` (deprecated in 3.11)
- `GraphQLError` type used in `auth/errors.ts` (type changed in 3.11)
- `apollo-upload-client@^17.0.0` — compatible with Apollo 3.14 (peer dep `^3.8.0`)
- Codegen: `@graphql-codegen/typescript-react-apollo@^3.3.7` generates hooks importing from `@dashboard/hooks/graphql`
- No usage of removed entry points (`@apollo/client/react/context`, `@apollo/client/react/hooks`)
- No `previousData`, `canonizeResults`, `partialRefetch`, or `Cache.ReadOptions` generic usage

**Breaking changes 3.4 → 3.14:**
| Version | Change | Dashboard Impact |
|---------|--------|-----------------|
| 3.5 | `useLazyQuery` returns Promise (was void) | Low — re-exported, callers don't type-check return |
| 3.5 | `onCompleted` timing change (fires before re-render) | Silent behavioral — monitor at runtime |
| 3.8 | `Cache.ReadOptions` generic flip | None — not used |
| 3.9 | Removed `@apollo/client/react/context` + `react/hooks` | None — not imported |
| 3.9 | Default `Accept` header change | Low — Saleor API handles both |
| 3.11 | `connectToDevTools` deprecated → `devtools` | Fix in this phase |
| 3.11 | `GraphQLError` → `GraphQLFormattedError` in ApolloError | Fix in this phase |
| 3.13 | `onCompleted`/`onError` on useQuery deprecated | Not fixing — 892 occurrences, 4.0 prep |
| 3.13 | `fetchMore` updateQuery deprecated | Not fixing — still works, loadMore pattern |

---

### Task 1: Create branch and bump version

**Files:**
- Modify: `dashboard/package.json`

**Step 1: Create branch**

```bash
git checkout -b dashboard/d2-apollo dashboard/d1-moment
```

**Step 2: Update package.json**

Change `@apollo/client` from `"3.4.17"` to `"3.14.0"`.

**Step 3: Install dependencies**

```bash
docker exec -it saleor-dashboard-dev pnpm install
```

**Step 4: Commit lockfile + package.json**

```bash
git add dashboard/package.json dashboard/pnpm-lock.yaml
git commit -m "chore(dashboard): bump @apollo/client 3.4.17 → 3.14.0"
```

---

### Task 2: Fix `connectToDevTools` deprecation

**Files:**
- Modify: `dashboard/src/graphql/client.ts:51`

**Step 1: Replace deprecated option**

Change:
```typescript
connectToDevTools: process.env.NODE_ENV === "development",
```
To:
```typescript
devtools: {
  enabled: process.env.NODE_ENV === "development",
},
```

**Step 2: Commit**

```bash
git add dashboard/src/graphql/client.ts
git commit -m "fix(dashboard): replace connectToDevTools with devtools option"
```

---

### Task 3: Fix `GraphQLError` → `GraphQLFormattedError` type

**Files:**
- Modify: `dashboard/src/auth/errors.ts`

In Apollo 3.11+, `ApolloError.graphQLErrors` returns `ReadonlyArray<GraphQLFormattedError>` instead of `ReadonlyArray<GraphQLError>`. Functions that accept `GraphQLError` but receive values from `ApolloError.graphQLErrors` need updating.

**Step 1: Check if `GraphQLFormattedError` is available**

The `GraphQLFormattedError` type comes from the `graphql` package (already at 16.11.0).

**Step 2: Update type imports in `auth/errors.ts`**

Change:
```typescript
import { GraphQLError } from "graphql";
```
To:
```typescript
import { GraphQLFormattedError } from "graphql";
```

Update all function signatures:
- `isJwtError(error: GraphQLError)` → `isJwtError(error: GraphQLFormattedError)`
- `isTokenExpired(error: GraphQLError)` → `isTokenExpired(error: GraphQLFormattedError)`
- `getAuthErrorType(graphQLError: GraphQLError)` → `getAuthErrorType(graphQLError: GraphQLFormattedError)`

**Step 3: Check for other files that pass `graphQLErrors` items to typed functions**

Search for callers of `isJwtError`, `isTokenExpired`, `getAuthErrorType` and verify they still type-check.

**Step 4: Commit**

```bash
git add dashboard/src/auth/errors.ts
git commit -m "fix(dashboard): update GraphQLError → GraphQLFormattedError for Apollo 3.11+"
```

---

### Task 4: Run type-check and fix any remaining breakage

**Step 1: Run type-check**

```bash
docker exec saleor-dashboard-dev pnpm check-types 2>&1 | grep "error TS" | head -50
```

**Step 2: Fix any new type errors**

Common things that might surface:
- `useLazyQuery` return type now includes Promise (unlikely to break since we re-export as-is)
- Type inference changes in query/mutation results
- `err.graphQLErrors` element type changes in `makeMutation.ts` line 68

**Step 3: Iterate until type-check passes (with only pre-existing errors)**

Compare error list against baseline from D1 (pre-existing errors in `reviews/`, `products/`, `MenuItemDialog`, `useRichText`).

**Step 4: Commit any additional fixes**

```bash
git add -u dashboard/src/
git commit -m "fix(dashboard): resolve remaining type errors from Apollo 3.14 upgrade"
```

---

### Task 5: Regenerate GraphQL types (verify codegen compatibility)

**Step 1: Run codegen to verify it still works**

```bash
docker exec saleor-dashboard-dev pnpm generate
```

If codegen fails, it may be due to `@graphql-codegen/typescript-react-apollo@^3.3.7` being incompatible with Apollo 3.14 types. In that case, upgrade the codegen plugin.

**Step 2: Check for type changes in generated files**

```bash
git diff dashboard/src/graphql/*.generated.ts
```

If no diff, codegen is compatible. If there are diffs, review them for correctness.

**Step 3: Commit if generated files changed**

```bash
git add dashboard/src/graphql/*.generated.ts
git commit -m "chore(dashboard): regenerate GraphQL types for Apollo 3.14"
```

---

### Task 6: Final verification and squash commit

**Step 1: Full verification**

```bash
docker exec saleor-dashboard-dev pnpm check-types 2>&1 | grep "error TS" | grep -v "reviews\|ProductCreatePage\|ProductUpdatePage\|ProductVariantCreatePage\|ProductVariantPage\|MenuItemDialog\|useRichText"
```

Zero new errors = success.

**Step 2: Verify dev server starts**

```bash
docker compose -f infra/docker-compose.dev.yml restart saleor-dashboard-dev
docker compose -f infra/docker-compose.dev.yml logs --tail=30 saleor-dashboard-dev
```

Look for successful Vite dev server startup.

---

## Scope Boundaries

**IN scope (D2):**
- Bump `@apollo/client` 3.4.17 → 3.14.0
- Fix `connectToDevTools` deprecation
- Fix `GraphQLError` → `GraphQLFormattedError` type
- Fix any compile-time type errors

**OUT of scope (future work):**
- Replacing `onCompleted`/`onError` on `useQuery` (deprecated in 3.13, 892 occurrences — 4.0 prep)
- Replacing `fetchMore` `updateQuery` callback (deprecated, still works)
- Replacing `ObservableQuery.updateQuery()` in VoucherDetails (deprecated, still works)
- Apollo Client 4.0 migration
- Codegen upgrade (unless forced by compatibility)
