# Legal/Policy Content Pages Architecture

## Overview
Policy pages (Privacy Policy, Terms of Service, Shipping Policy, Return Policy, Accessibility Statement) are **fully configuration-driven** with NO hardcoded content. All content comes from Storefront Control admin panel or sample config JSON fallbacks.

## Routes & Page Structure

### Policy Page Routes (App Router)
Located in: `storefront/src/app/[channel]/(main)/pages/`

| Page | Route | File |
|------|-------|------|
| Privacy Policy | `/{channel}/pages/privacy-policy` | `privacy-policy/page.tsx` |
| Terms of Service | `/{channel}/pages/terms-of-service` | `terms-of-service/page.tsx` |
| Shipping Policy | `/{channel}/pages/shipping-policy` | `shipping-policy/page.tsx` |
| Return Policy | `/{channel}/pages/return-policy` | `return-policy/page.tsx` |
| Accessibility | `/{channel}/pages/accessibility` | `accessibility/page.tsx` |
| Dynamic Pages | `/{channel}/pages/[slug]` | `[slug]/page.tsx` |

### Page Component Pattern (Example: privacy-policy/page.tsx)
```typescript
import { Metadata } from "next";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { PolicyPageView } from "../_components/PolicyPageView";

type Props = { params: Promise<{ channel: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { channel } = await params;
  const config = await fetchStorefrontConfig(channel);
  const title =
    config.footer?.privacyPolicyPageTitle?.trim() ||
    config.content?.footer?.privacyPolicyLink ||
    "Privacy Policy";
  const storeName = config.store?.name || "";
  return {
    title: `${title} | ${storeName}`,
    description: config.footer?.privacyPolicyHeader?.trim() || `Privacy policy for ${storeName}`,
  };
}

export default function PrivacyPolicyPage() {
  return <PolicyPageView policyKey="privacyPolicy" />;
}
```

All policy pages follow same pattern:
- Fetch config server-side in `generateMetadata`
- Pass `policyKey` to shared `PolicyPageView` component
- Config is loaded again client-side in PolicyPageView

## The Shared PolicyPageView Component

Location: `storefront/src/app/[channel]/(main)/pages/_components/PolicyPageView.tsx`

### PolicyKey Types Supported
```typescript
type PolicyKey = "returnPolicy" | "shippingPolicy" | "privacyPolicy" | "termsOfService" | "accessibility";
```

### Config Mapping
Maps each policyKey to corresponding config field in footer:
```typescript
const POLICY_TO_PAGE_KEY: Record<PolicyKey, keyof StoreConfig["pages"]> = {
  returnPolicy: "returnPolicy",
  shippingPolicy: "shippingPolicy",
  privacyPolicy: "privacyPolicy",
  termsOfService: "termsOfService",
  accessibility: "accessibility",
};
```

### Content Hierarchy
For each policy, fetches these fields from `footer` config (in order):
1. `{policyKey}PageTitle` — Page heading
2. `{policyKey}Header` — Optional header box before main content
3. `{policyKey}Content` — Primary content (main priority)
4. `{policyKey}DefaultContent` — Fallback if Content is empty
5. `{policyKey}Footer` — Optional footer box after main content
6. `policyPageEmptyMessage` — Fallback message when no content configured

### Empty State Detection
```typescript
const mainText = content || defaultContent || emptyMessage;
```

**Default empty message**: `"This policy page has not been configured yet."` (defined in sample configs)

### Rendering
- Uses semantic HTML: `<article>`, `<header>`, `<footer>`
- CSS variables for theming: `--store-neutral-200`, `--store-text`, `--store-bg`, etc.
- RTL-aware: `dir="auto"` on article
- Passes content to `PolicyContentBlock` component for markup rendering

## PolicyContentBlock Component

Location: `storefront/src/app/[channel]/(main)/pages/_components/PolicyContentBlock.tsx`

### Simple Markup Support
Converts admin-entered markdown-like syntax to HTML:
- `## Heading` → `<h2>` with styling
- `### Subheading` → `<h3>` with styling
- `* bullet point` → `<ul><li>`
- `1. numbered item` → `<ol><li>`
- `**bold text**` → `<strong>`
- Double newline → paragraph break
- No raw HTML allowed (XSS protection via `formatInline()`)

### Block Types Recognized
1. **Heading block** (line starts with `## `)
2. **Subheading block** (line starts with `### `)
3. **Unordered list** (all lines start with `* `, `- `, or `•`)
4. **Ordered list** (all lines match `\d+\.\d*\s` pattern, e.g., `1. `, `2.1 `)
5. **Fragment block** (mixed paragraphs and inline lists)

### XSS Safety
- `formatInline()` function only processes `**bold**` syntax
- Everything else passed as-is via React (safe from injection)
- No `dangerouslySetInnerHTML`

## Config Schema (Source of Truth)

### Pages Schema
Location: `apps/packages/storefront-config/src/schema/pages.ts`
```typescript
export const PagesSchema = z.object({
  privacyPolicy: z.boolean(),
  termsOfService: z.boolean(),
  shippingPolicy: z.boolean(),
  returnPolicy: z.boolean(),
  accessibility: z.boolean(),
  // ... other pages
});
```
**Purpose**: Enable/disable pages in Storefront Control (toggle on "Page Toggles" tab)

### Footer Schema (Content)
Location: `apps/packages/storefront-config/src/schema/footer.ts`
```typescript
export const FooterSchema = z.object({
  // Privacy Policy fields
  privacyPolicyPageTitle: z.string().optional(),
  privacyPolicyHeader: z.string().optional(),
  privacyPolicyContent: z.string().optional(),
  privacyPolicyDefaultContent: z.string().optional(),
  privacyPolicyFooter: z.string().optional(),
  
  // Terms of Service fields
  termsOfServicePageTitle: z.string().optional(),
  termsOfServiceHeader: z.string().optional(),
  termsOfServiceContent: z.string().optional(),
  termsOfServiceDefaultContent: z.string().optional(),
  termsOfServiceFooter: z.string().optional(),
  
  // Shipping Policy fields
  shippingPolicyPageTitle: z.string().optional(),
  shippingPolicyHeader: z.string().optional(),
  shippingPolicyContent: z.string().optional(),
  shippingPolicyDefaultContent: z.string().optional(),
  shippingPolicyFooter: z.string().optional(),
  
  // Return Policy fields
  returnPolicyPageTitle: z.string().optional(),
  returnPolicyHeader: z.string().optional(),
  returnPolicyContent: z.string().optional(),
  returnPolicyDefaultContent: z.string().optional(),
  returnPolicyFooter: z.string().optional(),
  
  // Accessibility Statement fields
  accessibilityPageTitle: z.string().optional(),
  accessibilityHeader: z.string().optional(),
  accessibilityContent: z.string().optional(),
  accessibilityDefaultContent: z.string().optional(),
  accessibilityFooter: z.string().optional(),
  
  // Fallback
  policyPageEmptyMessage: z.string().optional(),
  
  // Other footer fields...
  legalLinks: z.object({ ... }),
  // ...
});
```

## Storefront Control Admin Interface

Location: `apps/apps/storefront-control/src/pages/[channelSlug]/static-pages.tsx`

### Admin Page Structure
Tab-based interface with 4 tabs:
1. **Page Toggles** — Enable/disable pages (Privacy, Terms, Shipping, Return, Accessibility, Contact, FAQ, About, Blog)
2. **Legal Content** — Edit all 5 policy pages + VAT statement + empty message
3. **Contact & FAQ** — Contact form labels, FAQ page text
4. **Error Pages** — 404 and generic error page text

### Legal Content Tab Fields
For each policy (Privacy, Terms, Shipping, Return, Accessibility):
- **Page Title** field
- **Header** field (optional intro box)
- **Content** field (textarea, 12 rows, primary content)
- **Fallback Content** field (if primary is empty)
- **Footer** field (optional footer box)

### Form Integration
Uses `useConfigPage()` hook to:
- Load config from Storefront Control API
- Validate against FooterSchema + ContentSchema + PagesSchema
- Save changes back to Saleor metadata
- Show save status (dirty state, success/error messages)

## Sample Config Files (Dev Fallback)

### Hebrew Sample Config
File: `apps/apps/storefront-control/sample-config-import.json`

Example values for privacy policy:
```json
{
  "footer": {
    "privacyPolicyPageTitle": "מדיניות הפרטיות",
    "policyPageEmptyMessage": "תוכן דף המדיניות אינו זמין כרגע."
  }
}
```

### English Sample Config
File: `apps/apps/storefront-control/sample-config-import-en.json`

Example values for privacy policy:
```json
{
  "footer": {
    "privacyPolicyPageTitle": "Privacy Policy",
    "policyPageEmptyMessage": "This policy page has not been configured yet."
  }
}
```

**Important**: Both sample configs define all policy fields so dev fallback always has complete content.

## Data Flow

```
User visits /{channel}/pages/privacy-policy
     ↓
privacy-policy/page.tsx (server component)
     ├→ fetchStorefrontConfig(channel)  [for metadata]
     └→ returns <PolicyPageView policyKey="privacyPolicy" />
     ↓
PolicyPageView (client component)
     ├→ useStoreConfig()  [client-side fetch]
     ├→ useFooterConfig()  [extracts footer section]
     ├→ useFooterText()  [extracts footer text labels for fallbacks]
     ├→ Maps policyKey → config fields
     ├→ Selects: content || defaultContent || emptyMessage
     └→ returns <article> with <PolicyContentBlock text={mainText} />
     ↓
PolicyContentBlock (client component)
     ├→ Parses markup syntax (## headings, * bullets, **bold**)
     ├→ Builds React components for each block
     └→ renders styled HTML
     ↓
Browser displays fully styled policy page with theme colors
```

## How to Determine if Content Has Been Configured

**Check if "has content"**:
```typescript
const hasContent = !!(
  footerConfig[`${policyKey}Content`]?.trim() ||
  footerConfig[`${policyKey}DefaultContent`]?.trim()
);
```

**If both Content and DefaultContent are empty**, displays:
```
footerConfig.policyPageEmptyMessage
// or default: "This policy page has not been configured yet."
```

No special "not configured" state or placeholder — just shows the emptyMessage text.

## Configuration Entry Points

### 1. Admin Interface (Primary)
- URL: `http://localhost:3004/[channel]/static-pages?tab=legal`
- Editable textarea fields for all policies
- Real-time form validation
- Save button with status feedback

### 2. Sample JSON (Dev Fallback)
- Hebrew: `apps/apps/storefront-control/sample-config-import.json`
- English: `apps/apps/storefront-control/sample-config-import-en.json`
- Used when config not yet imported into Saleor

### 3. Saleor Metadata
- Stored in: App metadata under Storefront Control app
- API mutation: `updateMetadata()` (handled by admin app)
- Fetched by: `fetchStorefrontConfig()` in storefront

## SEO & Metadata

Each policy page sets custom metadata in `generateMetadata()`:
- **Title**: `{PageTitle} | {StoreName}`
- **Description**: `{Header}` or fallback description

Example for Privacy Policy:
```typescript
title: `Privacy Policy | Mansour Shoes`
description: `Privacy policy for Mansour Shoes` or `{config.footer.privacyPolicyHeader}`
```

## Related Files Summary

| File | Purpose |
|------|---------|
| `storefront/src/app/[channel]/(main)/pages/privacy-policy/page.tsx` | Privacy Policy page entry point |
| `storefront/src/app/[channel]/(main)/pages/terms-of-service/page.tsx` | Terms page entry point |
| `storefront/src/app/[channel]/(main)/pages/shipping-policy/page.tsx` | Shipping policy entry point |
| `storefront/src/app/[channel]/(main)/pages/return-policy/page.tsx` | Return policy entry point |
| `storefront/src/app/[channel]/(main)/pages/accessibility/page.tsx` | Accessibility statement entry point |
| `storefront/src/app/[channel]/(main)/pages/_components/PolicyPageView.tsx` | Shared layout + data fetching for all policies |
| `storefront/src/app/[channel]/(main)/pages/_components/PolicyContentBlock.tsx` | Markup renderer (## headings, * bullets, **bold**) |
| `apps/packages/storefront-config/src/schema/pages.ts` | Zod schema for page toggles |
| `apps/packages/storefront-config/src/schema/footer.ts` | Zod schema for footer/policy content (SOURCE OF TRUTH) |
| `apps/apps/storefront-control/src/pages/[channelSlug]/static-pages.tsx` | Admin UI for editing policies (Legal Content tab) |
| `apps/apps/storefront-control/sample-config-import.json` | Hebrew sample config (dev fallback) |
| `apps/apps/storefront-control/sample-config-import-en.json` | English sample config (dev fallback) |
| `storefront/storefront-cms-config.json` | CMS metadata (lists `policyPageEmptyMessage` at lines 4206, 6823) |
