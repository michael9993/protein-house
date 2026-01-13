# PowerShell Script to Compare and Copy Files from Saleor Dashboard 3.22.24
# Usage: .\compare-files.ps1

$newVersionPath = "C:\Users\micha\Downloads\saleor-dashboard-3.22.24\saleor-dashboard-3.22.24"
$currentPath = "C:\Users\micha\saleor-platform\dashboard"

Write-Host "=== Comparing Files ===" -ForegroundColor Green

# Check if new version directory exists
if (-not (Test-Path $newVersionPath)) {
    Write-Host "ERROR: New version directory not found at: $newVersionPath" -ForegroundColor Red
    Write-Host "Please update the path in this script." -ForegroundColor Yellow
    exit 1
}

# Files we modified - compare only
$filesToCompare = @(
    "src\components\MetadataDialog\MetadataDialog.tsx",
    "src\components\Sidebar\MountingPoint.tsx",
    "src\components\Sidebar\Content.tsx",
    "src\productTypes\components\ProductTypeVariantAttributes\ProductTypeVariantAttributes.tsx"
)

Write-Host "`n=== Files We Modified (Compare Only) ===" -ForegroundColor Yellow
foreach ($file in $filesToCompare) {
    $oldFile = Join-Path $currentPath $file
    $newFile = Join-Path $newVersionPath $file
    
    if (Test-Path $oldFile) {
        if (Test-Path $newFile) {
            $oldContent = Get-Content $oldFile -Raw
            $newContent = Get-Content $newFile -Raw
            
            if ($oldContent -eq $newContent) {
                Write-Host "✓ $file - Identical" -ForegroundColor Green
            } else {
                Write-Host "⚠ $file - DIFFERENT (needs review)" -ForegroundColor Yellow
                Write-Host "  Old: $oldFile" -ForegroundColor Gray
                Write-Host "  New: $newFile" -ForegroundColor Gray
            }
        } else {
            Write-Host "✗ $file - Not found in new version" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ $file - Not found in current version" -ForegroundColor Red
    }
}

# Files to copy
$filesToCopy = @(
    "src\shipping\components\ShippingMethodProductsAddDialog\ShippingMethodProductsAddDialog.tsx",
    "src\shipping\components\ShippingMethodProducts\ShippingMethodProducts.tsx",
    "src\orders\components\OrderSummary\TransactionsApiButtons.tsx"
)

Write-Host "`n=== Files to Copy ===" -ForegroundColor Cyan
foreach ($file in $filesToCopy) {
    $oldFile = Join-Path $currentPath $file
    $newFile = Join-Path $newVersionPath $file
    
    if (Test-Path $newFile) {
        if (Test-Path $oldFile) {
            Write-Host "⚠ $file - EXISTS (will be overwritten)" -ForegroundColor Yellow
        } else {
            Write-Host "✓ $file - NEW FILE (will be copied)" -ForegroundColor Green
        }
    } else {
        Write-Host "✗ $file - Not found in new version" -ForegroundColor Red
    }
}

# Search for info icon files
Write-Host "`n=== Searching for Info Icon Files ===" -ForegroundColor Cyan
$infoIconFiles = Get-ChildItem -Path (Join-Path $newVersionPath "src\products") -Recurse -Include *.tsx | 
    ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        if ($content -match "InfoIcon|HelpCircle|CircleHelp|iconSize\.small.*16|size.*=.*16.*icon") {
            $relativePath = $_.FullName.Replace($newVersionPath + "\", "")
            Write-Host "  Found: $relativePath" -ForegroundColor Green
            $relativePath
        }
    }

if ($infoIconFiles.Count -eq 0) {
    Write-Host "  No info icon files found" -ForegroundColor Gray
}

Write-Host "`n=== Summary ===" -ForegroundColor Green
Write-Host "1. Review the files marked as DIFFERENT above" -ForegroundColor Yellow
Write-Host "2. Copy the files listed in 'Files to Copy' section" -ForegroundColor Yellow
Write-Host "3. Copy any info icon files found above" -ForegroundColor Yellow

