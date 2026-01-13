# Copy These Files Now - Quick Guide

**Source**: `C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24`  
**Target**: `C:\Users\micha\saleor-platform\dashboard`

---

## 🎯 Files to Copy (3 files/directories)

### 1. MountingPoint.tsx ⭐ RECOMMENDED

**Why**: Official version has better UX (cloud icon visible on hover)

```powershell
Copy-Item "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24\src\components\Sidebar\MountingPoint.tsx" `
          "C:\Users\micha\saleor-platform\dashboard\src\components\Sidebar\MountingPoint.tsx" -Force
```

---

### 2. AssignProductDialog Directory ⭐ NEW FEATURE

**Why**: This is the NEW component with Filter button feature (#6165)

```powershell
# Remove old if exists, then copy new
if (Test-Path "C:\Users\micha\saleor-platform\dashboard\src\components\AssignProductDialog") {
    Remove-Item "C:\Users\micha\saleor-platform\dashboard\src\components\AssignProductDialog" -Recurse -Force
}
Copy-Item "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24\src\components\AssignProductDialog" `
          "C:\Users\micha\saleor-platform\dashboard\src\components\AssignProductDialog" -Recurse
```

**What this adds**: Full filter functionality for product assignment modals

---

### 3. MetadataDialog.tsx (OPTIONAL)

**Why**: Uses cleaner `ExitFormDialog` component

```powershell
Copy-Item "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24\src\components\MetadataDialog\MetadataDialog.tsx" `
          "C:\Users\micha\saleor-platform\dashboard\src\components\MetadataDialog\MetadataDialog.tsx" -Force
```

**Note**: Our version works, but official is cleaner. Your choice.

---

## ✅ Files Already Correct (No Copy Needed)

- ✅ `Content.tsx` - Already matches
- ✅ `ProductTypeVariantAttributes.tsx` - Already has icon fix
- ✅ `TransactionsApiButtons.tsx` - Already matches

---

## 🚀 Quick Copy (All at Once)

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

# 3. MetadataDialog (optional - uncomment if you want)
# Copy-Item "$source\src\components\MetadataDialog\MetadataDialog.tsx" "$target\src\components\MetadataDialog\MetadataDialog.tsx" -Force

Write-Host "Done! Files copied." -ForegroundColor Green
```

---

## ✅ After Copying

```powershell
cd dashboard
pnpm check-types
pnpm lint
```

---

**That's it!** Copy those 2-3 items and you're done.

