# Phase D4: Jest 27 → Vitest — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Jest 27 with Vitest 3.x as the dashboard test runner, update @testing-library packages to latest, and remove all Jest-specific dependencies.

**Architecture:** Vitest shares Vite's transform pipeline (already the build tool), so module resolution, aliases, and transpilation are unified. We use `globals: true` to minimize code changes (describe/it/expect stay global). The codemod handles 90% of mechanical `jest.*` → `vi.*` replacements; remaining manual fixes target 3 files with `done` callbacks, 1 file with `waitForNextUpdate`, 20 files with `jest.requireActual`, and the react-intl mock.

**Tech Stack:** Vitest 3.x, @testing-library/react 16, @testing-library/jest-dom 6, jsdom

---

## Inventory

| Category | Count | Notes |
|----------|-------|-------|
| Test files | 348 | `*.test.ts` + `*.test.tsx` in `src/` |
| Files using `jest.*` API | 165 | `jest.fn`, `jest.mock`, `jest.spyOn`, etc. |
| Files importing `@testing-library/react-hooks` | 102 | Need to switch to `@testing-library/react` |
| Files using `jest.requireActual` | 20 | Must change to `await vi.importActual()` — requires `async` factory |
| Files using `jest.Mock` type | ~34 occurrences across 10 files | Change to `Mock` from vitest or use `vi.fn()` |
| Files with `done` callback | 2 | `multiFileUploadHandler.test.ts`, `BackgroundTasksProvider.test.tsx` |
| Files with `waitForNextUpdate` | 1 | `useAppStoreExtensions.test.ts` |
| Files importing from `react-dom/test-utils` | 3 | Must import `act` from `@testing-library/react` |
| Snapshot files | 14 | Must regenerate all after migration |
| `__mocks__/` directories | 3 | Root `__mocks__/react-intl.ts` + 2 component mocks |

## Packages to Remove

```
jest, @types/jest, @swc/jest, ts-jest, jest-environment-jsdom,
jest-canvas-mock, jest-localstorage-mock, jest-file, identity-obj-proxy,
setup-polly-jest, @testing-library/react-hooks
```

## Packages to Add

```
vitest, @vitest/coverage-v8, jsdom (explicit peer),
@testing-library/react@16, @testing-library/jest-dom@6, @testing-library/dom
```

## Packages to Keep (unchanged)

```
@testing-library/user-event@14 (already current)
```

---

### Task 1: Create branch and install Vitest

**Files:**
- Modify: `dashboard/package.json`

**Step 1: Create branch**

```bash
cd /c/Users/micha/saleor-platform
git checkout dashboard/d3-codegen
git checkout -b dashboard/d4-vitest
```

**Step 2: Update package.json**

In `dashboard/package.json`, make these changes to `devDependencies`:

Remove:
```
"@testing-library/react": "^12.1.5",
"@testing-library/react-hooks": "^8.0.1",
"@testing-library/jest-dom": "^5.17.0",
"@types/jest": "^27.0.2",
"@swc/jest": "^0.2.39",
"identity-obj-proxy": "^3.0.0",
"jest": "^27.5.1",
"jest-canvas-mock": "^2.5.2",
"jest-environment-jsdom": "^27.5.1",
"jest-file": "^1.0.0",
"jest-localstorage-mock": "^2.4.26",
"setup-polly-jest": "^0.9.1",
"ts-jest": "^27.1.5",
```

Add:
```
"vitest": "^3.1.1",
"@vitest/coverage-v8": "^3.1.1",
"jsdom": "^25.0.0",
"@testing-library/react": "^16.3.0",
"@testing-library/jest-dom": "^6.6.3",
"@testing-library/dom": "^10.4.0",
```

Keep unchanged:
```
"@testing-library/user-event": "^14.6.1",
```

**Step 3: Install inside container**

```bash
docker exec saleor-dashboard-dev pnpm install --no-frozen-lockfile
```

**Step 4: Commit**

```bash
git add dashboard/package.json dashboard/pnpm-lock.yaml
git commit -m "chore(dashboard): swap jest for vitest and update testing-library packages"
```

---

### Task 2: Create Vitest config and setup file

**Files:**
- Create: `dashboard/vitest.config.ts`
- Modify: `dashboard/testUtils/setup.ts` → convert to Vitest
- Modify: `dashboard/tsconfig.json` → add `vitest/globals` types

**Step 1: Create `dashboard/vitest.config.ts`**

This replaces `jest.config.js`. It merges with the existing `vite.config.js` for aliases.

```typescript
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "./assets"),
      "@locale": path.resolve(__dirname, "./locale"),
      "@dashboard": path.resolve(__dirname, "./src"),
      "@test": path.resolve(__dirname, "./testUtils"),
      // Force resolution for hoisted packages
      "react-intl": path.resolve(__dirname, "./__mocks__/react-intl.ts"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    root: "./src",
    setupFiles: ["../testUtils/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    // Match Jest's resetMocks: false behavior
    mockReset: false,
    clearMocks: false,
    restoreMocks: false,
    // CSS imports should not error
    css: false,
    // Timezone
    env: {
      TZ: "UTC",
    },
    // Transform ESM packages that need it
    server: {
      deps: {
        inline: ["chroma-js", "zod", "popper.js"],
      },
    },
    // Snapshot serializer settings
    snapshotSerializerOptions: {
      printBasicPrototype: false,
    },
  },
  define: {
    FLAGS_SERVICE_ENABLED: false,
    FLAGS: JSON.stringify({}),
  },
});
```

**Step 2: Rewrite `dashboard/testUtils/setup.ts` for Vitest**

Replace the full file with:

```typescript
import "@testing-library/jest-dom/vitest";

import { configure } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@sentry/react");
vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
  useHotkeysContext: vi.fn(),
  HotkeysProvider: ({ children }: { children: React.ReactNode }) => children,
}));

document.getElementById = () => document.createElement("div");

// workaround for `jsdom`
// https://github.com/jsdom/jsdom/issues/3002
document.createRange = () => {
  const range = new Range();

  range.getBoundingClientRect = vi.fn();

  range.getClientRects = () => ({
    item: () => null,
    length: 0,
    [Symbol.iterator]: vi.fn(),
  });

  return range;
};

window.__SALEOR_CONFIG__ = {
  API_URL: "http://localhost:8000/graphql/",
  APP_MOUNT_URI: "/",
  APPS_MARKETPLACE_API_URL: "http://localhost:3000",
  EXTENSIONS_API_URL: "http://localhost:3000",
  APPS_TUNNEL_URL_KEYWORDS: ".ngrok.io;.saleor.live",
  IS_CLOUD_INSTANCE: "true",
  LOCALE_CODE: "EN",
};

process.env.TZ = "UTC";

configure({ testIdAttribute: "data-test-id" });

/**
 * Fixes "TextEncoder is not defined" error in jsdom
 */
import { TextDecoder, TextEncoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

global.CSS = {
  supports: () => false,
} as any;

/**
 * Fixes "crypto is not defined" error in jsdom
 */
import nodeCrypto from "crypto";

global.crypto = {
  getRandomValues: function (buffer: any) {
    return nodeCrypto.randomFillSync(buffer);
  },
  subtle: {} as SubtleCrypto,
  randomUUID: () => nodeCrypto.randomUUID(),
};
```

**Step 3: Add vitest types to `dashboard/tsconfig.json`**

Add `"vitest/globals"` to compilerOptions.types:

```json
{
  "compilerOptions": {
    ...existing...,
    "types": ["vitest/globals"]
  }
}
```

**Step 4: Update package.json scripts**

Replace in `dashboard/package.json`:

```json
"test": "vitest run",
"test:ci": "CI=true vitest run --coverage --silent",
"test:debug": "DEBUG_PRINT_LIMIT=20000 vitest run",
"test:quiet": "vitest run --silent",
"test:watch": "vitest"
```

**Step 5: Commit**

```bash
git add dashboard/vitest.config.ts dashboard/testUtils/setup.ts dashboard/tsconfig.json dashboard/package.json
git commit -m "chore(dashboard): add vitest config, convert setup to vitest"
```

---

### Task 3: Convert react-intl mock from Jest to Vitest

**Files:**
- Modify: `dashboard/__mocks__/react-intl.ts`

The mock currently uses `jest.fn()` which must become `vi.fn()`. But since `__mocks__/` auto-loading doesn't work in Vitest, we handle this via `resolve.alias` in vitest.config.ts (already done in Task 2).

**Step 1: Rewrite the mock**

Replace all `jest.fn()` with `vi.fn()` in `dashboard/__mocks__/react-intl.ts`:

```typescript
import { createElement, Fragment } from "react";
import { vi } from "vitest";

const useIntl = vi.fn(() => ({
  formatMessage: vi.fn(x => x.defaultMessage),
  formatDate: vi.fn(x => x),
  formatTime: vi.fn(x => x),
  formatNumber: vi.fn(x => x),
  locale: "en",
}));

const defineMessages = vi.fn(x => x);
const defineMessage = vi.fn(x => x);

const FormattedMessage = vi.fn(({ defaultMessage }: { defaultMessage: string }) =>
  createElement(Fragment, null, defaultMessage),
);

const IntlProvider = ({ children }: { children: React.ReactNode }) =>
  createElement(Fragment, null, children);

const createIntl = vi.fn(() => ({
  formatMessage: vi.fn(x => x.defaultMessage),
  formatDate: vi.fn(x => x),
  formatTime: vi.fn(x => x),
  formatNumber: vi.fn(x => x),
  locale: "en",
}));

const FormattedDate = ({ value }: { value: any }) => createElement(Fragment, null, value);

export {
  useIntl,
  defineMessages,
  defineMessage,
  FormattedMessage,
  IntlProvider,
  createIntl,
  FormattedDate,
};

// Export types for TypeScript
export type {
  IntlShape,
  MessageDescriptor,
  FormattedMessageProps,
  ReactIntlErrorCode,
} from "react-intl";
```

**Step 2: Commit**

```bash
git add dashboard/__mocks__/react-intl.ts
git commit -m "chore(dashboard): convert react-intl mock from jest to vitest"
```

---

### Task 4: Run codemod on all test files

**Files:**
- Modify: ~165 test files with `jest.*` API calls

**Step 1: Run the codemod**

The codemod replaces `jest.fn()` → `vi.fn()`, `jest.mock()` → `vi.mock()`, `jest.spyOn()` → `vi.spyOn()`, and adds vitest imports.

Since we use `globals: true`, we don't need `describe`/`it`/`expect` imports. The codemod may add them — we can strip those later. The key transformation is the `jest.*` → `vi.*` namespace change.

**Important**: Since this is running inside Docker and the codemod is an npx command, we may need to run it on the host or use a script approach. If the codemod is unavailable, use `sed`/`find-and-replace` as fallback:

```bash
# Inside container, use find + sed for bulk replacement
docker exec saleor-dashboard-dev sh -c '
  cd /app && find src -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i \
    -e "s/jest\.fn/vi.fn/g" \
    -e "s/jest\.mock/vi.mock/g" \
    -e "s/jest\.spyOn/vi.spyOn/g" \
    -e "s/jest\.clearAllMocks/vi.clearAllMocks/g" \
    -e "s/jest\.resetAllMocks/vi.resetAllMocks/g" \
    -e "s/jest\.restoreAllMocks/vi.restoreAllMocks/g" \
    -e "s/jest\.useFakeTimers/vi.useFakeTimers/g" \
    -e "s/jest\.useRealTimers/vi.useRealTimers/g" \
    -e "s/jest\.advanceTimersByTime/vi.advanceTimersByTime/g" \
    -e "s/jest\.runAllTimers/vi.runAllTimers/g" \
    -e "s/jest\.runOnlyPendingTimers/vi.runOnlyPendingTimers/g"
'
```

Also replace in non-test files that use jest API (testUtils, __mocks__):

```bash
docker exec saleor-dashboard-dev sh -c '
  cd /app && find testUtils __mocks__ src -name "*.ts" -o -name "*.tsx" | \
  grep -v node_modules | xargs sed -i \
    -e "s/jest\.fn/vi.fn/g" \
    -e "s/jest\.mock/vi.mock/g" \
    -e "s/jest\.spyOn/vi.spyOn/g"
'
```

**Step 2: Add `vi` import to files that use it**

Files that call `vi.fn()`, `vi.mock()`, etc. need `import { vi } from "vitest"` at the top. With `globals: true`, `vi` is available as a global, but having the explicit import helps TypeScript and is recommended.

However, since we set `"types": ["vitest/globals"]` in tsconfig.json, `vi` will be typed as a global. We can skip adding imports — the global declaration is sufficient.

**Step 3: Handle `jest.requireActual` → `vi.importActual` (20 files)**

This is the tricky one. `jest.requireActual()` is synchronous, but `vi.importActual()` is async. The mock factory must become async:

```typescript
// BEFORE:
jest.mock("@dashboard/graphql", () => {
  const actualModule = jest.requireActual("@dashboard/graphql");
  return { ...actualModule, useUserDetailsQuery: jest.fn() };
});

// AFTER:
vi.mock("@dashboard/graphql", async () => {
  const actualModule = await vi.importActual("@dashboard/graphql");
  return { ...actualModule, useUserDetailsQuery: vi.fn() };
});
```

The 20 files using `jest.requireActual` need this `async`/`await` wrapping manually. The sed replacement is:
- `jest.requireActual` → `await vi.importActual`
- The containing `jest.mock` factory `() => {` must become `async () => {`

**Step 4: Handle `jest.Mock` type (10 files)**

Replace `as jest.Mock` with `as ReturnType<typeof vi.fn>` or `as Mock` (import from vitest):

```bash
# Simple replacement
sed -i 's/as jest\.Mock/as Mock/g' files...
sed -i 's/jest\.Mock/Mock/g' files...
```

Files using `jest.Mock` need `import { Mock } from "vitest"` or `import type { Mock } from "vitest"`.

**Step 5: Commit**

```bash
git add -A dashboard/src/ dashboard/testUtils/ dashboard/__mocks__/
git commit -m "chore(dashboard): codemod jest.* → vi.* across 165 test files"
```

---

### Task 5: Migrate @testing-library/react-hooks imports (102 files)

**Files:**
- Modify: 102 files importing from `@testing-library/react-hooks`

**Step 1: Bulk replacement**

```bash
docker exec saleor-dashboard-dev sh -c '
  cd /app && find src -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i \
    "s|from \"@testing-library/react-hooks\"|from \"@testing-library/react\"|g"
'
```

**Step 2: Fix `waitForNextUpdate` (1 file)**

In `dashboard/src/extensions/views/ExploreExtensions/hooks/useAppStoreExtensions.test.ts`:

```typescript
// BEFORE:
const { result, waitForNextUpdate } = renderHook(() =>
  useAppStoreExtensions("https://mockapi.com"),
);
await waitForNextUpdate();
expect(result.current.loading).toBe(false);

// AFTER:
const { result } = renderHook(() =>
  useAppStoreExtensions("https://mockapi.com"),
);
await waitFor(() => {
  expect(result.current.loading).toBe(false);
});
```

Make sure `waitFor` is imported from `@testing-library/react`.

**Step 3: Fix `react-dom/test-utils` imports (3 files)**

Replace `import { act } from "react-dom/test-utils"` with `import { act } from "@testing-library/react"` (or just use the re-exported `act` from `@testing-library/react`).

**Step 4: Commit**

```bash
git add -A dashboard/src/
git commit -m "chore(dashboard): migrate @testing-library/react-hooks → @testing-library/react"
```

---

### Task 6: Fix `done` callback tests (2 files)

**Files:**
- Modify: `dashboard/src/utils/handlers/multiFileUploadHandler.test.ts`
- Modify: `dashboard/src/containers/BackgroundTasks/BackgroundTasksProvider.test.tsx`

Vitest does not support `done` callbacks. Convert to async/await or Promise:

**Step 1: Fix `multiFileUploadHandler.test.ts`**

```typescript
// BEFORE:
it("properly handles success", done => {
  // ... setup ...
  multiFileUploadHandler(...).then(() => {
    expect(cbs.onError).toBeCalledTimes(0);
    done();
  });
});

// AFTER:
it("properly handles success", async () => {
  // ... setup ...
  await multiFileUploadHandler(...);
  expect(cbs.onError).toBeCalledTimes(0);
});
```

**Step 2: Fix `BackgroundTasksProvider.test.tsx`**

Same pattern — convert `done` callbacks to `async`/`await`:

```typescript
// BEFORE:
it("can queue a task", done => {
  // ... setup ...
  // assertions
  done();
});

// AFTER:
it("can queue a task", async () => {
  // ... setup ...
  // assertions
});
```

For tests that use `done` inside a `.then()` chain, wrap the full body in async/await.

**Step 3: Commit**

```bash
git add dashboard/src/utils/handlers/multiFileUploadHandler.test.ts dashboard/src/containers/BackgroundTasks/BackgroundTasksProvider.test.tsx
git commit -m "chore(dashboard): convert done callbacks to async/await"
```

---

### Task 7: Delete Jest config and regenerate snapshots

**Files:**
- Delete: `dashboard/jest.config.js`
- Delete: `dashboard/testUtils/globalSetup.ts` (functionality moved to vitest.config.ts env.TZ)
- Regenerate: 14 snapshot files

**Step 1: Delete jest.config.js**

```bash
rm dashboard/jest.config.js
rm dashboard/testUtils/globalSetup.ts
```

**Step 2: Run tests and update snapshots**

```bash
docker exec saleor-dashboard-dev pnpm test -- --update
```

This will run all tests and regenerate any failing snapshots.

**Step 3: Fix any remaining failures**

Common issues to watch for:
- Mock factory return values needing explicit `{ default: ... }` wrapper
- `mockReset` behavioral differences (Vitest restores original, Jest replaces with empty fn)
- Timer-related tests needing `vi.useFakeTimers()`/`vi.useRealTimers()` adjustments
- Tests relying on `__mocks__/` auto-loading (must add explicit `vi.mock()` calls)

**Step 4: Commit**

```bash
git add -A dashboard/
git commit -m "chore(dashboard): remove jest config, regenerate snapshots for vitest"
```

---

### Task 8: Final verification

**Step 1: Type check**

```bash
docker exec saleor-dashboard-dev pnpm check-types 2>&1 | grep "error TS" | sort > /tmp/d4-errors.txt
wc -l /tmp/d4-errors.txt
diff /tmp/d3-step2-errors.txt /tmp/d4-errors.txt
```

Expected: 34 errors (baseline) — no new errors. There may be a few type changes from `@types/jest` removal.

**Step 2: Full test suite**

```bash
docker exec saleor-dashboard-dev pnpm test
```

Expected: All 348 test files pass.

**Step 3: Build**

```bash
docker exec saleor-dashboard-dev pnpm build
```

Expected: Build succeeds (tests don't affect build, but verify no import side effects).

**Step 4: Commit if any fixes were needed**

```bash
git add -A dashboard/
git commit -m "chore(dashboard): fix remaining vitest migration issues"
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `jest.requireActual` → `vi.importActual` async mismatch | Medium | Medium | 20 files — manual async factory wrapping |
| `__mocks__/` auto-loading not working | Medium | Low | react-intl handled via resolve.alias; component mocks need explicit vi.mock() |
| `mockReset` semantic difference | Low | Medium | Dashboard uses `resetMocks: false` — most tests don't call mockReset directly |
| `done` callback conversion | Low | Low | Only 2 files, straightforward async conversion |
| Snapshot format differences | Low | Low | Regenerate all 14 snapshot files with `--update` |
| Timer mock differences | Low | Medium | Few timer tests; `vi.useFakeTimers()` API is compatible |
| React 18 + @testing-library/react v16 compat | Low | Low | Dashboard is React 18; RTL v16 supports React 18 |

## Rollback Plan

If tests are catastrophically broken:
```bash
git checkout dashboard/d3-codegen  # Return to last known-good state
```

Each task commits independently, so partial rollbacks are possible.
