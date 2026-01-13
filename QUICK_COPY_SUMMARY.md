# Quick Copy Summary - 3.22.24

**You have**: Downloaded `saleor-dashboard-3.22.24`  
**You need**: Copy specific files to your `dashboard` directory

---

## 🎯 Copy These 2 Items

### 1. MountingPoint.tsx (Better UX)

**File**: `src/components/Sidebar/MountingPoint.tsx`

**Why**: Official version shows cloud icon on hover (better than our tooltip)

**Copy**:
```powershell
Copy-Item "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24\src\components\Sidebar\MountingPoint.tsx" `
          "C:\Users\micha\saleor-platform\dashboard\src\components\Sidebar\MountingPoint.tsx" -Force
```

---

### 2. AssignProductDialog Directory (NEW - Has Filter Button!)

**Directory**: `src/components/AssignProductDialog/`

**Why**: This is the NEW component with Filter button feature (#6165)

**Copy**:
```powershell
# Remove old if exists
if (Test-Path "C:\Users\micha\saleor-platform\dashboard\src\components\AssignProductDialog") {
    Remove-Item "C:\Users\micha\saleor-platform\dashboard\src\components\AssignProductDialog" -Recurse -Force
}

# Copy new
Copy-Item "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24\src\components\AssignProductDialog" `
          "C:\Users\micha\saleor-platform\dashboard\src\components\AssignProductDialog" -Recurse
```

**What this includes**:
- `ModalFilters.tsx` ← **This has the Filter button!**
- `AssignProductDialog.tsx`
- `AssignProductDialogMulti.tsx`
- `AssignProductDialogSingle.tsx`
- `ModalProductFilterProvider.tsx`
- And supporting files

**Note**: Your shipping component still uses old `ShippingMethodProductsAddDialog` (no filters). The new `AssignProductDialog` is used by other parts of the app.

---

## ⚠️ Optional: MetadataDialog.tsx

**File**: `src/components/MetadataDialog/MetadataDialog.tsx`

**Why**: Uses cleaner `ExitFormDialog` component

**Our version**: Works fine, uses custom confirmation dialog  
**Official version**: Uses existing `ExitFormDialog` component (cleaner)

**Your choice**: Keep ours or copy official (both work the same)

---

## ✅ Already Correct (No Copy Needed)

- ✅ `Content.tsx` - Already matches
- ✅ `ProductTypeVariantAttributes.tsx` - Already has icon fix  
- ✅ `TransactionsApiButtons.tsx` - Already matches

---

## 🚀 Copy All at Once

```powershell
$source = "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24"
$target = "C:\Users\micha\saleor-platform\dashboard"

# 1. MountingPoint
Copy-Item "$source\src\components\Sidebar\MountingPoint.tsx" "$target\src\components\Sidebar\MountingPoint.tsx" -Force

# 2. AssignProductDialog (new filter feature)
if (Test-Path "$target\src\components\AssignProductDialog") {
    Remove-Item "$target\src\components\AssignProductDialog" -Recurse -Force
}
Copy-Item "$source\src\components\AssignProductDialog" "$target\src\components\AssignProductDialog" -Recurse

Write-Host "Done! Files copied." -ForegroundColor Green
```

---

## ✅ Verify After Copying

```powershell
cd C:\Users\micha\saleor-platform\dashboard
pnpm check-types
pnpm lint
```

---

## 📋 Summary

**Must Copy**:
1. ✅ `MountingPoint.tsx` 
2. ✅ `AssignProductDialog/` directory (entire folder)

**Optional**:
- `MetadataDialog.tsx` (your choice)

**No Change**:
- Everything else is already correct

---

**That's it!** Just copy those 2 items.

