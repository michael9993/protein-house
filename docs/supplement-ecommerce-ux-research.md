# Sports Supplement E-Commerce UX & Conversion Research Report

**Date:** March 30, 2026
**Stores Analyzed:** Bodybuilding.com, Myprotein.com, OptimumNutrition.com, MuscleAndStrength.com, iHerb.com, GNC.com
**Note:** Vitacost.com blocked automated access (HTTP 403); excluded from direct analysis.

---

## 1. Product Page Patterns (Supplement-Specific)

### 1.1 Supplement Facts Panel Display
- **Myprotein:** Expandable nutritional info section below product description. Shows per-serving macros prominently (23g protein, 114 calories). Nutritional values vary by flavor -- disclaimer is shown clearly.
- **GNC:** Supplement Facts rendered as a tabbed section on the product page. Shows serving size, servings per container, and full ingredient breakdown. "X Servings" is shown directly on the product card in category listings.
- **Optimum Nutrition:** Clean product pages with macro highlights (protein per serving) in the description. Full Supplement Facts in an expandable panel.
- **Bodybuilding.com:** Product cards in category view show weight (e.g., "5 Lbs.") and product sub-type (e.g., "Whey Blends"). Full supplement facts on product detail pages.
- **Muscle & Strength:** Product cards show weight and serving count prominently. Detailed supplement facts panels on product pages.

**Key Pattern:** Every store shows protein-per-serving and serving count on the product card itself, not just the detail page. This is the most important metric shoppers compare.

### 1.2 Flavor/Size Selector UX
- **Myprotein:** Two-tier selector -- first choose flavor category (All, +Collagen, Collabs, New), then specific flavor from a dropdown. Amount selector is separate. Over 40 flavors available for Impact Whey.
- **GNC:** Shows "13 Flavors + More Sizes Available" on category cards. Product page uses swatch-style selectors for both flavor and size. Each size variant has its own serving count displayed.
- **Optimum Nutrition:** Flavor filter on category page with 50+ flavor options (Apple & Raspberry, Banana, Blue Raspberry, etc.). Product pages use visual swatch selectors.
- **Muscle & Strength:** Checkbox filters for size (1lb, 2lbs, 4lbs, 5lbs, 10lbs) in the sidebar. Flavor selection on product detail pages.
- **Bodybuilding.com:** Filters by Product Type (Whey Blends, Whey Isolate, Creatine Monohydrate, etc.) and Price ranges. Size shown on product cards.

**Key Pattern:** Flavor is treated as a first-class variant, not a secondary option. Best-in-class stores show flavor categories/tags (New, Collabs, Limited Edition) to help navigate 30-40+ flavor options.

### 1.3 Subscription / Auto-Ship Options
- **Myprotein:** "Single Purchase | Subscription" toggle directly on the product page, integrated into the buy box. Subscription shown as an equal option alongside one-time purchase.
- **GNC:** "Subscribe to Save" button appears on every product card in category listings -- not just product pages. This is aggressive placement for subscription conversion.
- **Optimum Nutrition:** Newsletter signup with 15% first-order discount. No visible subscription/auto-ship for individual products on the DTC site.
- **Bodybuilding.com:** No visible subscription option on the Shopify-based store. Focuses on promotional discounts instead.
- **Muscle & Strength:** No subscription model visible; relies on deal stacking and loyalty rewards.

**Key Pattern:** GNC and Myprotein lead in subscription UX. The toggle between "Single Purchase" and "Subscription" directly in the buy box (Myprotein) is the gold standard. GNC's approach of showing "Subscribe to Save" on every category card creates constant awareness.

### 1.4 Stack Recommendations
- **Muscle & Strength:** Dedicated "Stacks & Bundles" category with sub-categories: Muscle Building Stacks, Fat Loss Stacks, Weight Gain Stacks, Workout Stacks, Women's Stacks, Men's Stacks. 34 curated stack products.
- **Optimum Nutrition:** Named bundles like "Creatine Total Routine" and "Energy Performance Bundle" sold as distinct products. Bundle images show multiple products together. "Energy Performance Bundle" at EUR55 packages pre-workout + whey.
- **GNC:** "Bundle and Save" department in main navigation. Also Vitapak programs that bundle multiple supplements into daily packs (e.g., Joint Vitapak, Energy & Metabolism Vitapak).
- **Bodybuilding.com:** BOGO deals (Buy One Get One 50% Off) on brand collections (Cellucor/Xtend, Mutant) function as soft stack builders.

**Key Pattern:** The most effective stack builders are goal-oriented (Muscle Building, Fat Loss, Recovery) rather than product-oriented. GNC's Vitapak daily-pack format is a premium upsell mechanic -- pre-portioned supplement packs for a month.

### 1.5 Price Per Serving Display
- **GNC:** Shows "X servings" on every product card alongside the price, enabling mental per-serving calculation. E.g., "26 servings / $49.99" and "52 servings / $89.99" for the same product.
- **Myprotein:** Shows amount options with implicit serving count. Product description states "per serving" nutritional values.
- **Muscle & Strength:** Serving counts shown on product cards.
- **Bodybuilding.com:** Weight shown (5 Lbs.) but not explicit serving count on cards.

**Key Pattern:** Showing serving count directly next to price is standard. The next level (which few stores do well) is showing explicit "$/serving" or "price per serving" calculation. This is an opportunity for differentiation.

### 1.6 Third-Party Testing Badges
- **Myprotein:** "Certified by world leading labs" badge in the buy box. Products tested by Informed Choice (banned substances) and Informed Protein (label accuracy). Performance Advisory Board endorsement.
- **Optimum Nutrition:** Trust signals through athlete endorsements (Dan Sheehan, rugby) and "Optimum Advantage" campaign.
- **GNC:** Brand-level trust through established retail presence. Individual product pages show testing info where applicable.
- **iHerb:** Certificate of Analysis (CoA) available on many products. Third-party testing info in product specifications.

**Key Pattern:** Myprotein leads here with dual certification (Informed Choice + Informed Protein) prominently displayed. Certification badges should appear in the buy box area, not buried in product description.

### 1.7 Reviews with Photos / Before-After
- **Myprotein:** Impact Whey Protein has 29,475+ reviews with 4.65/5 rating. Review count shown on category cards.
- **GNC:** Review counts shown on category cards (e.g., "1,225 reviews" for Wheybolic). Star ratings visible in product listings.
- **Muscle & Strength:** Community-driven with article engagement metrics (18.3K reads, 4 comments). Workout content drives trust.

**Key Pattern:** High review counts (10,000+) are a massive trust signal unique to supplement stores. Showing review counts on category-level product cards (not just detail pages) is standard practice.

---

## 2. Navigation & Filtering Patterns

### 2.1 Primary Category Taxonomy

**GNC (Most Comprehensive):**
- Protein (630 products) > Protein Powder (480) > Whey Protein (350)
- Vitamins & Supplements (966)
- Pre-Workout & Performance (1,080)
- Food & Drink (477)
- Herbs & Natural Solutions (477)
- Digestion & Gut Health (199)
- Weight Management (199)
- Beauty & Skin Care (135)
- Creatine (121) -- broken out as top-level due to trending demand

**Myprotein:**
- Protein
- Creatine
- Pre-Workout
- Bars, Drinks & Snacks
- Vitamins & Minerals
- Activewear (clothing cross-sell)

**Muscle & Strength:**
- Protein (11 subcategories: Whey, Isolate, Blends, Vegan, Casein, Bars, Extended Release, Naturally Flavored, Hydrolysate, Beef)
- Creatine (Monohydrate, Blends, Kre-Alkalyn, Chelate)
- Pre-Workout, Aminos, Fat Burners, Vitamins & Minerals
- Stacks & Bundles (goal-based sub-categories)
- Equipment & Accessories

**Bodybuilding.com:**
- Product Type filter: Whey Blends, Whey Isolate, Plant Protein Blends, Creatine Monohydrate, BCAAs, EAAs, Glutamine, Electrolytes, Pre-Workout (Stim/Non-Stim/High Stim/Pump), Greens, Multis, Testosterone Blends

**iHerb Sports Nutrition:**
- Sports Supplements
- Muscle Recovery
- Protein
- Creatine
- Nitric Oxide
- Electrolytes & Hydration
- Sports Bars & Snacks

**Key Pattern:** Creatine has been elevated to a top-level category by most stores (previously buried under "Performance"). Pre-workout is often split by stimulant level (Stim-Free, Moderate Stim, High Stim) -- this is supplement-specific UX.

### 2.2 Key Filters

**Standard filter set across stores:**
| Filter | Used By |
|--------|---------|
| Brand | All stores |
| Price Range | BB.com ($25 brackets), M&S, GNC, iHerb |
| Size/Weight | M&S (1lb-10lbs), GNC, Myprotein |
| Flavor | ON (50+ options), GNC (swatch-based), Myprotein |
| Product Sub-type | BB.com (Whey Blends vs Isolate vs Plant), M&S |
| Availability | BB.com (In Stock, On Sale) |
| Dietary | ON (Vegan filter), iHerb (extensive) |
| Servings | GNC (shown per product) |

**iHerb Distinctive Filters:** Most extensive dietary/lifestyle filters including allergen-free, organic, non-GMO, vegan, gluten-free -- reflecting their broader health-store positioning.

### 2.3 "Shop by Goal" Navigation
- **GNC:** Dedicated "By Goal" department (2,895 products) in main navigation. Goals include: Muscle Building, Weight Loss, Energy, Recovery, General Wellness, Men's Health.
- **Muscle & Strength:** Goal-based stack categories (Muscle Building Stacks, Fat Loss Stacks, Weight Gain Stacks). Also provides free workout routines, diet plans, and exercise guides by goal.
- **Bodybuilding.com:** Tool-based goal navigation -- calculators for protein intake, creatine dosage, macros, calories, fats, body type assessment. "Bodybuilding Health+" program for weight loss, longevity, and sexual health.
- **iHerb:** Women's Wellness store, category-based health goal navigation.

**Key Pattern:** "Shop by Goal" is a top-level navigation pattern at GNC (the market leader in this). Goals map to curated product collections, not just filtered category views.

### 2.4 "Shop by Diet" Pattern
- **Optimum Nutrition:** Vegan filter + dedicated Plant Protein collection
- **Muscle & Strength:** Vegan Protein category, Naturally Flavored Protein category
- **iHerb:** Most advanced -- filters for organic, non-GMO, vegan, gluten-free, keto-friendly
- **Bodybuilding.com:** Plant Protein Blends, Plant Based Protein as filter options

**Key Pattern:** "Vegan" is the most prominent dietary filter. Keto/Paleo filters are more common at health-oriented stores (iHerb) than bodybuilding-focused stores.

---

## 3. Conversion Tactics

### 3.1 Subscribe & Save
| Store | Discount | Placement |
|-------|----------|-----------|
| GNC | "Subscribe to Save" (typically 10-15%) | On every product card in category listings |
| Myprotein | Subscription toggle in buy box | Product page, equal prominence to single purchase |
| Optimum Nutrition | 15% off first order (newsletter) | Footer/popup signup |
| Bodybuilding.com | Not available | N/A |
| Muscle & Strength | Not available | N/A |

### 3.2 Bundle/Stack Builders
| Store | Approach |
|-------|----------|
| Muscle & Strength | 34 curated stacks in 6 goal categories |
| GNC | Vitapak daily-pack programs (monthly supply), Bundle and Save department |
| Optimum Nutrition | Named "Routine" bundles (Creatine Total Routine, Energy Performance Bundle) |
| Bodybuilding.com | BOGO deals on brand collections |
| Myprotein | Starter Bundles for sampling |

### 3.3 Free Shipping Thresholds
| Store | Threshold |
|-------|-----------|
| Bodybuilding.com | $99.99 (Signature & EVL orders only) |
| Myprotein | GBP 50 (free standard delivery) |
| Optimum Nutrition | EUR 50 |
| iHerb | Varies by region |
| GNC | Free in-store pickup available |

### 3.4 First-Order Discounts
| Store | Offer |
|-------|-------|
| Optimum Nutrition | 15% off first order (email signup) |
| Myprotein | Earn GBP 15 credit via referral program |
| iHerb | 20% off via app (code EUAPP20) |
| GNC | PRO Access Membership deals |
| Bodybuilding.com | Brand-specific rotating discounts (20-25% off) |

### 3.5 Deal Structures (Observed Live)
- **Bodybuilding.com:** Rotating brand sales (20% off Signature, 20% off Redcon1, 25% off Axe & Sledge, BOGO 50% on Cellucor/Xtend). Multiple simultaneous promotions in announcement bar.
- **GNC:** "Mix, Match & Save" -- Buy One Get One 50% Off across categories (Vitamins, Creatine, Performance, Diet Support, Wellness, Men's Health). The Drop -- exclusive new product launches.
- **Muscle & Strength:** "April Fool's Day Sale" flash deals. "LIMITED TIME PRICE CUT" labels. "PRICE CUT + FREE Creatine 300g" bundle incentives.
- **Myprotein:** "UP TO 70% OFF PAYDAY SALE + EXTRA 10% OFF GBP 40 or 15% OFF GBP 70" -- tiered spend-more-save-more mechanics. App-exclusive extra 15% off.
- **iHerb:** BOGO (Buy 1 Get 1 Free) on beauty. Category-specific promo codes (MAR26ANTI for antioxidants). App-exclusive 20% off.

**Key Pattern:** Supplement stores run extremely aggressive, simultaneous promotions. The announcement bar/ticker is used to show 6-10 deals at once. Tiered discounts (spend GBP 40 get 10% off, spend GBP 70 get 15% off) drive higher AOV.

### 3.6 Loyalty/Rewards Programs
- **GNC PRO Access:** Paid membership program with exclusive pricing, BOGO deals, and points accumulation. "PRO Access Membership" is a top-level navigation item.
- **Muscle & Strength:** "Rewards Catalog" with exclusive rewards products. Points earned on purchases.
- **Myprotein:** Referral program (earn GBP 15 credit). Trustpilot integration (205K+ reviews, 4.4 rating).
- **Bodybuilding.com:** "Bodybuilding Health+" subscription service for weight loss, longevity, sexual health -- premium health coaching upsell.

### 3.7 App-Exclusive Offers
- **iHerb:** 20% off app-exclusive with dedicated promo code
- **Myprotein:** Extra 15% off via app (on top of existing sales)

**Key Pattern:** App-exclusive discounts are a major push to drive mobile app installs, creating a stickier customer relationship.

---

## 4. Trust & Compliance Elements

### 4.1 FDA Disclaimer Placement
Per DSHEA (Dietary Supplement Health and Education Act of 1994), all supplement stores must include:
- "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease."
- Typically placed at the bottom of product descriptions and in the site footer.
- Structure/function claims must include this disclaimer within 30 days of marketing.

### 4.2 Third-Party Testing Certifications
| Certification | Used By | What It Validates |
|--------------|---------|-------------------|
| Informed Choice | Myprotein | Banned substance testing |
| Informed Protein | Myprotein | Label accuracy verification |
| NSF Certified for Sport | Various brands on GNC, BB.com | Banned substance + label accuracy |
| GMP Certified | Shown in store footers | Manufacturing quality standards |
| Certificate of Analysis (CoA) | iHerb | Batch-specific lab results |

### 4.3 Money-Back Guarantees
- **Bodybuilding.com:** "SAFE AND SECURE" badge with shield icon in footer
- **Muscle & Strength:** Competitive pricing guarantee implied through "Lowest Prices" positioning
- **GNC:** In-store return policy prominently mentioned

### 4.4 Allergen & Dietary Warnings
- Product pages include allergen information (milk, soy, wheat, egg, tree nuts)
- Myprotein notes "Nutritional information may vary depending on flavour" -- important for allergen-sensitive customers
- iHerb has the most comprehensive allergen filtering system

### 4.5 Manufacturing Quality Badges
- "Manufactured in GMP facility" -- shown on individual product pages
- California Proposition 65 warnings where applicable
- Country of origin labeling

---

## 5. Content Marketing Patterns

### 5.1 Calculators & Tools (Bodybuilding.com Leads)
Bodybuilding.com offers a full "Tools & Calculators" section tagged by topic:
- **Body:** Body type assessment, body composition
- **Calories:** Calorie calculator, RMR calculator
- **Carbs:** Carb intake calculator
- **Creatine:** Creatine dosage calculator
- **Fats:** Fat intake calculator
- **Macros:** Full macro calculator
- **Protein:** Protein intake calculator
- **Training:** Training-related calculators

Also: Optimum Nutrition features a "Protein Calculator" link in their footer.

**Key Pattern:** Calculators serve dual purpose -- SEO traffic magnets and conversion tools that lead to product recommendations based on calculated needs.

### 5.2 Workout & Training Content
- **Muscle & Strength:** The most content-rich store. Homepage features workout programs (8-Week Advanced Muscle Building for Women, 6-Week Lean Bulk, Deadlift Specialization). Free workout routines, exercises, articles, and diet plans. Content shows engagement metrics (18.3K reads, 34.2K reads).
- **Bodybuilding.com:** Blog categories: Training, Nutrition, Recovery, Tools & Calculators. "All Stories" content hub. "Bodybuilding Health+" premium health coaching program.
- **Optimum Nutrition:** Athlete spotlight content (Dan Sheehan rugby), recipe integration, "Train Like the Best" editorial content.

### 5.3 Ingredient Education
- **Myprotein:** Product descriptions include science-backed claims with footnotes (e.g., "Protein contributes to the growth and maintenance of muscle mass" with numbered references). Performance Advisory Board involvement adds credibility.
- **Bodybuilding.com:** Article-based ingredient education through the blog.
- **GNC:** "New & Buzzworthy" section for educating about new ingredients and formats (e.g., color-changing pre-workout tech, creatine soft chews).

### 5.4 Recipe & Lifestyle Content
- **Optimum Nutrition:** Recipe integration visible on homepage (protein-enriched recipes)
- **Myprotein:** "Blend it into a post-workout shake, stir it into oats, or add it to smoothies and recipes" -- usage suggestions in product copy
- **Muscle & Strength:** Diet plans as free content alongside supplement store

### 5.5 Video Content
- **Myprotein:** Product page includes embedded video for Impact Whey Protein with transcript option
- **Optimum Nutrition:** Athlete video content (Dan Sheehan campaign)
- **Muscle & Strength:** Exercise demonstration videos integrated with workout content

---

## 6. Key Takeaways for Implementation

### Must-Have Features (Table Stakes)
1. **Flavor as first-class variant** with category tags (New, Limited, Collabs)
2. **Serving count on product cards** alongside price
3. **Review count on category cards** (not just detail pages)
4. **Brand + Product Type + Size + Price filters** on category pages
5. **FDA disclaimer** in product descriptions and footer
6. **Responsive announcement bar** with multiple rotating promotions
7. **Free shipping threshold** prominently displayed

### High-Impact Differentiators
1. **Subscribe & Save toggle** in the buy box (Myprotein model)
2. **Goal-based stack builder** with curated bundles (M&S model: Muscle Building, Fat Loss, etc.)
3. **Price per serving display** on product cards (few stores do this well -- major opportunity)
4. **Third-party certification badges** in the buy box area (Informed Choice, NSF)
5. **Tiered spend-more-save-more** promotions (Myprotein: 10% off GBP 40, 15% off GBP 70)
6. **Vitapak-style daily packs** as premium bundle format (GNC)
7. **Protein/macro calculators** that recommend products based on goals

### Supplement-Specific UX Patterns (Not Found in General E-Commerce)
1. Pre-workout categorized by stimulant level (Stim-Free / Moderate / High Stim)
2. Protein categorized by source type (Whey / Isolate / Casein / Plant / Beef)
3. Creatine elevated to top-level navigation (not buried under Performance)
4. Stack/bundle pages organized by fitness goal, not product type
5. Serving count shown as prominently as weight/size
6. Multiple simultaneous brand-specific promotions (6-10 at once)
7. Flavor count as a selling point ("40+ flavors")
8. App-exclusive additional discounts layered on top of site sales

### Competitive Positioning Summary
| Store | Strength | Weakness |
|-------|----------|----------|
| GNC | Most comprehensive catalog (3,251 products), Subscribe to Save on every card, Vitapak bundles, PRO membership | Complex navigation, aggressive upselling |
| Myprotein | Best subscription UX, strongest trust badges, massive review volume (29K+), tiered discounts | UK-centric, fewer brands |
| Muscle & Strength | Best content marketing (workouts + store), best stack categorization, community-driven | No subscription model, smaller brand selection |
| Bodybuilding.com | Best calculators/tools, strong brand heritage, clean Shopify UX | No subscription, limited filtering, higher free shipping threshold |
| Optimum Nutrition | Clean DTC design, named bundles (Routines), strong athlete marketing | Smaller catalog (single brand), no subscription |
| iHerb | Best dietary/allergen filtering, global reach, CoA access | Less sports-focused, German-default for EU |
