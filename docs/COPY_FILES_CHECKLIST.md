# File Copy Checklist: 3.22.20 → 3.22.24

**Date**: January 2025  
**Source Directory**: `saleor-dashboard` (v3.22.24)  
**Target Directory**: `dashboard` (your customized version)

---

## 🎯 Quick Reference: Files to Copy

### ✅ Files We Modified (Compare First, Don't Overwrite)

These files we've already customized. **Compare** with new version, don't blindly copy:

1. ✅ `src/components/MetadataDialog/MetadataDialog.tsx` - We added confirmation dialog
2. ✅ `src/components/Sidebar/MountingPoint.tsx` - We moved Cloud link to logo hover  
3. ✅ `src/components/Sidebar/Content.tsx` - We removed EnvironmentLink
4. ✅ `src/productTypes/components/ProductTypeVariantAttributes/ProductTypeVariantAttributes.tsx` - We fixed icon

**Action**: Use `diff` or compare tool to see if official version has improvements we should merge.

---

### 📋 Files to Copy from New Version

#### Priority 1: Product Assignment Modals (#6165)

**Copy these files** (they have new Filter button feature):

```
✅ src/shipping/components/ShippingMethodProductsAddDialog/ShippingMethodProductsAddDialog.tsx
✅ src/shipping/components/ShippingMethodProducts/ShippingMethodProducts.tsx
```

**Check for other product assignment modals**:
- `src/categories/components/CategoryProductList/` (if exists)
- `src/collections/components/CollectionProductList/` (if exists)  
- `src/discounts/components/VoucherProducts/` (if exists)
- `src/discounts/components/PromotionProducts/` (if exists)

**Before copying**: Check if you have custom modifications in these files.

---

#### Priority 2: Info Icon Fixes (#6233)

**Find and copy files with info icons**:

Search in new version:
```bash
cd saleor-dashboard
grep -r "InfoIcon\|Info.*icon" src/products --include="*.tsx" | grep -i "16\|size"
```

Likely files:
- `src/products/views/ProductDetails/ProductDetails.tsx`
- `src/products/components/ProductAttributes/ProductAttributes.tsx`
- `src/products/components/ProductDetailsPage/ProductDetailsPage.tsx`

**What to look for**: Icons with `size={16}` or `size={iconSize.small}` (16px).

---

#### Priority 3: Transaction Cards (#6217, #6178)

**Copy these files**:

```
✅ src/orders/components/OrderSummary/TransactionsApiButtons.tsx
✅ src/orders/components/OrderSummary/TransactionCard.tsx (if exists)
✅ src/orders/components/OrderSummary/PaymentsSummary.tsx (if updated)
```

**What changed**: Capture button now visible directly on cards.

---

#### Priority 4: Other Bug Fixes

**Copy if they exist**:

- `src/components/Filter/FilterTabs.tsx` - Fix removing saved filters (#6223)
- `src/components/Filter/FilterPresets.tsx` - Fix removing saved filters (#6223)
- `src/orders/components/OrderTimeline/OrderTimeline.tsx` - Tooltip updates (#6224)
- `src/components/AppLayout/TopNav/TopNav.tsx` - Title cleanup (#6222)

---

## 🔍 Step-by-Step Copy Process

### Step 1: Backup Your Dashboard

```bash
# Create backup
cp -r dashboard dashboard-backup-$(date +%Y%m%d)
```

### Step 2: Compare Our Modified Files

```bash
# Compare MetadataDialog
diff dashboard/src/components/MetadataDialog/MetadataDialog.tsx \
     saleor-dashboard/src/components/MetadataDialog/MetadataDialog.tsx

# Compare MountingPoint  
diff dashboard/src/components/Sidebar/MountingPoint.tsx \
     saleor-dashboard/src/components/Sidebar/MountingPoint.tsx

# Compare Content
diff dashboard/src/components/Sidebar/Content.tsx \
     saleor-dashboard/src/components/Sidebar/Content.tsx

# Compare ProductTypeVariantAttributes
diff dashboard/src/productTypes/components/ProductTypeVariantAttributes/ProductTypeVariantAttributes.tsx \
     saleor-dashboard/src/productTypes/components/ProductTypeVariantAttributes/ProductTypeVariantAttributes.tsx
```

**Decision**:
- If official version is identical or our version is better → Keep ours
- If official version has improvements → Merge manually
- If official version is significantly different → Review carefully

### Step 3: Copy Product Assignment Modals

```bash
# Copy ShippingMethodProductsAddDialog
cp saleor-dashboard/src/shipping/components/ShippingMethodProductsAddDialog/ShippingMethodProductsAddDialog.tsx \
   dashboard/src/shipping/components/ShippingMethodProductsAddDialog/

# Copy ShippingMethodProducts
cp saleor-dashboard/src/shipping/components/ShippingMethodProducts/ShippingMethodProducts.tsx \
   dashboard/src/shipping/components/ShippingMethodProducts/
```

**Check**: Do you have custom modifications in these files? If yes, merge them.

### Step 4: Find and Copy Info Icon Files

```bash
# Search for info icons in new version
cd saleor-dashboard
find src/products -name "*.tsx" -exec grep -l "InfoIcon\|Info.*icon" {} \;
```

Then copy those files to your dashboard.

### Step 5: Copy Transaction Card Updates

```bash
cp saleor-dashboard/src/orders/components/OrderSummary/TransactionsApiButtons.tsx \
   dashboard/src/orders/components/OrderSummary/
```

### Step 6: Copy Other Bug Fixes

Copy the filter and tooltip fix files if they exist.

---

## ⚠️ Important: Check for Custom Modifications

Before copying any file, check if you've customized it:

```bash
# Check git history or compare with a clean version
git diff HEAD saleor-dashboard/src/shipping/components/ShippingMethodProductsAddDialog/ShippingMethodProductsAddDialog.tsx
```

**If you have customizations**:
1. Copy the new file to a temporary location
2. Use a merge tool (VS Code, Git merge, etc.)
3. Manually merge your customizations with new changes
4. Test thoroughly

---

## 📝 Copy Commands (Windows PowerShell)

```powershell
# Navigate to project root
cd C:\Users\micha\saleor-platform

# Backup
Copy-Item -Path dashboard -Destination "dashboard-backup-$(Get-Date -Format 'yyyyMMdd')" -Recurse

# Copy product assignment modal
Copy-Item -Path "saleor-dashboard\src\shipping\components\ShippingMethodProductsAddDialog\ShippingMethodProductsAddDialog.tsx" `
          -Destination "dashboard\src\shipping\components\ShippingMethodProductsAddDialog\"

# Copy transaction buttons
Copy-Item -Path "saleor-dashboard\src\orders\components\OrderSummary\TransactionsApiButtons.tsx" `
          -Destination "dashboard\src\orders\components\OrderSummary\"
```

---

## ✅ Verification After Copying

1. **Build the project**:
   ```bash
   cd dashboard
   pnpm install
   pnpm build
   ```

2. **Check for TypeScript errors**:
   ```bash
   pnpm check-types
   ```

3. **Check for linting errors**:
   ```bash
   pnpm lint
   ```

4. **Test the features**:
   - [ ] Product assignment modal has Filter button
   - [ ] Info icons are 16px in Product details
   - [ ] Transaction cards show Capture button
   - [ ] Metadata dialogs still show confirmation (our change)
   - [ ] Cloud link still appears on logo hover (our change)

---

## 🚨 If Something Breaks

1. **Restore from backup**:
   ```bash
   rm -rf dashboard
   cp -r dashboard-backup-YYYYMMDD dashboard
   ```

2. **Copy files one at a time** and test after each copy

3. **Use git** to track changes:
   ```bash
   cd dashboard
   git add .
   git commit -m "Update to 3.22.24"
   ```

---

## 📋 Summary Checklist

- [ ] Backup current dashboard
- [ ] Compare our 4 modified files with new version
- [ ] Copy ShippingMethodProductsAddDialog.tsx
- [ ] Copy ShippingMethodProducts.tsx  
- [ ] Find and copy info icon files
- [ ] Copy TransactionsApiButtons.tsx
- [ ] Copy other bug fix files
- [ ] Run `pnpm install` (check for new dependencies)
- [ ] Run `pnpm build` (check for errors)
- [ ] Run `pnpm check-types` (check TypeScript)
- [ ] Run `pnpm lint` (check linting)
- [ ] Test all features
- [ ] Commit changes

---

**Ready to copy?** Start with Step 1 (backup) and Step 2 (compare our modified files).

