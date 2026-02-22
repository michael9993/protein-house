# GDPR Compliance & App-Level Rate Limiting

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete GDPR compliance essentials (account deletion UI, data export, consent logging, preference center) and add app-level rate limiting to all storefront API routes + GraphQL depth limiting.

**Architecture:** Two independent features implemented sequentially. GDPR uses existing Saleor mutations + new API routes. Rate limiting uses a shared in-memory utility applied to all `/api/*` routes, with GraphQL depth limiting added to the Python backend.

**Tech Stack:** Next.js 16 API routes, Saleor GraphQL API, TypeScript, Python/Django

---

## Feature 1: GDPR Compliance Essentials

### Task 1: Account Deletion GraphQL Documents

Create GraphQL mutation documents for the account deletion flow and generate TypeScript types.

**Files:**
- Create: `storefront/src/graphql/AccountDeletion.graphql`
- Regenerate: `storefront/src/gql/graphql.ts` (via codegen)

**Step 1: Create the GraphQL document**

```graphql
mutation AccountRequestDeletion($redirectUrl: String!, $channel: String) {
  accountRequestDeletion(redirectUrl: $redirectUrl, channel: $channel) {
    errors {
      field
      code
      message
    }
  }
}

mutation AccountConfirmDeletion($token: String!) {
  accountDelete(token: $token) {
    errors {
      field
      code
      message
    }
  }
}
```

**Step 2: Generate TypeScript types**

```bash
docker exec saleor-storefront-dev pnpm generate
```

**Step 3: Verify types generated**

Confirm `AccountRequestDeletionDocument` and `AccountConfirmDeletionDocument` exist in generated output.

**Step 4: Commit**

```bash
git add storefront/src/graphql/AccountDeletion.graphql storefront/src/gql/
git commit -m "feat(gdpr): add account deletion GraphQL documents"
```

---

### Task 2: Wire Account Deletion in Settings

Add confirmation dialog and mutation call to the existing delete button in SettingsClient.tsx.

**Files:**
- Modify: `storefront/src/app/[channel]/(main)/account/settings/SettingsClient.tsx` (lines 454-466, the Danger Zone section)

**What to implement:**

1. Add state: `showDeleteDialog` boolean, `deleteLoading` boolean, `deleteEmailSent` boolean
2. Import `AccountRequestDeletionDocument` from generated types
3. Import `useSaleorAuthContext` or use server action pattern to call the mutation
4. On button click: set `showDeleteDialog = true`
5. Confirmation dialog with:
   - Title: `settingsText.dangerZone` or "Delete Account?"
   - Warning message explaining the 2-step process (request → email → confirm)
   - "Send Deletion Email" button that calls `accountRequestDeletion` with `redirectUrl` = `${STOREFRONT_URL}/${channel}/account/delete-confirm`
   - Cancel button
6. After successful mutation: show "Check your email" message with `deleteEmailSent = true`
7. Error handling: show error message if mutation fails

**The confirmation dialog pattern** — use a simple modal with backdrop:
```tsx
{showDeleteDialog && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
      {/* title, warning, buttons */}
    </div>
  </div>
)}
```

**Key details:**
- The `redirectUrl` parameter tells Saleor where to redirect the user after clicking the email link. Saleor appends `?token=xxx` to it.
- Use `window.location.origin` for the base URL
- Channel comes from the URL params (already available in the component via props or context)
- The mutation is authenticated — user must be logged in (which they are, since they're on the settings page)
- Use `executeGraphQL` or `useMutation` from urql — check how other mutations are called in account pages

**Step 1: Implement the confirmation dialog and mutation call**

Read the full SettingsClient.tsx first to understand the existing patterns (imports, how other mutations are called, how messages are shown).

**Step 2: Verify**

```bash
docker exec saleor-storefront-dev pnpm type-check
```

**Step 3: Commit**

```bash
git add storefront/src/app/[channel]/(main)/account/settings/SettingsClient.tsx
git commit -m "feat(gdpr): wire account deletion with confirmation dialog"
```

---

### Task 3: Account Delete Confirmation Page

Create the page users land on after clicking the deletion link in their email.

**Files:**
- Create: `storefront/src/app/[channel]/(main)/account/delete-confirm/page.tsx`

**What to implement:**

A client component page that:
1. Reads `token` from URL search params
2. Shows confirmation message: "Click below to permanently delete your account"
3. On button click: calls `AccountConfirmDeletion` mutation with the token
4. On success: shows "Account deleted" message, clears auth cookies, redirects to homepage after 3 seconds
5. On error: shows error message (e.g., expired/invalid token)
6. If no token in URL: show "Invalid link" message

**Pattern** — follow existing account page patterns:
```tsx
"use client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
```

**Key details:**
- This page must be accessible without authentication (user's account may already be in deletion process)
- After successful deletion, clear auth state using `useSaleorAuthContext().signOut()` or by clearing cookies
- Redirect to `/${channel}` (homepage) after deletion
- Use the same layout/styling as other account pages

**Step 1: Create the page component**

**Step 2: Verify**

```bash
docker exec saleor-storefront-dev pnpm type-check
```

**Step 3: Commit**

```bash
git add storefront/src/app/[channel]/(main)/account/delete-confirm/
git commit -m "feat(gdpr): add account deletion confirmation page"
```

---

### Task 4: Data Export API Route

Create an authenticated API endpoint that exports user data as JSON download.

**Files:**
- Create: `storefront/src/graphql/DataExport.graphql`
- Create: `storefront/src/app/api/data-export/route.ts`

**GraphQL query for data export:**

```graphql
query MyDataExport {
  me {
    id
    email
    firstName
    lastName
    languageCode
    dateJoined
    lastLogin
    addresses {
      id
      firstName
      lastName
      streetAddress1
      streetAddress2
      city
      cityArea
      postalCode
      country {
        code
        country
      }
      countryArea
      phone
      isDefaultShippingAddress
      isDefaultBillingAddress
    }
    orders(first: 100) {
      edges {
        node {
          id
          number
          created
          status
          total {
            gross {
              amount
              currency
            }
          }
          shippingAddress {
            firstName
            lastName
            streetAddress1
            city
            postalCode
            country {
              code
            }
          }
          lines {
            productName
            variantName
            quantity
            totalPrice {
              gross {
                amount
                currency
              }
            }
          }
        }
      }
    }
    metadata {
      key
      value
    }
  }
}
```

**API route implementation:**

1. Read auth token from cookies (same pattern as other authenticated routes)
2. Call the `MyDataExport` query with auth
3. Format response as downloadable JSON
4. Set headers: `Content-Disposition: attachment; filename="my-data-export.json"`, `Content-Type: application/json`
5. If not authenticated: return 401

**Step 1: Create GraphQL document and generate types**

```bash
docker exec saleor-storefront-dev pnpm generate
```

**Step 2: Create the API route**

**Step 3: Verify**

```bash
docker exec saleor-storefront-dev pnpm type-check
```

**Step 4: Commit**

```bash
git add storefront/src/graphql/DataExport.graphql storefront/src/gql/ storefront/src/app/api/data-export/
git commit -m "feat(gdpr): add personal data export API endpoint"
```

---

### Task 5: Data Export & Cookie Preferences in Account Settings

Add "Download My Data" button and "Cookie Preferences" re-opener in the account settings page.

**Files:**
- Modify: `storefront/src/app/[channel]/(main)/account/settings/SettingsClient.tsx`

**What to implement:**

1. **Privacy & Data section** (above Danger Zone):
   - "Download My Data" button that triggers `/api/data-export` download
   - "Manage Cookie Preferences" button that dispatches a custom event to re-open the cookie banner

2. **Download implementation:**
   ```tsx
   const handleDataExport = async () => {
     const response = await fetch("/api/data-export", { credentials: "include" });
     if (response.ok) {
       const blob = await response.blob();
       const url = URL.createObjectURL(blob);
       const a = document.createElement("a");
       a.href = url;
       a.download = "my-data-export.json";
       a.click();
       URL.revokeObjectURL(url);
     }
   };
   ```

3. **Cookie preferences re-opener:**
   ```tsx
   const handleCookiePreferences = () => {
     window.dispatchEvent(new CustomEvent("open-cookie-settings"));
   };
   ```

4. **CookieConsent.tsx** needs a small update: listen for `open-cookie-settings` event and re-open the banner in preferences mode.

**Files to also modify:**
- `storefront/src/ui/components/CookieConsent/CookieConsent.tsx` — add event listener for `open-cookie-settings`

**Step 1: Add Privacy section to SettingsClient**

**Step 2: Update CookieConsent to listen for re-open event**

**Step 3: Verify**

```bash
docker exec saleor-storefront-dev pnpm type-check
```

**Step 4: Commit**

```bash
git add storefront/src/app/[channel]/(main)/account/settings/SettingsClient.tsx storefront/src/ui/components/CookieConsent/CookieConsent.tsx
git commit -m "feat(gdpr): add data export and cookie preferences to account settings"
```

---

### Task 6: Server-Side Consent Logging

Log consent changes to Saleor user metadata for authenticated users, creating a server-side audit trail.

**Files:**
- Create: `storefront/src/graphql/ConsentLog.graphql`
- Create: `storefront/src/app/api/consent-log/route.ts`
- Modify: `storefront/src/ui/components/CookieConsent/CookieConsent.tsx` — POST to consent-log after saving

**GraphQL mutation:**

```graphql
mutation UpdateConsentMetadata($id: ID!, $input: [MetadataInput!]!) {
  updateMetadata(id: $id, input: $input) {
    errors {
      field
      message
    }
  }
}
```

**API route:**

1. Read auth token from cookies
2. Accept POST body: `{ categories: { essential: true, analytics: boolean, marketing: boolean }, channel: string }`
3. Get user ID from `me` query
4. Update user metadata with:
   - `consent_analytics`: "true"/"false"
   - `consent_marketing`: "true"/"false"
   - `consent_timestamp`: ISO timestamp
   - `consent_version`: "1"
5. If not authenticated: return 200 (silent success — anonymous users only have localStorage)

**CookieConsent update:**

After calling `saveConsent()`, also POST to `/api/consent-log` with the categories. Fire-and-forget (don't block on response).

```tsx
// After saveConsent(channel, categories, expiryDays)
fetch("/api/consent-log", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ categories, channel }),
  credentials: "include",
}).catch(() => {}); // Fire and forget
```

**Step 1: Create GraphQL document and generate types**

**Step 2: Create consent-log API route**

**Step 3: Update CookieConsent to POST consent changes**

**Step 4: Verify**

```bash
docker exec saleor-storefront-dev pnpm type-check
```

**Step 5: Commit**

```bash
git add storefront/src/graphql/ConsentLog.graphql storefront/src/gql/ storefront/src/app/api/consent-log/ storefront/src/ui/components/CookieConsent/CookieConsent.tsx
git commit -m "feat(gdpr): add server-side consent audit logging"
```

---

## Feature 2: App-Level Rate Limiting

### Task 7: Shared Rate-Limit Utility

Create a reusable rate-limiting utility for all Next.js API routes.

**Files:**
- Create: `storefront/src/lib/rate-limit.ts`

**Implementation:**

A sliding-window rate limiter using in-memory Map with automatic cleanup:

```typescript
interface RateLimitConfig {
  windowMs: number;    // Time window in ms (e.g., 60000 = 1 min)
  maxRequests: number; // Max requests per window
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// Factory function — one limiter per route
export function createRateLimiter(config: RateLimitConfig) {
  const store = new Map<string, { timestamps: number[] }>();

  // Periodic cleanup of expired entries (every 5 minutes)
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store) {
      value.timestamps = value.timestamps.filter(t => now - t < config.windowMs);
      if (value.timestamps.length === 0) store.delete(key);
    }
  }, 5 * 60 * 1000);

  // Prevent Node.js from keeping the process alive
  if (cleanupInterval.unref) cleanupInterval.unref();

  return function checkLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const record = store.get(identifier) ?? { timestamps: [] };

    // Remove timestamps outside the window
    record.timestamps = record.timestamps.filter(t => now - t < config.windowMs);

    if (record.timestamps.length >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.timestamps[0] + config.windowMs,
      };
    }

    record.timestamps.push(now);
    store.set(identifier, record);

    return {
      allowed: true,
      remaining: config.maxRequests - record.timestamps.length,
      resetAt: now + config.windowMs,
    };
  };
}

// Helper to extract client IP from request
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

// Helper to return 429 response
export function rateLimitResponse(resetAt: number): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    },
  );
}
```

**Step 1: Create the utility**

**Step 2: Verify**

```bash
docker exec saleor-storefront-dev pnpm type-check
```

**Step 3: Commit**

```bash
git add storefront/src/lib/rate-limit.ts
git commit -m "feat(security): add shared rate-limit utility for API routes"
```

---

### Task 8: Apply Rate Limiting to All API Routes

Apply the rate limiter to every storefront API route.

**Files to modify:**
- `storefront/src/app/api/contact/route.ts` — replace custom limiter with shared utility
- `storefront/src/app/api/search-suggestions/route.ts` — add rate limiting
- `storefront/src/app/api/invoice/request/route.ts` — add rate limiting
- `storefront/src/app/api/cart-data/route.ts` — add rate limiting
- `storefront/src/app/api/cart-count/route.ts` — add rate limiting
- `storefront/src/app/api/recover-cart/route.ts` — add rate limiting
- `storefront/src/app/api/review-images/route.ts` — add rate limiting
- `storefront/src/app/api/data-export/route.ts` — add rate limiting (created in Task 4)
- `storefront/src/app/api/consent-log/route.ts` — add rate limiting (created in Task 6)
- `storefront/src/app/api/config/check/route.ts` — add rate limiting
- `storefront/src/app/api/config/[channel]/route.ts` — add rate limiting
- `storefront/src/app/api/config/refresh/route.ts` — add rate limiting
- `storefront/src/app/api/config/clear-stale/route.ts` — add rate limiting
- `storefront/src/app/api/draft/route.ts` — add rate limiting
- `storefront/src/app/api/draft/disable/route.ts` — add rate limiting

**Rate limit tiers:**

| Tier | Window | Max | Routes |
|------|--------|-----|--------|
| Strict | 1 min | 5 | contact, data-export, recover-cart, invoice/request |
| Normal | 1 min | 30 | search-suggestions, cart-data, cart-count, review-images, consent-log |
| Relaxed | 1 min | 60 | config/*, draft/* |

**Pattern for each route:**

```typescript
import { createRateLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

export async function GET(request: Request) {
  const { allowed, resetAt } = limiter(getClientIp(request));
  if (!allowed) return rateLimitResponse(resetAt);

  // ... existing handler logic
}
```

**For contact route specifically:** Remove the existing inline `rateLimitMap` + `checkRateLimit` code (lines 5-25) and replace with the shared utility.

**Step 1: Apply rate limiting to all routes (grouped by tier)**

**Step 2: Verify**

```bash
docker exec saleor-storefront-dev pnpm type-check
```

**Step 3: Commit**

```bash
git add storefront/src/app/api/
git commit -m "feat(security): apply rate limiting to all API routes"
```

---

### Task 9: GraphQL Depth Limiting

Add query depth validation to the Saleor GraphQL backend.

**Files:**
- Create: `saleor/saleor/graphql/core/validators/query_depth.py`
- Modify: `saleor/saleor/graphql/views.py` — add depth validation alongside cost validation
- Modify: `saleor/saleor/settings.py` — add `GRAPHQL_QUERY_MAX_DEPTH` setting

**Implementation:**

```python
# query_depth.py
from graphql import ASTValidationRule, ValidationContext
from graphql.language import (
    FieldNode,
    FragmentSpreadNode,
    InlineFragmentNode,
    OperationDefinitionNode,
)

class DepthValidator(ASTValidationRule):
    """Validates that GraphQL queries don't exceed maximum depth."""

    def __init__(self, context: ValidationContext, max_depth: int):
        super().__init__(context)
        self.max_depth = max_depth

    def enter_operation_definition(self, node: OperationDefinitionNode, *_args):
        depth = self._measure_depth(node)
        if depth > self.max_depth:
            self.report_error(
                GraphQLError(
                    f"Query depth {depth} exceeds maximum allowed depth {self.max_depth}."
                )
            )

    def _measure_depth(self, node, depth=0, fragments=None):
        if fragments is None:
            fragments = {}
            for definition in self.context.document.definitions:
                if hasattr(definition, "name") and hasattr(definition, "selection_set"):
                    if definition != node:
                        fragments[definition.name.value] = definition

        if not hasattr(node, "selection_set") or node.selection_set is None:
            return depth

        max_child_depth = depth
        for selection in node.selection_set.selections:
            if isinstance(selection, FieldNode):
                child_depth = self._measure_depth(selection, depth + 1, fragments)
                max_child_depth = max(max_child_depth, child_depth)
            elif isinstance(selection, FragmentSpreadNode):
                fragment = fragments.get(selection.name.value)
                if fragment:
                    child_depth = self._measure_depth(fragment, depth, fragments)
                    max_child_depth = max(max_child_depth, child_depth)
            elif isinstance(selection, InlineFragmentNode):
                child_depth = self._measure_depth(selection, depth, fragments)
                max_child_depth = max(max_child_depth, child_depth)

        return max_child_depth
```

**Settings:**

```python
# In settings.py, near GRAPHQL_QUERY_MAX_COMPLEXITY
GRAPHQL_QUERY_MAX_DEPTH = int(os.environ.get("GRAPHQL_QUERY_MAX_DEPTH", 15))
```

**Integration in views.py:**

Add the depth validator to the existing validation pipeline, right next to where `CostValidator` is applied.

**Step 1: Create the depth validator**

**Step 2: Add setting**

**Step 3: Integrate in views.py**

**Step 4: Test with a deep query**

```bash
docker exec saleor-api-dev python -c "
from saleor.graphql.core.validators.query_depth import DepthValidator
print('Import successful')
"
```

**Step 5: Commit**

```bash
git add saleor/saleor/graphql/core/validators/query_depth.py saleor/saleor/graphql/views.py saleor/saleor/settings.py
git commit -m "feat(security): add GraphQL query depth limiting (default: 15)"
```

---

## Verification

After all tasks complete:

1. **Type check:** `docker exec saleor-storefront-dev pnpm type-check`
2. **Account deletion flow:** Navigate to Settings → click Delete → see dialog → cancel
3. **Data export:** Navigate to Settings → click Download My Data → JSON file downloads
4. **Cookie preferences:** Navigate to Settings → click Manage Cookie Preferences → banner re-opens
5. **Rate limiting:** `curl -v http://localhost:3000/api/search-suggestions` 30+ times → get 429
6. **Depth limiting:** Send deeply nested GraphQL query → get depth error
7. **E2E tests:** `cd storefront && npx playwright test` → all pass (no regressions)

---

## Update Docs

After all tasks, update:
- `IMPROVEMENT-ROADMAP.md` — mark tasks #5 and #6 as DONE
- `PRD.md` — add GDPR compliance section
- `CLAUDE.md` — add rate-limit utility to key files if significant
