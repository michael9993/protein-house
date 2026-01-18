# File Comparison Results: 3.22.20 vs 3.22.24

**Date**: January 2025  
**Comparison**: Your dashboard vs Official 3.22.24

---

## 🔍 Comparison Results

### Files We Modified - Comparison

#### 1. MetadataDialog.tsx

**Our Version**: Custom confirmation dialog implementation  
**Official Version**: Uses `ExitFormDialog` component (cleaner approach)

**Recommendation**: 
- ✅ **Keep our version** OR
- 🔄 **Update to use ExitFormDialog** (cleaner, uses existing component)

**Official Implementation**:
```typescript
import ExitFormDialog from "@dashboard/components/Form/ExitFormDialog";
// Uses ExitFormDialog component instead of custom modal
```

**Action**: Your implementation works, but official version is cleaner. Consider updating.

---

#### 2. MountingPoint.tsx

**Our Version**: Tooltip on logo with Cloud link  
**Official Version**: Cloud icon appears on hover with opacity transition (next to logo text)

**Differences**:
- Official: Cloud icon appears next to "Saleor Dashboard" text on hover
- Ours: Tooltip on logo itself

**Recommendation**: 
- 🔄 **Update to official version** - Better UX (icon visible on hover, not hidden in tooltip)

**Official Implementation**:
- Cloud icon appears with opacity transition when hovering over the entire Box
- Icon is next to text, not on logo
- Uses `isHovered` state with opacity transition

**Action**: Copy official version - it's a better implementation.

---

#### 3. Content.tsx

**Our Version**: Removed EnvironmentLink  
**Official Version**: Also removed EnvironmentLink ✅

**Status**: ✅ **Identical** - Both removed the link from bottom

**Action**: No change needed.

---

#### 4. ProductTypeVariantAttributes.tsx

**Our Version**: Fixed icon with `size={iconSize.small}`  
**Official Version**: Same fix ✅

**Status**: ✅ **Identical** - Both have the icon size fix

**Action**: No change needed.

---

## 📋 Files to Copy

### ✅ Must Copy (New Features)

#### 1. TransactionsApiButtons.tsx

**File**: `src/orders/components/OrderSummary/TransactionsApiButtons.tsx`

**Status**: Simple file, safe to copy  
**What it does**: Shows "Mark as Paid" button

**Action**: ✅ **Copy this file**

---

### ⚠️ Product Assignment Modal - No Filter Button Found

**File**: `src/shipping/components/ShippingMethodProductsAddDialog/ShippingMethodProductsAddDialog.tsx`

**Status**: ⚠️ **No Filter button in this file**

**Investigation**: The release notes mention Filter button (#6165), but it's not in this file. It might be:
1. In a different product assignment modal
2. In a wrapper component
3. Added in a later version

**Action**: 
- Check other product assignment modals:
  - Category product assignment
  - Collection product assignment  
  - Voucher product assignment
  - Promotion product assignment

**Search command**:
```powershell
Get-ChildItem -Path "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24\src" -Recurse -Include *Product*Dialog*.tsx | Select-String -Pattern "Filter|filter"
```

---

## 🎯 Recommended Actions

### Priority 1: Update MountingPoint.tsx

**Why**: Official version has better UX (visible icon on hover vs hidden tooltip)

**Action**: Copy official version

---

### Priority 2: Update MetadataDialog.tsx

**Why**: Official version uses existing ExitFormDialog component (cleaner code)

**Action**: Update to use ExitFormDialog (or keep ours if you prefer)

---

### Priority 3: Copy TransactionsApiButtons.tsx

**Why**: Simple file, safe to copy

**Action**: Copy directly

---

### Priority 4: Find Filter Button Feature

**Why**: Release notes mention it but not found in ShippingMethodProductsAddDialog

**Action**: Search other product assignment modals

---

## 📝 Copy Commands

### Update MountingPoint.tsx (Recommended)

```powershell
Copy-Item "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24\src\components\Sidebar\MountingPoint.tsx" `
          "C:\Users\micha\saleor-platform\dashboard\src\components\Sidebar\MountingPoint.tsx"
```

### Update MetadataDialog.tsx (Optional - cleaner code)

```powershell
Copy-Item "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24\src\components\MetadataDialog\MetadataDialog.tsx" `
          "C:\Users\micha\saleor-platform\dashboard\src\components\MetadataDialog\MetadataDialog.tsx"
```

### Copy TransactionsApiButtons.tsx

```powershell
Copy-Item "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24\src\orders\components\OrderSummary\TransactionsApiButtons.tsx" `
          "C:\Users\micha\saleor-platform\dashboard\src\orders\components\OrderSummary\TransactionsApiButtons.tsx"
```

---

## 🔍 Search for Filter Button

```powershell
cd "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24"
Get-ChildItem -Path src -Recurse -Include *.tsx | 
    Select-String -Pattern "Filter.*button|FilterButton|assign.*product.*filter" -CaseSensitive:$false |
    Select-Object -First 20
```

---

## ✅ Summary

**Files to Copy**:
1. ✅ `MountingPoint.tsx` - Better UX (recommended)
2. ⚠️ `MetadataDialog.tsx` - Cleaner code (optional)
3. ✅ `TransactionsApiButtons.tsx` - Safe to copy
4. ❓ Find Filter button in other modals

**Files to Keep**:
- ✅ `Content.tsx` - Already correct
- ✅ `ProductTypeVariantAttributes.tsx` - Already correct

---

**Next Step**: Copy MountingPoint.tsx and TransactionsApiButtons.tsx, then search for Filter button feature.

