# Simple File Copy Guide: 3.22.24

**You have**: Downloaded `saleor-dashboard` v3.22.24 directory  
**You need**: Copy specific files to your `dashboard` directory

---

## 🚨 CRITICAL: Files We Already Modified

**DO NOT OVERWRITE** these - we've already implemented the changes:

1. ✅ `src/components/MetadataDialog/MetadataDialog.tsx`
2. ✅ `src/components/Sidebar/MountingPoint.tsx`
3. ✅ `src/components/Sidebar/Content.tsx`
4. ✅ `src/productTypes/components/ProductTypeVariantAttributes/ProductTypeVariantAttributes.tsx`

**Action**: Compare these with new version first, then decide if we need to merge anything.

---

## 📋 Files to Copy (In Order)

### 1. Product Assignment Modals (MUST COPY)

**From**: `saleor-dashboard/src/shipping/components/ShippingMethodProductsAddDialog/`  
**To**: `dashboard/src/shipping/components/ShippingMethodProductsAddDialog/`

**Files**:

- `ShippingMethodProductsAddDialog.tsx` ← **Copy this**

**Also check for**:

- `ShippingMethodProducts.tsx` (in parent directory)

**What it adds**: Filter button in product assignment modals

---

### 2. Transaction Cards (SHOULD COPY)

**From**: `saleor-dashboard/src/orders/components/OrderSummary/`  
**To**: `dashboard/src/orders/components/OrderSummary/`

**Files**:

- `TransactionsApiButtons.tsx` ← **Copy this**
- `TransactionCard.tsx` (if exists) ← **Copy if exists**

**What it adds**: Capture button now visible directly on transaction cards

---

### 3. Info Icon Fixes (FIND & COPY)

**Search in new version** for files with info icons that are 16px:

```bash
# In saleor-dashboard directory, search for:
grep -r "size.*16\|InfoIcon" src/products --include="*.tsx"
```

**Likely files**:

- `src/products/views/ProductDetails/ProductDetails.tsx`
- `src/products/components/ProductAttributes/ProductAttributes.tsx`

**What to look for**: Icons with `size={16}` or similar

---

### 4. Other Bug Fixes (OPTIONAL)

**Check if these exist in new version**:

- `src/components/Filter/FilterTabs.tsx` - Fix removing saved filters
- `src/orders/components/OrderTimeline/OrderTimeline.tsx` - Tooltip updates

---

## 🔧 Quick Copy Commands

### Windows PowerShell:

```powershell
# 1. Product Assignment Modal
Copy-Item "saleor-dashboard\src\shipping\components\ShippingMethodProductsAddDialog\ShippingMethodProductsAddDialog.tsx" `
          "dashboard\src\shipping\components\ShippingMethodProductsAddDialog\"

# 2. Transaction Buttons
Copy-Item "saleor-dashboard\src\orders\components\OrderSummary\TransactionsApiButtons.tsx" `
          "dashboard\src\orders\components\OrderSummary\"

# 3. Check ShippingMethodProducts.tsx
if (Test-Path "saleor-dashboard\src\shipping\components\ShippingMethodProducts\ShippingMethodProducts.tsx") {
    Copy-Item "saleor-dashboard\src\shipping\components\ShippingMethodProducts\ShippingMethodProducts.tsx" `
              "dashboard\src\shipping\components\ShippingMethodProducts\"
}
```

### Linux/Mac:

```bash
# 1. Product Assignment Modal
cp saleor-dashboard/src/shipping/components/ShippingMethodProductsAddDialog/ShippingMethodProductsAddDialog.tsx \
   dashboard/src/shipping/components/ShippingMethodProductsAddDialog/

# 2. Transaction Buttons
cp saleor-dashboard/src/orders/components/OrderSummary/TransactionsApiButtons.tsx \
   dashboard/src/orders/components/OrderSummary/

# 3. ShippingMethodProducts
cp saleor-dashboard/src/shipping/components/ShippingMethodProducts/ShippingMethodProducts.tsx \
   dashboard/src/shipping/components/ShippingMethodProducts/
```

---

## ✅ After Copying

1. **Check for TypeScript errors**:

   ```bash
   cd dashboard
   pnpm check-types
   ```

2. **Check for linting errors**:

   ```bash
   pnpm lint
   ```

3. **Test the features**:
   - Open product assignment modal → Should see Filter button
   - Check transaction cards → Capture button should be visible
   - Check Product details → Info icons should be 16px

---

## 🎯 Summary

**Must Copy**:

1. `ShippingMethodProductsAddDialog.tsx`
2. `TransactionsApiButtons.tsx`

**Find & Copy**: 3. Info icon files in `src/products/`

**Compare First** (don't overwrite):

- Our 4 modified files (listed at top)

---

**That's it!** Copy those 2-3 files and you're done.
