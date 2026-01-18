# Final Copy Instructions: 3.22.24

**Source**: `C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24`  
**Target**: `C:\Users\micha\saleor-platform\dashboard`

---

## ✅ Files to Copy (In Order)

### 1. MountingPoint.tsx (RECOMMENDED - Better UX)

**Why**: Official version has better implementation (cloud icon visible on hover vs hidden tooltip)

**Copy Command**:
```powershell
Copy-Item "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24\src\components\Sidebar\MountingPoint.tsx" `
          "C:\Users\micha\saleor-platform\dashboard\src\components\Sidebar\MountingPoint.tsx"
```

**What Changes**: 
- Cloud icon appears next to "Saleor Dashboard" text on hover
- Uses opacity transition (smoother UX)
- Icon is always visible when hovering, not hidden in tooltip

---

### 2. MetadataDialog.tsx (OPTIONAL - Cleaner Code)

**Why**: Official version uses `ExitFormDialog` component (cleaner than our custom implementation)

**Copy Command**:
```powershell
Copy-Item "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24\src\components\MetadataDialog\MetadataDialog.tsx" `
          "C:\Users\micha\saleor-platform\dashboard\src\components\MetadataDialog\MetadataDialog.tsx"
```

**What Changes**: 
- Uses existing `ExitFormDialog` component instead of custom modal
- Cleaner code, same functionality

**Note**: Our version works fine, but official is cleaner. Your choice.

---

### 3. TransactionsApiButtons.tsx (SAFE TO COPY)

**Why**: Simple file, no conflicts

**Copy Command**:
```powershell
Copy-Item "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24\src\orders\components\OrderSummary\TransactionsApiButtons.tsx" `
          "C:\Users\micha\saleor-platform\dashboard\src\orders\components\OrderSummary\TransactionsApiButtons.tsx"
```

---

### 4. AssignProductDialog Component (NEW FEATURE - Filter Support)

**Why**: This is the new component with Filter button feature (#6165)

**Copy Entire Directory**:
```powershell
# Copy the entire AssignProductDialog component
Copy-Item "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24\src\components\AssignProductDialog" `
          "C:\Users\micha\saleor-platform\dashboard\src\components\AssignProductDialog" -Recurse
```

**Files Included**:
- `AssignProductDialog.tsx`
- `AssignProductDialogMulti.tsx`
- `AssignProductDialogSingle.tsx`
- `ModalFilters.tsx` ← **This has the Filter button!**
- `ModalProductFilterProvider.tsx`
- `useModalProductFilter.ts`
- `useModalUrlValueProvider.ts`
- `types.ts`, `messages.ts`, `styles.ts`, `utils.ts`, etc.

**Note**: This is a NEW component. Your shipping component still uses the old `ShippingMethodProductsAddDialog`. You may want to migrate to this new component later, or it might be used by other parts of the app.

---

## ⚠️ Files We Modified - Comparison Results

### Content.tsx
- ✅ **Identical** - Both removed EnvironmentLink
- **Action**: No change needed

### ProductTypeVariantAttributes.tsx  
- ✅ **Identical** - Both have icon size fix
- **Action**: No change needed

---

## 📋 Complete Copy Script

Save this as `copy-files.ps1` and run it:

```powershell
# Set paths
$source = "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24"
$target = "C:\Users\micha\saleor-platform\dashboard"

Write-Host "Copying files from 3.22.24..." -ForegroundColor Green

# 1. MountingPoint (recommended)
Write-Host "Copying MountingPoint.tsx..." -ForegroundColor Yellow
Copy-Item "$source\src\components\Sidebar\MountingPoint.tsx" `
          "$target\src\components\Sidebar\MountingPoint.tsx" -Force

# 2. MetadataDialog (optional - uncomment if you want)
# Write-Host "Copying MetadataDialog.tsx..." -ForegroundColor Yellow
# Copy-Item "$source\src\components\MetadataDialog\MetadataDialog.tsx" `
#           "$target\src\components\MetadataDialog\MetadataDialog.tsx" -Force

# 3. TransactionsApiButtons
Write-Host "Copying TransactionsApiButtons.tsx..." -ForegroundColor Yellow
Copy-Item "$source\src\orders\components\OrderSummary\TransactionsApiButtons.tsx" `
          "$target\src\orders\components\OrderSummary\TransactionsApiButtons.tsx" -Force

# 4. AssignProductDialog (new component with filters)
Write-Host "Copying AssignProductDialog component..." -ForegroundColor Yellow
if (Test-Path "$target\src\components\AssignProductDialog") {
    Remove-Item "$target\src\components\AssignProductDialog" -Recurse -Force
}
Copy-Item "$source\src\components\AssignProductDialog" `
          "$target\src\components\AssignProductDialog" -Recurse

Write-Host "`nDone! Files copied successfully." -ForegroundColor Green
Write-Host "Next: Run 'pnpm check-types' and 'pnpm lint' to verify." -ForegroundColor Yellow
```

---

## 🔍 About the Filter Button Feature

The Filter button feature (#6165) is in the **NEW** `AssignProductDialog` component, not in `ShippingMethodProductsAddDialog`.

**What this means**:
- The new `AssignProductDialog` component has full filter support
- Your shipping component still uses the old `ShippingMethodProductsAddDialog` (no filters)
- Other parts of the app may use the new `AssignProductDialog` with filters
- You can migrate shipping to use `AssignProductDialog` later if needed

**Files to copy for Filter feature**:
- Entire `src/components/AssignProductDialog/` directory

---

## ✅ After Copying

1. **Check TypeScript**:
   ```powershell
   cd dashboard
   pnpm check-types
   ```

2. **Check Linting**:
   ```powershell
   pnpm lint
   ```

3. **Test Features**:
   - Hover over logo → Cloud icon should appear
   - Open metadata dialog → Should show confirmation on close
   - Check transaction cards → Capture button should be visible

---

## 📝 Summary

**Must Copy**:
1. ✅ `MountingPoint.tsx` (better UX)
2. ✅ `TransactionsApiButtons.tsx` (safe)
3. ✅ `AssignProductDialog/` directory (new filter feature)

**Optional**:
- `MetadataDialog.tsx` (cleaner code, but ours works)

**No Change Needed**:
- `Content.tsx` (already correct)
- `ProductTypeVariantAttributes.tsx` (already correct)

---

**Ready to copy?** Run the PowerShell script above or copy files manually.

