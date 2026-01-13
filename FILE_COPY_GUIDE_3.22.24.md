# File Copy Guide: Saleor Dashboard 3.22.20 → 3.22.24

**Date**: January 2025  
**Source**: Downloaded `saleor-dashboard` v3.22.24 directory  
**Current**: Your customized `dashboard` directory

---

## ⚠️ Important: Files We've Already Modified

**DO NOT OVERWRITE** these files - we've already implemented the changes:

### ✅ Already Modified (Keep Our Versions)

1. **`src/components/MetadataDialog/MetadataDialog.tsx`**

   - ✅ We added confirmation dialog (#6227)
   - **Action**: Keep our version, but compare with new version to see if there are additional improvements

2. **`src/components/Sidebar/MountingPoint.tsx`**

   - ✅ We moved Cloud env link to logo hover (#6225)
   - **Action**: Keep our version, verify it matches the official implementation

3. **`src/components/Sidebar/Content.tsx`**

   - ✅ We removed EnvironmentLink from bottom (#6225)
   - **Action**: Keep our version

4. **`src/productTypes/components/ProductTypeVariantAttributes/ProductTypeVariantAttributes.tsx`**
   - ✅ We fixed question mark icon sizing (#6238)
   - **Action**: Keep our version, but verify the fix matches official version

---

## 📋 Files to Copy from 3.22.24

### High Priority - Must Copy

#### 1. Product Assignment Modals with Filters (#6165)

**Files to Copy**:

```
src/shipping/components/ShippingMethodProductsAddDialog/ShippingMethodProductsAddDialog.tsx
src/shipping/components/ShippingMethodProducts/ShippingMethodProducts.tsx
```

**Other Product Assignment Modals** (check if they exist in new version):

```
src/categories/components/CategoryProductList/CategoryProductList.tsx
src/collections/components/CollectionProductList/CollectionProductList.tsx
src/discounts/components/VoucherProducts/VoucherProducts.tsx
src/discounts/components/PromotionProducts/PromotionProducts.tsx
```

**What Changed**: Added Filter button and full filter functionality to product assignment modals.

**Action**:

- Copy these files from new version
- Check if you have custom modifications in these files
- If you have customizations, merge them manually

---

#### 2. Info Icon Sizing Fix (#6233)

**Files to Check/Copy**:

```
src/products/views/ProductDetails/ProductDetails.tsx
src/products/components/ProductAttributes/ProductAttributes.tsx
src/products/components/ProductDetailsPage/ProductDetailsPage.tsx
```

**What Changed**: Info icons set to 16px and properly aligned with text labels.

**Action**:

- Find files with info icons in Product details
- Compare icon sizing (should be 16px)
- Copy if different

---

### Medium Priority - Should Copy

#### 3. Transaction Cards Updates (#6217, #6178)

**Files to Copy**:

```
src/orders/components/OrderSummary/TransactionsApiButtons.tsx
src/orders/components/OrderSummary/TransactionCard.tsx (if exists)
src/orders/components/OrderSummary/PaymentsSummary.tsx
```

**What Changed**:

- Capture button now directly visible on transaction cards
- UI updates to transaction cards

**Action**: Copy these files if they exist in new version

---

#### 4. Order Summary Improvements (#6189)

**Files to Check**:

```
src/orders/components/OrderSummary/OrderSummary.tsx
src/orders/components/OrderSummary/OrderValue.tsx
src/orders/components/OrderSummary/PaymentsSummary.tsx
```

**What Changed**: Redesigned Order summary section improvements.

**Action**:

- Compare with your version
- Copy if there are improvements we don't have

---

#### 5. Tooltip Component Updates (#6224)

**Files to Check/Copy**:

```
src/components/Tooltip/ (if exists)
src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx
src/orders/components/OrderTimeline/OrderTimeline.tsx (if exists)
```

**What Changed**: Use Tooltip component for info icon and dates in timeline.

**Action**: Copy if these files exist and have Tooltip updates

---

#### 6. Filter Removal Fix (#6223)

**Files to Check**:

```
src/components/Filter/FilterTabs.tsx
src/components/Filter/FilterPresets.tsx
src/utils/filters/filterPresets.ts
```

**What Changed**: Fix removing saved filters.

**Action**: Copy if these files exist and have fixes

---

#### 7. Title Cleanup (#6222)

**Files to Check**:

```
src/components/AppLayout/TopNav/TopNav.tsx
src/components/WindowTitle/WindowTitle.tsx
```

**What Changed**: Remove redundant elements in main titles.

**Action**: Copy if there are visible improvements

---

### Low Priority - Optional

#### 8. Metadata Dialog Related Files

**Files to Check** (we already modified MetadataDialog.tsx):

```
src/orders/components/OrderMetadataDialog/OrderMetadataDialog.tsx
src/orders/components/OrderLineMetadataDialog/OrderLineMetadataDialog.tsx
src/orders/components/OrderFulfillmentMetadataDialog/ (if exists)
```

**Action**:

- These use our modified `MetadataDialog.tsx`
- Check if there are other changes in these wrapper components
- Copy if there are improvements

---

## 🔍 Comparison Strategy

### Step 1: Compare Modified Files

For files we've already modified, compare them with the new version:

```bash
# Compare our modified files with new version
diff dashboard/src/components/MetadataDialog/MetadataDialog.tsx saleor-dashboard/src/components/MetadataDialog/MetadataDialog.tsx
diff dashboard/src/components/Sidebar/MountingPoint.tsx saleor-dashboard/src/components/Sidebar/MountingPoint.tsx
diff dashboard/src/components/Sidebar/Content.tsx saleor-dashboard/src/components/Sidebar/Content.tsx
diff dashboard/src/productTypes/components/ProductTypeVariantAttributes/ProductTypeVariantAttributes.tsx saleor-dashboard/src/productTypes/components/ProductTypeVariantAttributes/ProductTypeVariantAttributes.tsx
```

**What to look for**:

- Did we implement the same changes?
- Are there additional improvements in the official version?
- Do we need to merge any differences?

---

### Step 2: Copy New/Changed Files

For files we haven't modified, copy directly:

```bash
# Copy product assignment modals
cp saleor-dashboard/src/shipping/components/ShippingMethodProductsAddDialog/ShippingMethodProductsAddDialog.tsx dashboard/src/shipping/components/ShippingMethodProductsAddDialog/

# Copy transaction card updates
cp saleor-dashboard/src/orders/components/OrderSummary/TransactionsApiButtons.tsx dashboard/src/orders/components/OrderSummary/

# Copy any other new files
```

---

### Step 3: Find Info Icon Files

Search for info icons in the new version:

```bash
# In the new saleor-dashboard directory
cd saleor-dashboard
grep -r "InfoIcon\|Info.*icon\|info.*16" src/products --include="*.tsx" --include="*.ts"
```

Then compare and copy those files.

---

## 📝 Detailed File List

### Must Copy (New Features)

1. **Product Assignment Modals with Filters**

   - `src/shipping/components/ShippingMethodProductsAddDialog/ShippingMethodProductsAddDialog.tsx`
   - Check for other product assignment dialogs

2. **Info Icon Fixes**
   - Search for files with info icons in `src/products/`
   - Look for 16px sizing

### Should Copy (Bug Fixes)

3. **Transaction Cards**

   - `src/orders/components/OrderSummary/TransactionsApiButtons.tsx`
   - Any new transaction card components

4. **Filter Removal Fix**

   - `src/components/Filter/` related files

5. **Tooltip Updates**
   - Timeline components with tooltips

### Compare First (We Modified)

6. **Metadata Dialog** - Compare, may need to merge
7. **Sidebar Logo** - Compare, verify our implementation
8. **Question Mark Icons** - Compare, verify our fix

---

## 🔄 Merge Strategy for Modified Files

### For MetadataDialog.tsx:

1. **Compare** our version with new version
2. **Check** if official version has additional improvements
3. **Merge** any improvements while keeping our confirmation dialog logic
4. **Test** that confirmation dialog still works

### For MountingPoint.tsx:

1. **Compare** our implementation with official version
2. **Verify** our tooltip implementation matches
3. **Keep** our version if it's equivalent or better

### For ProductTypeVariantAttributes.tsx:

1. **Compare** our icon fix with official fix
2. **Verify** sizing matches (should be `iconSize.small`)
3. **Keep** our version if correct

---

## ✅ Verification Checklist

After copying files:

- [ ] Product assignment modals have Filter button
- [ ] Info icons are 16px in Product details
- [ ] Transaction cards show Capture button directly
- [ ] Saved filters can be removed
- [ ] Metadata dialogs still show confirmation (our change)
- [ ] Cloud link still appears on logo hover (our change)
- [ ] Question mark icons still work (our change)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Application builds successfully

---

## 🚨 Important Notes

1. **Backup First**: Always backup your current `dashboard` directory before copying files

2. **Test After Each Copy**: Don't copy all files at once. Copy in batches and test.

3. **Custom Modifications**: If you have custom modifications in files that need to be copied, you'll need to merge them manually.

4. **Dependencies**: Check if `package.json` has new dependencies in 3.22.24 that you need to add.

5. **GraphQL Schema**: If there are GraphQL schema changes, you may need to regenerate types.

---

## 📦 Quick Copy Commands

```bash
# Navigate to your project
cd /path/to/saleor-platform

# Backup current dashboard
cp -r dashboard dashboard-backup

# Copy product assignment modal (example)
cp saleor-dashboard/src/shipping/components/ShippingMethodProductsAddDialog/ShippingMethodProductsAddDialog.tsx \
   dashboard/src/shipping/components/ShippingMethodProductsAddDialog/

# Copy transaction buttons
cp saleor-dashboard/src/orders/components/OrderSummary/TransactionsApiButtons.tsx \
   dashboard/src/orders/components/OrderSummary/

# Compare our modified files
diff dashboard/src/components/MetadataDialog/MetadataDialog.tsx \
     saleor-dashboard/src/components/MetadataDialog/MetadataDialog.tsx > metadata-diff.txt
```

---

## 🎯 Recommended Approach

1. **First**: Compare our 4 modified files with new version
2. **Second**: Copy product assignment modals (high priority)
3. **Third**: Find and copy info icon fixes
4. **Fourth**: Copy other bug fixes
5. **Finally**: Test everything thoroughly

---

**Next Step**: Run the comparison commands to see what's different, then copy files accordingly.
