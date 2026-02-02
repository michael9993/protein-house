# Free Shipping: Saleor Recommendations and Options

## How Saleor Handles Free Shipping

Saleor does **not** have a built-in "free shipping when cart ≥ X" as an automatic feature. The only native way to discount shipping is:

### 1. **SHIPPING voucher (Saleor’s built-in)**

- **Type:** `VoucherType.SHIPPING`
- **Behavior:** Applies a discount to shipping cost when a voucher code is used (or when you auto-apply it from the storefront).
- **Settings:** Min order value (`minSpent`), countries, usage limits, etc.
- **Limitation:** One voucher per checkout — so if the customer uses a free-shipping voucher, they cannot also use a percentage/fixed order voucher.

**Docs:** [Vouchers](https://docs.saleor.io/developer/discounts/vouchers), [Applying Vouchers](https://docs.saleor.io/developer/discounts/apply-vouchers).

### 2. **Order promotions**

- **Reward types:** Only `SUBTOTAL_DISCOUNT` and `GIFT` (no shipping discount).
- So you **cannot** configure an order promotion that says “free shipping when subtotal ≥ 50.”

**Docs:** [Promotions](https://docs.saleor.io/developer/discounts/promotions).

---

## Making Free Shipping Feel Like an “Included Feature” (Not a Voucher)

You have two practical approaches.

### Option A: Keep SHIPPING voucher, present it as a feature (recommended)

- **Backend:** Continue using a SHIPPING voucher (e.g. FREESHIP200) with `minSpent` so it only applies when cart ≥ threshold.
- **Storefront:**
  - **Auto-apply** the voucher when the cart meets the threshold (no code required from the customer).
  - In the order summary, **do not** show it as “Voucher: FREESHIP200”; show **“Free shipping”** or “Eligible for free shipping” (as you already do when `discountName` indicates shipping).
  - Only show the promo-code input for **other** discounts (and make it clear that adding another code will replace the current one).
- **Result:** Saleor still uses one voucher slot, but the customer never enters a code and sees “free shipping” as part of the offer, not as a voucher.

**Pros:** Uses Saleor’s discount engine; totals and taxes stay correct; minimal backend change.  
**Cons:** Still one voucher per checkout (no stacking with another voucher).

---

### Option B: Free shipping only via shipping methods (no voucher)

- **Backend:** Do **not** use a SHIPPING voucher. Define one or more shipping methods that are free (price 0 or metadata `isFree: true`), e.g. “Free delivery” in the same zone as “Standard ₪30”.
- **Storefront:**
  - When **subtotal ≥ threshold** (from Storefront Control): show a message like “You’ve unlocked free shipping” and **highlight or recommend** the free method(s). Optionally hide or de-emphasize paid methods when over threshold (custom logic).
  - When **subtotal < threshold**: show all methods; paid methods show their price; free method can show “Free when order over ₪X” (copy only).
- **Result:** No voucher is used for free shipping; the customer simply selects the free method when eligible. The “free” is the method’s price (0), not a discount.

**Pros:** Free shipping does not consume the “one voucher” slot; can combine with a separate discount voucher.  
**Cons:** You rely on storefront/UX logic (e.g. which methods to show/highlight by cart total); no automatic “discount” on an otherwise paid method.

---

## Recommendation

- If you want **correct totals and minimal custom logic** and are okay with **one voucher per checkout**: use **Option A** (SHIPPING voucher, auto-apply, UI shows “Free shipping” instead of voucher code).
- If you **must** allow another voucher (e.g. 10% off) **together** with free shipping: use **Option B** (free shipping only via a free shipping method; no voucher for shipping).

Current implementation (auto-apply free-shipping voucher + “Eligible for free shipping” + `isFree` metadata on methods) aligns with **Option A**. To move to Option B you would stop auto-applying the shipping voucher and rely only on free shipping methods and threshold messaging in the UI.
