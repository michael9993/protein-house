# Checkout V2 Migration — Design Document

**Date:** 2026-03-04
**Status:** Approved
**Goal:** Make Checkout V2 the default checkout experience, deprecate V1, and eventually delete it.

## Context

The storefront has two parallel checkout implementations:
- **V1** (`storefront/src/checkout/`): 214 files, Pages Router, Formik + Zustand, urql GraphQL client
- **V2** (`storefront/src/checkout-v2/`): 60 files, App Router, single-page accordion, React Hook Form + Zod, useReducer + Context, Server Actions

V2 is feature-flagged via `NEXT_PUBLIC_CHECKOUT_V2`. Both coexist but V2 is the intended production checkout.

## Approved Strategy: Hard Cutover + Deferred Deletion

### PR 1 — Flip the Switch
1. **Move shared modules** from `@/checkout/` to `@/lib/checkout/` so V2 no longer depends on V1's directory
2. **Flip the feature flag** default from `false` to `true`
3. **Make V2 E2E tests the default**, skip V1 tests
4. **Update documentation** (CLAUDE.md, AGENTS.md, PRD.md)

### PR 2 — Delete V1 (2-4 weeks later)
1. Delete `storefront/src/checkout/` entirely
2. Remove V1 E2E test specs
3. Remove feature flag logic from `page.tsx`
4. Clean up any remaining V1 references

### Git Strategy
Feature branch `checkout-v2-migration` with PR for review.

## Shared Dependencies (Critical Finding)

V2 imports from V1 across 6 categories. These must be moved to shared locations before V1 can be deleted.

### 1. GraphQL Types (`@/checkout/graphql`)
**Files using it:** `CheckoutPage.tsx`, `CheckoutStateProvider.tsx`, `steps/ShippingStep.tsx`, `steps/PaymentStep.tsx`, `summary/CheckoutSummary.tsx`, `components/SavedAddressList.tsx`, `components/AddressForm.tsx`, `confirmation/OrderConfirmation.tsx`

**Types imported:** `CheckoutFragment`, `AddressFragment`, `CountryCode`

**Critical:** These types exist ONLY in V1's generated file `@/checkout/graphql/index.ts` (893KB). They do NOT exist in `@/gql/graphql.ts`. V2 server actions already use `@/gql/graphql` for GraphQL document types.

**Solution:** Re-export the needed types from `@/lib/checkout/graphql.ts` (a thin re-export from `@/gql/graphql.ts` after verifying the types exist there, OR copy the fragment type definitions).

### 2. User Context (`@/checkout/hooks/UserContext`)
**Files:** `ContactStep.tsx`, `ShippingStep.tsx`, `PaymentStep.tsx`, `CheckoutHeader.tsx`, `confirmation/OrderConfirmation.tsx`

**Solution:** Move `UserContext.tsx` + `UserProvider` to `@/lib/checkout/UserContext.tsx`.

### 3. Checkout Text (`@/checkout/hooks/useCheckoutText`)
**Files:** Multiple V2 components via `@/checkout-v2/hooks/useCheckoutText.ts` (re-export)

**Solution:** Move `useCheckoutText.tsx` to `@/lib/checkout/useCheckoutText.tsx`. Update V2's re-export.

### 4. Country Data (`@/checkout/lib/consts`)
**Files:** `AddressForm.tsx`

**Solution:** Move `consts.ts` (country list) to `@/lib/checkout/consts.ts`.

### 5. Address Field Utils (`@/checkout/components/AddressForm/utils`)
**Files:** `AddressForm.tsx`

**Solution:** Move address field utilities to `@/lib/checkout/address-utils.ts`.

### 6. URL/Locale Utils (`@/checkout/lib/utils/`)
**Files:** Various V2 components

**Solution:** Move `url.ts` and `locale.ts` to `@/lib/checkout/utils/`.

## Non-Goals (PR 1)
- No V2 feature changes
- No new checkout functionality
- No V1 code deletion (that's PR 2)

## Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| V2 has undiscovered bugs | Keep V1 code for 2-4 weeks as rollback |
| Shared module moves break imports | Type-check after every move |
| GraphQL types missing from `@/gql/graphql.ts` | Verify first; if missing, generate from fragments |

## Verification
1. `pnpm type-check` passes after all moves
2. `pnpm lint` passes
3. V2 E2E tests pass (guest checkout, auth, promo, RTL)
4. Manual smoke test: full checkout flow end-to-end
