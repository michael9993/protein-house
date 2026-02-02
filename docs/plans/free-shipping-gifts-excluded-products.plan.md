# Free Shipping (No Auto-Voucher), Shipping Section, Gifts, and Excluded Products

## Overview

- **Shipping voucher:** Kept; user adds it as a normal voucher code (uses the single voucher slot). No auto-apply for shipping vouchers.
- **Storefront Control:** Add a Shipping section so merchants can set the free-shipping threshold price for cart indication only.
- **Remove** voucher-based free-shipping logic and `isFree` metadata from shipping methods on the storefront.
- **Free gifts:** Add indication (badge) and optional confirmation when order promotion adds a gift line.
- **Excluded products:** Add user-facing indications and content so cart/checkout flow is clear and aligned with Saleor (methods already filtered by excluded products). All new/updated content goes into Storefront Control schema, defaults, content form, sample configs, and translation files.

---

## 1. Shipping voucher: keep it, no auto-apply

- **Backend / API:** No change. Shipping vouchers remain; one voucher per checkout (Saleor rule).
- **Storefront:** In [storefront/src/lib/checkout.ts](storefront/src/lib/checkout.ts), inside `applyAutoVouchers`, **exclude vouchers with `type === "SHIPPING"`** so only `ENTIRE_ORDER` and `SPECIFIC_PRODUCT` are auto-applied. Shipping vouchers are applied only when the user enters a code; they still consume the single voucher slot.
- **Cart / Checkout pages:** No change to where `applyAutoVouchers` is called; behaviour change is only that SHIPPING type is skipped.

---

## 2. Storefront Control: Shipping section (free-shipping threshold)

- **Goal:** Merchants can set the **price** that unlocks free shipping for **cart indication only** (progress bar, “Add X more”, “You’ve unlocked free shipping”). Banner text remains in content; the missing piece is the numeric threshold.
- **Schema:** `ecommerce.shipping.freeShippingThreshold` already exists; no schema change.
- **New UI:**
  - Add a **Shipping** page in Storefront Control, e.g. [apps/apps/storefront-control/src/pages/[channelSlug]/shipping.tsx](apps/apps/storefront-control/src/pages/[channelSlug]/shipping.tsx), with a form for:
    - **Free shipping threshold** – number input for `ecommerce.shipping.freeShippingThreshold` (used only for storefront messaging).
    - Optionally other `ecommerce.shipping` fields (e.g. showEstimatedDelivery, deliverySlots) if needed.
  - On save: `updateSection("ecommerce", { ...config.ecommerce, shipping: { ...config.ecommerce.shipping, freeShippingThreshold: value } })`.
  - Add a **Shipping** (or “Shipping & delivery”) entry in the app layout/nav linking to `/[channelSlug]/shipping`.
- **Content / translations:** Any new labels or help text for this section should be added to Storefront Control content schema and sample configs (see section 6).

---

## 3. Remove voucher-based free-shipping logic and isFree

- **Checkout GraphQL:** In [storefront/src/checkout/graphql/checkout.graphql](storefront/src/checkout/graphql/checkout.graphql), remove `metafield(key: "isFree")` from `deliveryMethod` and `shippingMethods`. Run GraphQL codegen.
- **DeliveryMethods:** [storefront/src/checkout/sections/DeliveryMethods/DeliveryMethods.tsx](storefront/src/checkout/sections/DeliveryMethods/DeliveryMethods.tsx) – remove all `isFree` / `metafield` / `isShippingVoucher` logic, `freeShippingVoucherNotApplicable`, and `freeShippingAppliedWithMethod`. Show each method with its **price** only (from API).
- **Checkout.tsx:** [storefront/src/checkout/views/Checkout/Checkout.tsx](storefront/src/checkout/views/Checkout/Checkout.tsx) – remove `effectiveShippingPrice`; pass `checkout.shippingPrice` to Summary.
- **Summary:** [storefront/src/checkout/sections/Summary/Summary.tsx](storefront/src/checkout/sections/Summary/Summary.tsx) – remove `isShippingVoucher` and the “Eligible for free shipping” sublabel; show voucher row with code and discount amount; shipping row always uses `shippingPrice.gross`.
- **CartClient / CartDrawer:** Remove `isShippingVoucher` and “Eligible for free shipping” / subtotal adjustments for shipping vouchers; show voucher discount normally.
- **Checkout text / Storefront Control:** Remove or stop using `freeShippingVoucherNotApplicable`, `freeShippingAppliedWithMethod`, `checkout.eligibleForFreeShipping` in UI; optionally remove from schema/defaults/content/sample configs for cleanliness.

---

## 4. Free gifts: indication and optional confirmation

- **GraphQL:** In [storefront/src/checkout/graphql/checkout.graphql](storefront/src/checkout/graphql/checkout.graphql), add `isGift` to `CheckoutLineFragment`. Run codegen.
- **Cart (CartClient, CartDrawer):** For each line with `line.isGift === true`, show a “Gift” (or “Free gift”) badge and optional subtle styling so gift lines are clearly indicated.
- **Checkout summary:** In SummaryItem (or equivalent), show the same “Gift” badge and styling when `line.isGift` is true.
- **Confirmation:** Option A – when the cart/checkout has at least one gift line, show a one-time toast or inline message (e.g. “A free gift has been added to your cart”) using content from Storefront Control. Option B (optional) – when gift lines change (e.g. new gift added), show a short modal/toast with product name and “OK”. All new strings in Storefront Control content and translations (section 6).

---

## 5. Excluded products: indications and flow

**Saleor behaviour:**  
`checkout.shippingMethods` already returns only methods that **can ship all items** in the cart. Methods that exclude any product in the cart are filtered out by Saleor. The `excluded_products` field on the shipping method type is **staff-only** (MANAGE_SHIPPING), so the storefront cannot query per-method excluded product names without a backend change.

**Storefront / Storefront Control:**

- **Cart:** Add a short, professional message (content-driven) so users know shipping options depend on the cart, e.g. “Shipping options depend on your cart. Some products may not be eligible for all shipping methods.” Display where it fits the cart UX (e.g. near shipping summary or before checkout CTA). Use a new content key, e.g. `cart.shippingRestrictionsNote`.
- **Checkout:** Add a short note near delivery methods (content-driven), e.g. “Only shipping methods that can ship all items in your cart are shown.” Use a new content key, e.g. `checkout.shippingMethodsFilteredNote`. This keeps the flow aligned with the API (no methods shown that exclude cart items) and sets expectations.
- **Optional future enhancement:** If Saleor later exposes a public field for excluded products (or a “reason” for method unavailability) on the checkout shipping method type, the storefront could show per-method text (e.g. “Does not ship: Product X”). No implementation in this plan for that.

All new strings must be added to Storefront Control schema, defaults, content form, sample configs, and translation files (section 6).

---

## 6. Content, configs, and translations (Storefront Control)

Ensure every new user-facing string is:

1. **Schema** – [apps/apps/storefront-control/src/modules/config/schema.ts](apps/apps/storefront-control/src/modules/config/schema.ts): add optional (or required) keys under the right section (e.g. `cart.*`, `checkout.*`, `shipping.*`).
2. **Defaults** – [apps/apps/storefront-control/src/modules/config/defaults.ts](apps/apps/storefront-control/src/modules/config/defaults.ts): add default English (and any other default locale) values.
3. **Content form** – [apps/apps/storefront-control/src/pages/[channelSlug]/content.tsx](apps/apps/storefront-control/src/pages/[channelSlug]/content.tsx): add form fields for the new keys so merchants can edit them per channel.
4. **Sample configs** – [apps/apps/storefront-control/sample-config-import.json](apps/apps/storefront-control/sample-config-import.json) (Hebrew) and [apps/apps/storefront-control/sample-config-import-en.json](apps/apps/storefront-control/sample-config-import-en.json) (English): add the new keys with appropriate translated values so imports and translations stay in sync.
5. **Exports / translation flow** – If Storefront Control or the dashboard use a specific export or translation file list, add the new keys there so they are included in config exports and translations.

**New content keys to add (examples):**

- **Cart:** `cart.shippingRestrictionsNote` – note that shipping options depend on cart and some products may have restrictions.
- **Checkout:** `checkout.shippingMethodsFilteredNote` – note that only methods that can ship all cart items are shown.
- **Gifts:** e.g. `cart.giftAddedMessage`, `checkout.giftLineLabel` – for “Free gift” badge and optional “A free gift has been added” toast/message.
- **Shipping section (new page):** Any labels/placeholders for the free-shipping threshold field (e.g. “Free shipping threshold (amount)”, “Used for cart progress and messaging only”) in content or in the Shipping page copy; if they are channel-editable, add to schema/content/sample configs.

Keep naming and placement consistent with existing Storefront Control and Saleor dashboard patterns.

---

## 7. Implementation order

1. **applyAutoVouchers** – Exclude `type === "SHIPPING"` in [storefront/src/lib/checkout.ts](storefront/src/lib/checkout.ts).
2. **Storefront Control Shipping page** – New page + nav, form for `ecommerce.shipping.freeShippingThreshold`, save via `updateSection("ecommerce", ...)`. Add any new labels to content/sample configs.
3. **Remove isFree and voucher-based free shipping** – GraphQL (remove metafield), DeliveryMethods, Checkout.tsx, Summary, CartClient, CartDrawer; optional cleanup of checkout text keys in Storefront Control.
4. **Excluded products content** – Add `cart.shippingRestrictionsNote` and `checkout.shippingMethodsFilteredNote` to schema, defaults, content form, sample configs (HE + EN), then use them in cart and checkout UI.
5. **Gift lines** – Add `isGift` to CheckoutLineFragment and codegen; add “Gift” badge in cart and checkout; add optional toast/message and content keys (`cart.giftAddedMessage`, `checkout.giftLineLabel`, etc.) with full content/translation rollout (schema, defaults, content, sample configs).

---

## 8. Summary

- **Shipping voucher:** Kept; user adds as normal code; one slot; no auto-apply for SHIPPING.
- **Shipping section:** New Storefront Control page for free-shipping threshold (cart indication only); content/translations for new labels.
- **isFree / voucher free-shipping:** Removed from storefront; shipping row and voucher row simplified.
- **Gifts:** `isGift` on lines; badge + optional confirmation; all strings in Storefront Control and translations.
- **Excluded products:** Informational notes in cart and checkout (content-driven); flow already correct via Saleor filtering; all new strings in schema, defaults, content, sample configs, and translation files.
- **Professional, aligned:** Copy and UX aligned with Saleor API (filtered methods, one voucher slot) and Storefront Control (content and config in one place, translatable).
