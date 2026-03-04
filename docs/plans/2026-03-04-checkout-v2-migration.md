# Checkout V2 Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Checkout V2 the default checkout by moving shared dependencies to `@/lib/checkout/`, flipping the feature flag, and updating E2E tests — all in one PR.

**Architecture:** V2 currently imports 8 module paths from V1's `@/checkout/` directory. We move them to `@/lib/checkout/` (a new shared location), update all V2 imports, add backwards-compatible re-exports in V1 (so rollback works), then flip the flag. No V1 code is deleted yet — that's a follow-up PR.

**Tech Stack:** Next.js 16, React 19, TypeScript, GraphQL Codegen (`@graphql-codegen/client-preset`), Playwright E2E

---

## Task 1: Create feature branch

**Files:** None (git operation)

**Step 1: Create and switch to feature branch**

```bash
cd /c/Users/micha/saleor-platform
git checkout -b checkout-v2-migration main
```

**Step 2: Verify clean state**

```bash
git status
```

Expected: On branch `checkout-v2-migration`, clean working tree (or expected untracked files).

---

## Task 2: Add checkout GraphQL fragments to main codegen

**Why:** `CheckoutFragment`, `AddressFragment`, and related types only exist in V1's separately-generated `src/checkout/graphql/index.ts`. The main codegen (`src/graphql/**/*.graphql` → `src/gql/`) doesn't include them. We need these types in `@/gql/graphql` so V2 can stop depending on V1's generated file.

**Files:**
- Create: `storefront/src/graphql/CheckoutFragments.graphql`

**Step 1: Create the fragments file**

Copy the 4 fragment definitions from `storefront/src/checkout/graphql/checkout.graphql` (lines 1-174) into a new file at `storefront/src/graphql/CheckoutFragments.graphql`. Include these fragments:

- `CheckoutErrorFragment` (lines 1-5)
- `GiftCardFragment` (lines 7-13) — needs `Money` fragment
- `PaymentGatewayFragment` (lines 28-36)
- `CheckoutFragment` (lines 38-109) — the main one V2 needs
- `CheckoutLineFragment` (lines 111-174)
- `AddressFragment` (lines 176-192)

Also include the `Money` fragment (used by the others). Check if it's already defined in `src/graphql/` — search for `fragment Money on Money`. If not, add it:

```graphql
fragment Money on Money {
  currency
  amount
}
```

Also include a `ValidationRulesFragment` (lines 15-26 of checkout.graphql).

**Important:** These fragments use `$languageCode` variable in `CheckoutLineFragment`. This is fine — it's resolved from the parent operation, not the fragment itself.

**Step 2: Run codegen to generate types**

```bash
docker exec saleor-storefront-dev pnpm generate
```

Expected: `src/gql/graphql.ts` now contains `CheckoutFragmentFragment` (or similar) type. Check the generated name — codegen may suffix with `Fragment`.

**Step 3: Verify the types exist**

```bash
docker exec saleor-storefront-dev grep -c "CheckoutFragment" src/gql/graphql.ts
```

Expected: Multiple matches (type definition + document references).

**Note:** The codegen client-preset generates types like `CheckoutFragmentFragmentDoc` and type `CheckoutFragmentFragment`. The naming differs from V1's generated `CheckoutFragment`. We'll handle this with a type alias in the next task.

**Step 4: Commit**

```bash
git add storefront/src/graphql/CheckoutFragments.graphql storefront/src/gql/
git commit -m "feat: add checkout fragments to main GraphQL codegen"
```

---

## Task 3: Create `@/lib/checkout/` shared module directory

**Why:** This new directory holds modules shared between V1 and V2. When V1 is deleted later, these files stay.

**Files:**
- Create: `storefront/src/lib/checkout/index.ts` (barrel export)
- Create: `storefront/src/lib/checkout/graphql-types.ts` (type re-exports/aliases)
- Create: `storefront/src/lib/checkout/useCheckoutText.tsx` (moved from V1)
- Create: `storefront/src/lib/checkout/UserContext.tsx` (moved from V1)
- Create: `storefront/src/lib/checkout/countries.ts` (moved from V1)
- Create: `storefront/src/lib/checkout/locale.ts` (moved from V1)
- Create: `storefront/src/lib/checkout/url.ts` (moved from V1, only `getQueryParams`)
- Create: `storefront/src/lib/checkout/address-types.ts` (moved from V1)
- Create: `storefront/src/lib/checkout/address-utils.ts` (moved from V1)
- Create: `storefront/src/lib/checkout/globalTypes.ts` (moved from V1)

### Step 1: Create directory

```bash
mkdir -p storefront/src/lib/checkout
```

### Step 2: Create `graphql-types.ts`

This file re-exports GraphQL types from the main codegen (`@/gql/graphql`) with the names V2 expects. After running codegen in Task 2, check the exact generated type names. The codegen `client-preset` with `fragmentMasking: false` generates fragment types as `{FragmentName}Fragment`.

```typescript
// storefront/src/lib/checkout/graphql-types.ts
// Re-export GraphQL types from the main generated file.
// These were previously only available in @/checkout/graphql (V1's codegen).

// The main codegen generates fragment types with the naming convention:
// fragment "CheckoutFragment" → type "CheckoutFragmentFragment"
// We re-export with the short names V2 components expect.
export type {
  CheckoutFragmentFragment as CheckoutFragment,
  AddressFragmentFragment as AddressFragment,
  CheckoutLineFragmentFragment as CheckoutLineFragment,
  CountryCode,
} from "@/gql/graphql";
```

**Important:** After codegen, verify the exact generated names. They may be `CheckoutFragmentFragment` or just `CheckoutFragment` depending on codegen config. Adjust the aliases accordingly. If codegen already generates `CheckoutFragment` (no double-Fragment suffix), then use:

```typescript
export type { CheckoutFragment, AddressFragment, CheckoutLineFragment, CountryCode } from "@/gql/graphql";
```

### Step 3: Move `useCheckoutText.tsx`

Copy `storefront/src/checkout/hooks/useCheckoutText.tsx` (579 lines) to `storefront/src/lib/checkout/useCheckoutText.tsx`. No internal import changes needed — it only imports from `react`.

### Step 4: Move `UserContext.tsx`

Copy `storefront/src/checkout/hooks/UserContext.tsx` (96 lines) to `storefront/src/lib/checkout/UserContext.tsx`. Its imports (`react`, `@saleor/auth-sdk/react`, `@/app/actions`) are all external — no changes needed.

### Step 5: Move `countries.ts`

Copy `storefront/src/checkout/lib/consts/countries.ts` to `storefront/src/lib/checkout/countries.ts`. Update its import:

```typescript
// OLD: import { type CountryCode } from "@/checkout/graphql";
// NEW:
import { type CountryCode } from "@/lib/checkout/graphql-types";
```

### Step 6: Move `locale.ts`

Copy `storefront/src/checkout/lib/utils/locale.ts` (9 lines) to `storefront/src/lib/checkout/locale.ts`. Update import:

```typescript
// OLD: import { type CountryCode } from "@/checkout/graphql";
// NEW:
import { type CountryCode } from "@/lib/checkout/graphql-types";
```

### Step 7: Move `globalTypes.ts`

Copy `storefront/src/checkout/lib/globalTypes.ts` to `storefront/src/lib/checkout/globalTypes.ts`. Update import:

```typescript
// OLD: import { type TaxedMoney } from "@/checkout/graphql";
// NEW:
import { type TaxedMoney } from "@/gql/graphql";
```

**Note:** `TaxedMoney` should already exist in `@/gql/graphql` since it's a schema type, not a fragment type. Verify with `grep "TaxedMoney" storefront/src/gql/graphql.ts`.

### Step 8: Move `address-types.ts`

Copy `storefront/src/checkout/components/AddressForm/types.ts` to `storefront/src/lib/checkout/address-types.ts`. Update imports:

```typescript
// OLD:
// import { type AddressFragment, type CountryCode } from "@/checkout/graphql";
// import { type MightNotExist } from "@/checkout/lib/globalTypes";
// NEW:
import { type AddressFragment, type CountryCode } from "@/lib/checkout/graphql-types";
import { type MightNotExist } from "@/lib/checkout/globalTypes";
```

### Step 9: Move `address-utils.ts`

Copy `storefront/src/checkout/components/AddressForm/utils.ts` (202 lines) to `storefront/src/lib/checkout/address-utils.ts`. Update ALL imports:

```typescript
// OLD:
// import { type OptionalAddress, type AddressField, type AddressFormData, type ApiAddressField } from "../../components/AddressForm/types";
// import { getCountryName } from "@/checkout/lib/utils/locale";
// import { type AddressFragment, type AddressInput, type CheckoutAddressValidationRules, type CountryCode, type CountryDisplay } from "@/checkout/graphql";
// import { type MightNotExist } from "@/checkout/lib/globalTypes";

// NEW:
import {
  type OptionalAddress,
  type AddressField,
  type AddressFormData,
  type ApiAddressField,
} from "@/lib/checkout/address-types";
import { getCountryName } from "@/lib/checkout/locale";
import {
  type AddressFragment,
  type CountryCode,
} from "@/lib/checkout/graphql-types";
import type { AddressInput, CheckoutAddressValidationRules, CountryDisplay } from "@/gql/graphql";
import { type MightNotExist } from "@/lib/checkout/globalTypes";
```

**Note:** `AddressInput`, `CheckoutAddressValidationRules`, `CountryDisplay` are schema types that should exist in `@/gql/graphql`. Verify with grep.

### Step 10: Move `url.ts` — only `getQueryParams`

V2 only uses `getQueryParams` from `url.ts`. The full file has many V1-specific functions. Create a minimal version:

```typescript
// storefront/src/lib/checkout/url.ts
import queryString from "query-string";

const queryParamsMap = {
  redirectUrl: "redirectUrl",
  checkout: "checkoutId",
  order: "orderId",
  token: "passwordResetToken",
  email: "passwordResetEmail",
  saleorApiUrl: "saleorApiUrl",
  transaction: "transaction",
  processingPayment: "processingPayment",
  redirectResult: "redirectResult",
  resultCode: "resultCode",
  type: "type",
  payment_intent: "paymentIntent",
  payment_intent_client_secret: "paymentIntentClientSecret",
} as const;

type UnmappedQueryParam = keyof typeof queryParamsMap;
type QueryParam = (typeof queryParamsMap)[UnmappedQueryParam];
type ParamBasicValue = string | null | undefined;

interface CustomTypedQueryParams {
  countryCode: string;
  channel: string;
  saleorApiUrl: string;
}

type RawQueryParams = Record<UnmappedQueryParam, ParamBasicValue> & CustomTypedQueryParams;
export type QueryParams = Record<QueryParam, ParamBasicValue> & CustomTypedQueryParams;

const getRawQueryParams = () => queryString.parse(location.search) as unknown as RawQueryParams;

export const getQueryParams = (): QueryParams => {
  const params = getRawQueryParams();
  return Object.entries(params).reduce((result, entry) => {
    const [paramName, paramValue] = entry as [UnmappedQueryParam, ParamBasicValue];
    const mappedParamName = queryParamsMap[paramName];
    return { ...result, [mappedParamName]: paramValue };
  }, {}) as QueryParams;
};
```

### Step 11: Create barrel `index.ts`

```typescript
// storefront/src/lib/checkout/index.ts
// Barrel export for shared checkout modules.
// Used by both checkout-v2/ and checkout/ (V1, during rollback period).
export * from "./graphql-types";
export * from "./useCheckoutText";
export { UserProvider, useUser } from "./UserContext";
export { countries } from "./countries";
export { getCountryName } from "./locale";
export { getQueryParams } from "./url";
export type { AddressField, AddressFormData, OptionalAddress, ApiAddressField } from "./address-types";
export { getFilteredAddressFields, getRequiredAddressFields, getAddressValidationRulesVariables, getOrderedAddressFields, getAddressInputData, getAddressInputDataFromAddress, getAddressFormDataFromAddress, getEmptyAddressFormData, getEmptyAddress, addressFieldsOrder, isMatchingAddress, isMatchingAddressData, getByMatchingAddress, isMatchingAddressFormData, getAllAddressFieldKeys } from "./address-utils";
export type { MightNotExist } from "./globalTypes";
```

### Step 12: Commit

```bash
git add storefront/src/lib/checkout/
git commit -m "feat: create shared checkout module at @/lib/checkout/"
```

---

## Task 4: Update V2 imports to use `@/lib/checkout/`

**Why:** Redirect all V2 imports from `@/checkout/` to `@/lib/checkout/` so V2 no longer depends on V1's directory.

**Files to modify (13 files):**

### Step 1: Update `storefront/src/checkout-v2/types.ts`

```typescript
// OLD: import type { CheckoutFragment } from "@/checkout/graphql";
// NEW:
import type { CheckoutFragment } from "@/lib/checkout/graphql-types";
```

### Step 2: Update `storefront/src/checkout-v2/CheckoutPage.tsx`

```typescript
// OLD:
// import type { CheckoutFragment } from "@/checkout/graphql";
// import type { CheckoutTextConfig } from "@/checkout/hooks/useCheckoutText";
// NEW:
import type { CheckoutFragment } from "@/lib/checkout/graphql-types";
import type { CheckoutTextConfig } from "@/lib/checkout/useCheckoutText";
```

### Step 3: Update `storefront/src/checkout-v2/CheckoutStateProvider.tsx`

```typescript
// OLD: import type { CheckoutFragment } from "@/checkout/graphql";
// NEW:
import type { CheckoutFragment } from "@/lib/checkout/graphql-types";
```

### Step 4: Update `storefront/src/checkout-v2/hooks/useCheckoutText.ts`

```typescript
// OLD:
// export { useCheckoutText, CheckoutTextProvider, formatText, type CheckoutTextConfig } from "@/checkout/hooks/useCheckoutText";
// NEW:
export { useCheckoutText, CheckoutTextProvider, formatText, type CheckoutTextConfig } from "@/lib/checkout/useCheckoutText";
```

### Step 5: Update `storefront/src/checkout-v2/hooks/useAddressValidation.ts`

```typescript
// OLD:
// import { getFilteredAddressFields, getRequiredAddressFields } from "@/checkout/components/AddressForm/utils";
// import type { AddressField } from "@/checkout/components/AddressForm/types";
// NEW:
import { getFilteredAddressFields, getRequiredAddressFields } from "@/lib/checkout/address-utils";
import type { AddressField } from "@/lib/checkout/address-types";
```

### Step 6: Update `storefront/src/checkout-v2/components/AddressForm.tsx`

```typescript
// OLD: import type { AddressField } from "@/checkout/components/AddressForm/types";
// NEW:
import type { AddressField } from "@/lib/checkout/address-types";
```

### Step 7: Update `storefront/src/checkout-v2/components/CountryCombobox.tsx`

```typescript
// OLD:
// import { countries as allCountries } from "@/checkout/lib/consts/countries";
// import { getCountryName } from "@/checkout/lib/utils/locale";
// import type { CountryCode } from "@/checkout/graphql";
// NEW:
import { countries as allCountries } from "@/lib/checkout/countries";
import { getCountryName } from "@/lib/checkout/locale";
import type { CountryCode } from "@/lib/checkout/graphql-types";
```

### Step 8: Update `storefront/src/checkout-v2/components/SavedAddressList.tsx`

```typescript
// OLD: import type { AddressFragment } from "@/checkout/graphql";
// NEW:
import type { AddressFragment } from "@/lib/checkout/graphql-types";
```

### Step 9: Update `storefront/src/checkout-v2/steps/ContactStep.tsx`

```typescript
// OLD:
// import { useUser } from "@/checkout/hooks/useUser";
// import { getQueryParams } from "@/checkout/lib/utils/url";
// NEW:
import { useUser } from "@/lib/checkout/UserContext";
import { getQueryParams } from "@/lib/checkout/url";
```

### Step 10: Update `storefront/src/checkout-v2/steps/ShippingStep.tsx`

```typescript
// OLD:
// import type { CountryCode } from "@/checkout/graphql";
// import { useUser } from "@/checkout/hooks/useUser";
// NEW:
import type { CountryCode } from "@/lib/checkout/graphql-types";
import { useUser } from "@/lib/checkout/UserContext";
```

### Step 11: Update `storefront/src/checkout-v2/confirmation/OrderConfirmation.tsx`

```typescript
// OLD: import type { CheckoutTextConfig } from "@/checkout/hooks/useCheckoutText";
// NEW:
import type { CheckoutTextConfig } from "@/lib/checkout/useCheckoutText";
```

### Step 12: Update `storefront/src/checkout-v2/summary/GiftCardRow.tsx`

```typescript
// OLD: import type { CheckoutFragment } from "@/checkout/graphql";
// NEW:
import type { CheckoutFragment } from "@/lib/checkout/graphql-types";
```

### Step 13: Update `storefront/src/checkout-v2/summary/SummaryLineItem.tsx`

```typescript
// OLD: import type { CheckoutFragment } from "@/checkout/graphql";
// NEW:
import type { CheckoutFragment } from "@/lib/checkout/graphql-types";
```

### Step 14: Type-check

```bash
docker exec saleor-storefront-dev pnpm type-check
```

Expected: PASS (0 errors).

### Step 15: Commit

```bash
git add storefront/src/checkout-v2/
git commit -m "refactor: update V2 imports from @/checkout/ to @/lib/checkout/"
```

---

## Task 5: Add backwards-compatible re-exports in V1

**Why:** V1 still works during the rollback period. These re-exports let V1 code continue importing from its original paths while the actual implementation lives in `@/lib/checkout/`.

**Files to modify:**
- `storefront/src/checkout/hooks/useCheckoutText.tsx` — add re-export comment
- `storefront/src/checkout/hooks/UserContext.tsx` — add re-export comment

**Actually — skip this task.** V1 code doesn't need to change. V1 still has its own copies of these files. The `@/lib/checkout/` files are independent copies (not moves). V1 and V2 each have their own copies until V1 is deleted in PR2. This is simpler and avoids any risk of breaking V1.

---

## Task 6: Flip the feature flag default

**Why:** Make V2 the default checkout experience. The env var `NEXT_PUBLIC_CHECKOUT_V2` defaults to `true` instead of `false`.

**Files:**
- Modify: `infra/docker-compose.dev.yml:328`
- Modify: `storefront/src/app/[channel]/checkout/page.tsx` (default fallback)

### Step 1: Update docker-compose default

In `infra/docker-compose.dev.yml`, line 328:

```yaml
# OLD:
      NEXT_PUBLIC_CHECKOUT_V2: ${NEXT_PUBLIC_CHECKOUT_V2:-false}
# NEW:
      NEXT_PUBLIC_CHECKOUT_V2: ${NEXT_PUBLIC_CHECKOUT_V2:-true}
```

### Step 2: Update page.tsx default fallback

In `storefront/src/app/[channel]/checkout/page.tsx`, find where `NEXT_PUBLIC_CHECKOUT_V2` is read and update the default:

```typescript
// Look for something like:
// const useV2 = process.env.NEXT_PUBLIC_CHECKOUT_V2 === "true";
// Ensure it defaults to true if env var is not set:
const useV2 = process.env.NEXT_PUBLIC_CHECKOUT_V2 !== "false"; // default true
```

### Step 3: Commit

```bash
git add infra/docker-compose.dev.yml storefront/src/app/[channel]/checkout/page.tsx
git commit -m "feat: flip checkout V2 feature flag default to true"
```

---

## Task 7: Update E2E tests

**Why:** V2 tests should run by default. V1 tests should be skipped (V1 is no longer the default).

**Files:**
- Modify: `storefront/e2e/checkout-v2.spec.ts` — remove the `E2E_CHECKOUT_V2` gate
- Modify: `storefront/e2e/checkout.spec.ts` — add skip gate (only run if `E2E_CHECKOUT_V1=true`)

### Step 1: Update V2 spec — remove skip gate

In `storefront/e2e/checkout-v2.spec.ts`, find and update the skip logic:

```typescript
// OLD (around line 32-35):
// const V2_ENABLED = process.env.E2E_CHECKOUT_V2 === "true";
// test.skip(!V2_ENABLED, "Set E2E_CHECKOUT_V2=true to run checkout-v2 tests");

// NEW:
// V2 is now the default checkout. These tests always run.
// To skip: set E2E_SKIP_CHECKOUT_V2=true
const V2_SKIPPED = process.env.E2E_SKIP_CHECKOUT_V2 === "true";
// Then inside test.describe:
test.skip(V2_SKIPPED, "Checkout V2 tests skipped via E2E_SKIP_CHECKOUT_V2");
```

Also update the header comment to remove the `E2E_CHECKOUT_V2=true` instructions.

### Step 2: Update V1 spec — add skip gate

In `storefront/e2e/checkout.spec.ts`, add a skip condition at the top of the describe block:

```typescript
const V1_ENABLED = process.env.E2E_CHECKOUT_V1 === "true";

test.describe("Checkout", () => {
  test.skip(!V1_ENABLED, "Legacy checkout tests — set E2E_CHECKOUT_V1=true to run");
  // ... existing tests
});
```

### Step 3: Commit

```bash
git add storefront/e2e/checkout-v2.spec.ts storefront/e2e/checkout.spec.ts
git commit -m "test: make V2 checkout tests default, skip V1 tests"
```

---

## Task 8: Update documentation

**Files:**
- Modify: `CLAUDE.md` — update checkout architecture section
- Modify: `AGENTS.md` — update checkout references (if exists)

### Step 1: Update CLAUDE.md

In the "Checkout Architecture" section, update to reflect V2 as default:

```markdown
**Checkout Architecture:**
- **Checkout V2** (default): `storefront/src/checkout-v2/` — App Router, single-page accordion, React Hook Form + Zod, `useReducer` + Context state (no Zustand)
  - Feature flag: `NEXT_PUBLIC_CHECKOUT_V2` defaults to `true` in `infra/docker-compose.dev.yml`
  - Set to `"false"` to use legacy checkout for rollback
  - Shared modules: `storefront/src/lib/checkout/` (GraphQL types, useCheckoutText, UserContext, country data, address utils)
- **Legacy checkout** (deprecated): `storefront/src/checkout/` — Pages Router, Formik+Yup, Zustand stores. Will be removed in a follow-up PR.
```

Also update the E2E test table:

```markdown
| `checkout-v2.spec.ts` | 6 | **Default** — V2 accordion checkout tests. Skip with `E2E_SKIP_CHECKOUT_V2=true` |
| `checkout.spec.ts` | 3 | Legacy guest checkout — **skipped by default**, enable with `E2E_CHECKOUT_V1=true` |
```

### Step 2: Commit

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for V2-default checkout"
```

---

## Task 9: Type-check, lint, rebuild, and verify

**Step 1: Restart storefront container**

```bash
docker compose -f infra/docker-compose.dev.yml restart saleor-storefront-dev
```

**Step 2: Wait for build, then type-check**

```bash
docker exec saleor-storefront-dev pnpm type-check
```

Expected: PASS

**Step 3: Lint**

```bash
docker exec saleor-storefront-dev pnpm lint
```

Expected: PASS (or only pre-existing warnings)

**Step 4: Verify V2 loads in browser**

Navigate to `http://localhost:3000/default-channel/checkout` (with a valid checkout cookie). Should see the V2 accordion checkout (Contact → Shipping → Delivery → Payment steps).

**Step 5: Run V2 E2E tests (optional — if time permits)**

```bash
cd storefront && pnpm test:e2e -- --grep "Checkout V2"
```

---

## Task 10: Create PR

**Step 1: Push branch**

```bash
git push -u origin checkout-v2-migration
```

**Step 2: Create PR**

```bash
gh pr create --title "Make Checkout V2 the default checkout" --body "$(cat <<'EOF'
## Summary

- Moved 8 shared modules from `@/checkout/` to `@/lib/checkout/` so V2 no longer depends on V1 directory
- Added checkout GraphQL fragments to main codegen (previously only in V1's separate codegen)
- Flipped `NEXT_PUBLIC_CHECKOUT_V2` default from `false` to `true`
- V2 E2E tests now run by default; V1 tests skipped (enable with `E2E_CHECKOUT_V1=true`)
- Updated documentation

## Rollback

Set `NEXT_PUBLIC_CHECKOUT_V2=false` in docker-compose env to revert to legacy checkout. V1 code is untouched.

## Follow-up

Delete V1 code (`storefront/src/checkout/`) in a separate PR after 2-4 weeks of V2 running in production.

## Test plan

- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes
- [ ] V2 checkout loads (accordion with 4 steps)
- [ ] Full guest checkout flow works end-to-end
- [ ] Auth flow works (sign in, sign out, continue)
- [ ] Rollback: setting `NEXT_PUBLIC_CHECKOUT_V2=false` shows legacy checkout
- [ ] V2 E2E tests pass without `E2E_CHECKOUT_V2` env var

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Files Summary

| # | File | Action |
|---|------|--------|
| 1 | `storefront/src/graphql/CheckoutFragments.graphql` | **Create** — fragments for main codegen |
| 2 | `storefront/src/lib/checkout/graphql-types.ts` | **Create** — type re-exports from `@/gql/graphql` |
| 3 | `storefront/src/lib/checkout/useCheckoutText.tsx` | **Create** — moved from V1 |
| 4 | `storefront/src/lib/checkout/UserContext.tsx` | **Create** — moved from V1 |
| 5 | `storefront/src/lib/checkout/countries.ts` | **Create** — moved from V1 |
| 6 | `storefront/src/lib/checkout/locale.ts` | **Create** — moved from V1 |
| 7 | `storefront/src/lib/checkout/url.ts` | **Create** — minimal, only `getQueryParams` |
| 8 | `storefront/src/lib/checkout/address-types.ts` | **Create** — moved from V1 |
| 9 | `storefront/src/lib/checkout/address-utils.ts` | **Create** — moved from V1 |
| 10 | `storefront/src/lib/checkout/globalTypes.ts` | **Create** — moved from V1 |
| 11 | `storefront/src/lib/checkout/index.ts` | **Create** — barrel export |
| 12 | `storefront/src/checkout-v2/types.ts` | **Modify** — update import |
| 13 | `storefront/src/checkout-v2/CheckoutPage.tsx` | **Modify** — update imports |
| 14 | `storefront/src/checkout-v2/CheckoutStateProvider.tsx` | **Modify** — update import |
| 15 | `storefront/src/checkout-v2/hooks/useCheckoutText.ts` | **Modify** — update re-export source |
| 16 | `storefront/src/checkout-v2/hooks/useAddressValidation.ts` | **Modify** — update imports |
| 17 | `storefront/src/checkout-v2/components/AddressForm.tsx` | **Modify** — update import |
| 18 | `storefront/src/checkout-v2/components/CountryCombobox.tsx` | **Modify** — update imports |
| 19 | `storefront/src/checkout-v2/components/SavedAddressList.tsx` | **Modify** — update import |
| 20 | `storefront/src/checkout-v2/steps/ContactStep.tsx` | **Modify** — update imports |
| 21 | `storefront/src/checkout-v2/steps/ShippingStep.tsx` | **Modify** — update imports |
| 22 | `storefront/src/checkout-v2/confirmation/OrderConfirmation.tsx` | **Modify** — update import |
| 23 | `storefront/src/checkout-v2/summary/GiftCardRow.tsx` | **Modify** — update import |
| 24 | `storefront/src/checkout-v2/summary/SummaryLineItem.tsx` | **Modify** — update import |
| 25 | `infra/docker-compose.dev.yml` | **Modify** — flip flag default |
| 26 | `storefront/src/app/[channel]/checkout/page.tsx` | **Modify** — update default |
| 27 | `storefront/e2e/checkout-v2.spec.ts` | **Modify** — remove skip gate |
| 28 | `storefront/e2e/checkout.spec.ts` | **Modify** — add skip gate |
| 29 | `CLAUDE.md` | **Modify** — update docs |

## Verification Checklist

1. `docker exec saleor-storefront-dev pnpm type-check` — PASS
2. `docker exec saleor-storefront-dev pnpm lint` — PASS
3. V2 checkout loads by default (accordion UI)
4. Legacy checkout loads when `NEXT_PUBLIC_CHECKOUT_V2=false`
5. No `@/checkout/` imports remain in `storefront/src/checkout-v2/` (verify with `grep -r "@/checkout/" storefront/src/checkout-v2/`)
