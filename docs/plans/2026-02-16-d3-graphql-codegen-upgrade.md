# Phase D3: GraphQL Codegen v2 → v5/v6 Upgrade

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade all `@graphql-codegen/*` packages from v2/v3 era to latest stable, verify generated output is unchanged or safely updated.

**Architecture:** Two-step upgrade. Step 1: conservative bump (cli v5, typescript/operations v4, react-apollo v4) — no output changes expected. Step 2: push to latest (cli v6, typescript/operations v5, fragment-matcher v6) — may change empty object types from `{}` to `Record<PropertyKey, never>`. Config format is backward-compatible — no codegen.ts changes needed.

**Tech Stack:** `@graphql-codegen/cli`, TypeScript, GraphQL 16, Apollo Client 3.14

---

## Current Versions → Target Versions

| Package | Current | Step 1 (conservative) | Step 2 (latest) |
|---------|---------|----------------------|-----------------|
| `@graphql-codegen/cli` | `^2.16.5` | `^5.0.7` | `^6.1.1` |
| `@graphql-codegen/fragment-matcher` | `^3.3.3` | `^5.0.2` | `^6.0.0` |
| `@graphql-codegen/import-types-preset` | `^2.2.6` | `^3.0.1` | `^3.0.1` (latest) |
| `@graphql-codegen/typescript` | `^2.8.8` | `^4.1.6` | `^5.0.7` |
| `@graphql-codegen/typescript-apollo-client-helpers` | `^2.2.6` | `^3.0.1` | `^3.0.1` (latest) |
| `@graphql-codegen/typescript-operations` | `^2.5.13` | `^4.6.1` | `^5.0.7` |
| `@graphql-codegen/typescript-react-apollo` | `^3.3.7` | `^4.4.0` | `^4.4.0` (latest) |

Notes:
- `import-types-preset`, `typescript-apollo-client-helpers`, `typescript-react-apollo` are community-maintained (same npm names, moved to community repo)
- Config format (`codegen-main.ts`, `codegen-staging.ts`) needs NO changes
- `graphql@16.11.0` and `typescript@5.8.3` are compatible with all versions
- CLI command `graphql-codegen` is unchanged

---

### Task 1: Create branch, bump all packages to Step 1 (conservative)

**Files:**
- Modify: `dashboard/package.json`

**Step 1: Create branch**

```bash
git checkout -b dashboard/d3-codegen dashboard/d2-apollo
```

**Step 2: Update package.json devDependencies**

```
"@graphql-codegen/cli": "^5.0.7",
"@graphql-codegen/fragment-matcher": "^5.0.2",
"@graphql-codegen/import-types-preset": "^3.0.1",
"@graphql-codegen/typescript": "^4.1.6",
"@graphql-codegen/typescript-apollo-client-helpers": "^3.0.1",
"@graphql-codegen/typescript-operations": "^4.6.1",
"@graphql-codegen/typescript-react-apollo": "^4.4.0",
```

**Step 3: pnpm install**

**Step 4: Run codegen — `pnpm generate`**

**Step 5: Diff generated files — expect NO changes**

**Step 6: Run type-check — expect 34 pre-existing errors only**

**Step 7: Commit**

---

### Task 2: Push to latest (Step 2 — cli v6, typescript v5, fragment-matcher v6)

**Files:**
- Modify: `dashboard/package.json`

**Step 1: Update remaining packages**

```
"@graphql-codegen/cli": "^6.1.1",
"@graphql-codegen/fragment-matcher": "^6.0.0",
"@graphql-codegen/typescript": "^5.0.7",
"@graphql-codegen/typescript-operations": "^5.0.7",
```

**Step 2: pnpm install**

**Step 3: Run codegen**

**Step 4: Diff generated files — check for `Record<PropertyKey, never>` changes**

If generated types changed, run type-check and fix any new errors.

**Step 5: Type-check**

**Step 6: Commit**

---

### Task 3: Final verification

**Step 1: Full type-check passes with 34 pre-existing errors only**

**Step 2: Dev server starts**

**Step 3: Commit if any additional fixes needed**
