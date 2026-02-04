# Storefront Design Spec - Athletic Performance (LTR + RTL)

This document defines a full storefront design system and page layouts for an athletic sportswear and footwear brand. It is a mixed style direction that blends premium minimal, modern marketplace, tech-forward, warm boutique, and high-energy launch aesthetics. It is written to be Figma-ready and implementation-ready.

Note: Use logical properties for RTL and LTR parity. All spacing and alignment references are start and end, not left and right.

---

**1) Brand Direction**

Tone keywords: fast, precise, confident, human, performance-ready.

Brand personality: premium athlete-focused performance gear with a clean, modern merchandising feel.

Visual anchors:
1. High contrast hero images with disciplined layout.
2. Bold, simple CTA shapes that feel fast and confident.
3. Minimal but energetic highlight accents in key moments.

---

**2) Color System (Enhanced Brand Color)**

Primary (enhanced performance blue):
1. Primary 700: #1142CC
2. Primary 600: #1B5BFF
3. Primary 500: #2F6BFF
4. Primary 300: #87A6FF
5. Primary 100: #E7EEFF

Neutral:
1. Ink 900: #0B0F1A
2. Ink 700: #1F2937
3. Ink 500: #4B5563
4. Ink 300: #CBD5E1
5. Ink 100: #F1F5F9
6. Surface: #FFFFFF
7. Surface muted: #F8FAFC

Accents:
1. Punch Orange: #FF6B2C
2. Volt Lime: #C5FF3C

Gradients:
1. Hero gradient: linear-gradient(135deg, #1B5BFF 0%, #6C7CFF 50%, #FF6B2C 100%)
2. Card gloss: linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)

Usage rules:
1. Primary for CTA and active states.
2. Punch Orange for promotion badges and limited drops.
3. Volt Lime for micro-accents only, not as a base.

---

**3) Typography**

Fonts:
1. Headings: Sora
2. Body: Source Sans 3
3. Mono labels: JetBrains Mono

Type scale:
1. H1: 56/64 desktop, 48/56 mobile
2. H2: 40/48
3. H3: 28/36
4. H4: 22/30
5. Body: 16/26
6. Small: 14/22
7. Micro: 12/18

Usage rules:
1. Use uppercase for short labels only.
2. Use mono for sizing and SKU details.
3. Avoid more than 2 font weights per block.

---

**4) Grid and Spacing**

Grid:
1. Desktop: 12 columns, 24px gutters, 1280 max width, 1440 hero width.
2. Tablet: 6 columns, 20px gutters, 960 max width.
3. Mobile: 4 columns, 16px gutters, 100% width.

Spacing scale:
1. 4, 8, 12, 16, 24, 32, 40, 56, 72, 96

Radii:
1. Card: 16
2. Button: 12
3. Pill: 9999

Shadows:
1. Level 1: 0 1px 4px rgba(0,0,0,0.08)
2. Level 2: 0 8px 24px rgba(0,0,0,0.12)

---

**5) Motion**

Animation rules:
1. Page entry: 250 to 500ms fade up.
2. Product card hover: lift 2 to 4px, 200ms.
3. Sticky QuickFilters: snap 150 to 220ms.
4. Reduced motion: disable all motion.

---

**6) Component Inventory (Figma-ready)**

Buttons:
1. Primary: filled, Primary 600, white text, 12 radius, 16px vertical.
2. Secondary: Ink 900 text, white bg, 1px border Ink 300.
3. Ghost: text only, underline on hover.
4. CTA Icon: circular, 44px, icon 20px.

Inputs:
1. Standard input: 44px height, 12 radius, 1px border Ink 300.
2. Search: input + icon left, 48px height.

Badges:
1. New: Primary 600 background, white text.
2. Sale: Punch Orange background, white text.
3. Limited: Ink 900 background, white text.

Chips:
1. Filter chip: white bg, Ink 700, 1px border, 9999 radius.
2. Active chip: Primary 600 bg, white text.

Cards:
1. Product card: 16 radius, white bg, 1px border Ink 100.
2. Category tile: full image with gradient overlay and text bottom.

Navigation:
1. Header with banner row and nav row.
2. Mobile bottom nav bar with 4 to 5 items.

QuickFilters:
1. Image-based cards for section.
2. Sticky QuickFilters bar for navigation.

---

**7) Homepage Redline Spec**

Frame sizes:
1. Desktop: 1440 x 900
2. Tablet: 1024 x 1366
3. Mobile: 390 x 844

Sections and spacing:
1. Hero: 720px height desktop, 520px tablet, 420px mobile.
2. QuickFilters: 220px height desktop, 200px tablet, 180px mobile.
3. Product carousel: card 280w x 380h desktop, 220w x 320h mobile.
4. Category tiles: 3 columns desktop, 2 columns tablet, 1 column mobile.
5. Promo band: 120px height desktop, 90px mobile.

Hero layout:
1. Left column: H1, body, CTA stack.
2. Right column: image or video.
3. Tech panel: 3 key specs, 8px gap, 12 radius.

QuickFilters layout:
1. Section title with 16px top margin.
2. Cards in a horizontal scroll row.
3. Sticky bar appears after section scrolls out.

Category tiles:
1. Tile height 320px desktop, 220px mobile.
2. Text bottom aligned with gradient overlay.
3. Two buttons: View All Categories and Shop Collection.

Best Sellers:
1. 4 cards desktop, 2 cards tablet, 2 cards mobile.
2. Section title + small description.

Promo band:
1. Full-width band with gradient background.
2. CTA button aligned start.

UGC strip:
1. 6 tiles desktop, 4 tiles tablet, 3 tiles mobile.
2. Each tile 160 x 160 desktop, 120 x 120 mobile.

---

**8) PLP Redline Spec**

Layout:
1. Filters left rail on desktop, bottom sheet on mobile.
2. Sticky QuickFilters bar always visible after threshold.
3. Sort and view options at top right on desktop, stacked on mobile.

Grid:
1. Desktop: 3 columns, 24px gap.
2. Tablet: 2 columns, 20px gap.
3. Mobile: 2 columns, 16px gap.

Filter controls:
1. Size chips 36px height.
2. Color swatches 24px with 2px ring on active.
3. Price slider with minimal handles.

---

**9) PDP Redline Spec**

Layout:
1. Desktop: gallery left, details right.
2. Mobile: stacked gallery, sticky add to cart.

Gallery:
1. Main image 640 x 640 desktop.
2. Thumbnails 4 per row, 64 x 64.

Details:
1. Title, rating, price block.
2. Size selector with guidance.
3. CTA row with Add to Cart and Wish.
4. Specs tab and material details.

---

**10) RTL and LTR Rules**

Rules:
1. Use logical properties for spacing and alignment.
2. Flip directional icons in RTL.
3. Swipers reverse direction in RTL.
4. Align text to start in both modes.
5. Keep visual order consistent, only mirror horizontal flow.

---

**11) Figma Structure**

Pages:
1. Foundations
2. Components
3. Homepage
4. PLP
5. PDP
6. Cart and Checkout

Component library:
1. Buttons
2. Inputs
3. Chips
4. Badges
5. Cards
6. Header and Footer
7. Product card variants
8. QuickFilters variants

---

**12) Implementation Notes**

Behavior and UX:
1. Sticky QuickFilters should not hide when header hides.
2. Use the enhanced primary palette for CTA and active states.
3. Maintain compact vertical rhythm for high product density.

Content guidance:
1. Product names should be short and scannable.
2. Use one short sentence for promo bands.
3. Keep CTA text action-driven.

