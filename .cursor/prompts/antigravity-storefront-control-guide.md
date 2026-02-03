# Prompt for Antigravity (Gemini 3 Pro): Storefront + Storefront Control Integration

**Use this prompt when onboarding Antigravity or when asking it to add/change UI styling, animations, or configurability.**

---

## Copy-paste prompt below

---

You are working on the **Mansour Shoes E-Commerce Platform**, a Saleor-based Next.js storefront. Your task is to understand how the **Storefront** (customer-facing Next.js app) and **Storefront Control** (CMS configuration app) work together, and how to add or change **UI styling**, **animations**, and **configurability** without hardcoding.

**Read the project PRD first:** `PRD.md` (root). Pay special attention to:

- Section 7: Storefront Control Integration
- Section 2.3: Core Design Principles (Scalability, Configuration Over Code, Multi-Tenancy)
- Section 12: Development Workflow (Docker) — all commands run inside containers via `docker exec`

---

## 1. How Storefront and Storefront Control Work Together

### Architecture (high level)

1. **Storefront Control App** (Next.js app in `apps/apps/storefront-control/`, container `saleor-storefront-control-app-dev`, port 3004)

   - Is a Saleor App that runs inside the Saleor Dashboard.
   - Admins use it to edit: theme (colors, fonts, radius), feature toggles, homepage sections, header/footer, filters, content strings, SEO, localization, UI component styles (buttons, badges, inputs, cards, toasts).
   - When admins save, config is stored in **Saleor API** as **App Metadata** (JSON), keyed by channel (e.g. `ils`, `usd`).

2. **Storefront** (Next.js app in `storefront/`, container `saleor-storefront-dev`, port 3000)

   - On each request (e.g. layout load), it calls `fetchStorefrontConfig(channel)` from `storefront/src/lib/storefront-control` (or `storefront-control/fetch-config`).
   - That function fetches the JSON config for the current channel (from Storefront Control API / Saleor metadata, with fallbacks to sample JSON files and static defaults).
   - The config is passed into **`StoreConfigProvider`** in `storefront/src/app/[channel]/(main)/layout.tsx`:
     ```tsx
     const storeConfig = await fetchStorefrontConfig(channel);
     return (
       <StoreConfigProvider config={storeConfig}>
         {children}
       </StoreConfigProvider>
     );
     ```
   - All client components under that tree read config via hooks from `storefront/src/providers/StoreConfigProvider.tsx` (e.g. `useStoreConfig()`, `useBranding()`, `useFeature()`, `useUiConfig()`, `useContentConfig()`, `useRelatedProductsConfig()`, etc.).

3. **Data flow summary**  
   Dashboard (admin) → Storefront Control UI → Save → Saleor API (App Metadata) → Storefront fetches via `fetchStorefrontConfig(channel)` → `StoreConfigProvider` → components use hooks → **no redeploy needed** for config changes.

---

## 2. How to Add or Change UI Styling (Configurable)

**Rule:** Do not hardcode colors, fonts, radii, or shadows in the storefront. Drive them from Storefront Control config.

### Where styling is defined (schema)

- **Branding (global):**  
  `apps/apps/storefront-control/src/modules/config/schema.ts`
  - `BrandingSchema`: `colors` (primary, secondary, accent, background, surface, text, textMuted, success, warning, error), `typography` (fontHeading, fontBody, fontMono, fontSize for h1–h4, body, small, button, caption), `style` (borderRadius, buttonStyle, cardShadow).
- **UI components (buttons, badges, inputs, cards, toasts, icons):**  
  Same file, `UiSchema` and related subschemas: `ButtonsSchema`, `BadgesSchema`, `InputsSchema`, `CheckboxSchema`, `ProductCardSchema`, `ToastsSchema`, `IconsSchema`, `ActiveFiltersTagsSchema`, `CartUiSchema`, etc.

### Steps to add or change a style

1. **Extend the schema** in `apps/apps/storefront-control/src/modules/config/schema.ts`  
   Add or change fields (e.g. new color, new radius, new shadow). Use Zod (e.g. `z.string()`, `z.enum([...])`, `z.number()`).

2. **Set defaults** in `apps/apps/storefront-control/src/modules/config/defaults.ts`  
   Add corresponding default values for the new/updated fields so existing channels get safe fallbacks.

3. **Align storefront types** in `storefront/src/config/store.config.ts`  
   Ensure the `StoreConfig` TypeScript type (and any nested types for branding/ui) include the new fields so the storefront is type-safe.

4. **Expose via hooks** in `storefront/src/providers/StoreConfigProvider.tsx`  
   Either use existing hooks (`useBranding()`, `useUiConfig()`, etc.) or add a small helper hook that returns the new slice of config. Components should read styling from these hooks, not from hardcoded constants.

5. **Use in components**  
   In storefront components, use the hook and apply the values (e.g. `style={{ backgroundColor: branding.colors.primary }}` or Tailwind classes derived from config). Prefer CSS variables if the app already injects them from branding (e.g. `--store-primary`) so one place controls the value.

6. **Optional: expose in Storefront Control UI**  
   If admins should edit the new style from the dashboard, add or extend the relevant page under `apps/apps/storefront-control/src/pages/[channelSlug]/` (e.g. `branding.tsx`, `ui-components.tsx`) and wire form fields to the same schema keys.

7. **Sample configs**  
   Update `apps/apps/storefront-control/sample-config-import.json` and `sample-config-import-en.json` (and any runtime cache like `storefront/storefront-cms-config.json` if used) so imports and fallbacks stay consistent.

---

## 3. How to Add or Change Animations (Configurable)

**Rule:** Prefer making animation behavior configurable (e.g. speed, on/off) via Storefront Control so different channels or brands can tune UX.

### Where animation is already configurable

- In **Storefront Control schema**, section/homepage sections already support:
  - `animationSpeed`: e.g. `z.enum(["slow", "normal", "fast"])` in section background styles.
  - Section-specific options (e.g. marquee `speedSeconds`).
- These live in `apps/apps/storefront-control/src/modules/config/schema.ts` (e.g. `SectionBackgroundSchema`, `MarqueeSectionSchema`).

### Steps to add or change an animation

1. **Decide scope**  
   Global (e.g. all page transitions) vs per-section or per-component (e.g. hero only, or product card hover).

2. **Add schema** in `schema.ts`

   - For global: e.g. under a top-level `animations` or under `branding`/`ui`: add fields like `pageTransitionDuration`, `reducedMotion`, or `animationSpeed` (slow/normal/fast).
   - For section/component: add fields to the relevant section schema (e.g. `animationSpeed`, `enableAnimation`).

3. **Add defaults** in `defaults.ts`  
   Set sensible defaults (e.g. `normal` speed, `true` for enabled).

4. **Types and hooks**  
   Update `store.config.ts` and, if needed, a dedicated hook in `StoreConfigProvider.tsx` (e.g. `useAnimationConfig()`).

5. **Use in storefront**  
   In the component that runs the animation (e.g. CSS transition, Framer Motion, or Tailwind `transition-*`), read the config and set duration or disable animation (respect `prefers-reduced-motion` if you expose a “reduce motion” option).

6. **Optional: UI in Storefront Control**  
   Add controls in the right dashboard page (e.g. branding, ui-components, or a new “Animations” section) so admins can toggle or change speed.

---

## 4. How to Add or Change Configurability (New Features / New Levers)

**Rule:** Every new feature or behavioral lever should be **configurable per channel** via Storefront Control when it affects look, copy, or behavior that merchants want to change without code.

### Checklist for adding configurability

1. **Schema** (`apps/apps/storefront-control/src/modules/config/schema.ts`)  
   Add a new object or fields (e.g. feature flag, or nested object with title, subtitle, maxItems, strategy, etc.). Use Zod.

2. **Defaults** (`apps/apps/storefront-control/src/modules/config/defaults.ts`)  
   Provide full default values for the new fields.

3. **Storefront types** (`storefront/src/config/store.config.ts`)  
   Add the same shape to `StoreConfig` (or nested type) so the storefront type-checks.

4. **Provider / hooks** (`storefront/src/providers/StoreConfigProvider.tsx`)  
   Expose the new config via `useStoreConfig()` or a dedicated hook (e.g. `useRelatedProductsConfig()`). Merge with defaults so callers never get undefined for required keys.

5. **Components**  
   In the storefront, read from the hook and branch or style accordingly. No hardcoded feature flags or copy.

6. **Storefront Control UI**  
   Add or extend a page under `apps/apps/storefront-control/src/pages/[channelSlug]/` so admins can edit the new settings (e.g. features.tsx, content.tsx, ui-components.tsx, or a new page).

7. **Sample configs**  
   Update `sample-config-import.json`, `sample-config-import-en.json`, and any runtime config JSON so new channels and fallbacks include the new keys.

8. **Documentation**  
   Update `PRD.md` (and optionally `AGENTS.md`) so future agents and developers know the new config exists and where it is used.

---

## 5. File Map (Quick Reference)

| Purpose                                | Storefront Control                                                                                          | Storefront                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Schema (source of truth)               | `apps/apps/storefront-control/src/modules/config/schema.ts`                                                 | —                                                                            |
| Defaults                               | `apps/apps/storefront-control/src/modules/config/defaults.ts`                                               | —                                                                            |
| Types                                  | —                                                                                                           | `storefront/src/config/store.config.ts`                                      |
| Config fetch                           | —                                                                                                           | `storefront/src/lib/storefront-control` or `storefront-control/fetch-config` |
| Provider + hooks                       | —                                                                                                           | `storefront/src/providers/StoreConfigProvider.tsx`                           |
| Where config is injected               | —                                                                                                           | `storefront/src/app/[channel]/(main)/layout.tsx`                             |
| Admin UI for theme/features/content/ui | `apps/apps/storefront-control/src/pages/[channelSlug]/` (e.g. branding.tsx, content.tsx, ui-components.tsx) | —                                                                            |
| Sample configs                         | `apps/apps/storefront-control/sample-config-import*.json`                                                   | `storefront/storefront-cms-config.json` (if used)                            |

---

## 6. Docker (Required for All Commands)

All development commands run **inside Docker**. Do not run `npm`/`pnpm`/`npx` on the host.

- Storefront:  
  `docker exec -it saleor-storefront-dev pnpm <script>`  
  e.g. `docker exec -it saleor-storefront-dev pnpm build`, `pnpm generate`, `pnpm type-check`.

- Storefront Control (and other apps):  
  `docker exec -it saleor-storefront-control-app-dev pnpm <script>`  
  e.g. `docker exec -it saleor-storefront-control-app-dev pnpm build`, `pnpm lint`.

- Restart after config/schema changes:  
  `docker compose -f infra/docker-compose.dev.yml restart saleor-storefront-dev saleor-storefront-control-app-dev`

See `PRD.md` Section 12 and `AGENTS.md` for the full list of containers and commands.

---

## 7. Summary for Antigravity

- **Storefront** = Next.js app that **consumes** config.
- **Storefront Control** = app that **defines and edits** config (schema + defaults + admin UI); config is stored in Saleor and fetched by the storefront.
- **Styling:** Define in Storefront Control schema/defaults → types in storefront → hooks in StoreConfigProvider → use in components; avoid hardcoded colors/fonts/radii.
- **Animations:** Add fields (e.g. speed, on/off) to schema/defaults, expose via hooks, use in components; optionally expose in Storefront Control UI.
- **Configurability:** For any new lever (feature, copy, behavior), add schema + defaults + types + hooks + optional admin UI + sample configs + PRD/AGENTS update.
- **Always use Docker** for running commands; see PRD Section 12 and AGENTS.md.

When you implement a change, follow this flow so the platform stays scalable, configurable, and multi-tenant ready.
