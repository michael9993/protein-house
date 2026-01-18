# Saleor Dashboard Upgrade Analysis: v3.22.1 → v3.22.24

**Current Version**: 3.22.20  
**Target Version**: 3.22.24  
**Date**: December 2024

---

## Summary

This document analyzes the changes between Saleor Dashboard versions 3.22.1 and 3.22.24 based on the CHANGELOG.md. The analysis focuses on **source code changes only** (src/ files and related configuration), excluding git-related files.

---

## Key Changes by Version

### Version 3.22.20 (Current)

**Status**: ✅ **ALREADY IMPLEMENTED**

1. **Added "Allow legacy gift card use" flag to Channel configuration**
   - **Files Changed**:
     - `src/channels/components/ChannelForm/AllowLegacyGiftCardUse.tsx` ✅
     - `src/channels/components/ChannelForm/ChannelForm.tsx` ✅
     - `src/channels/components/ChannelForm/messages.ts` ✅
     - `src/channels/pages/ChannelDetailsPage/ChannelDetailsPage.tsx` ✅
     - `src/channels/views/ChannelDetails/ChannelDetails.tsx` ✅
     - `src/channels/views/ChannelCreate/ChannelCreate.tsx` ✅
   - **GraphQL**: Already in staging schema
   - **Action**: No changes needed

2. **Updated `@saleor/macaw-ui-next` to 1.4.1**
   - **File**: `package.json` line 85
   - **Current**: `"@saleor/macaw-ui-next": "npm:@saleor/macaw-ui@1.4.1"` ✅
   - **Action**: Already updated

---

### Version 3.22.19

**Status**: ⚠️ **PARTIALLY IMPLEMENTED** - Needs verification

1. **Update app-sdk package to 1.4.0 → 1.5.0**
   - **File**: `package.json`
   - **Current**: `"@saleor/app-sdk": "1.5.0"` ✅
   - **Action**: Already updated

2. **Changed Address component to use modern MacawUI text inputs**
   - **Files to Check**:
     - `src/components/AddressEdit/AddressEdit.tsx`
     - `src/components/AddressFormatter/AddressFormatter.tsx`
   - **Action**: Verify these use modern MacawUI components

3. **Icons overhaul part 1: Removed some old icons with fresh Lucide icons**
   - **Files Affected**: Multiple files using old icon components
   - **Action**: Review and update icon imports

4. **Fixed attribute tooltip icon size**
   - **Files**: Attribute-related components
   - **Action**: Check attribute tooltip components

5. **Fix sizing of the main datagrid based views**
   - **Files**: Datagrid components
   - **Action**: Review datagrid sizing

---

### Version 3.22.18

**Status**: ✅ **ALREADY IMPLEMENTED**

1. **Configured build to minify built code**
   - **File**: `vite.config.js` line 254
   - **Current**: `minify: true` ✅
   - **Action**: No changes needed

2. **Enabled React Strict mode for development**
   - **File**: `src/index.tsx` lines 348-360
   - **Current**: StrictMode is conditionally enabled ✅
   - **Action**: No changes needed

---

### Version 3.22.17

**Status**: ⚠️ **NEEDS VERIFICATION**

1. **Fix bug where TRANSLATION_MORE_ACTIONS extension mount didn't send event if translation was empty**
   - **Files**: Translation extension components
   - **Action**: Check translation extension mount points

---

### Version 3.22.16

**Status**: ⚠️ **NEEDS VERIFICATION**

1. **Fixed broken permissions on product edit page**
   - **Files**: Product edit page, attribute queries
   - **Action**: Verify attribute queries don't fetch privateMetadata unnecessarily

---

### Version 3.22.15

**Status**: ⚠️ **MULTIPLE FIXES NEEDED**

1. **Fixed shipping weight field not appearing when editing simple products**
   - **Files**: Product edit page, variant forms
   - **Action**: Verify weight field handling

2. **Refactor PaymentsSummary component**
   - **Files**: Order details, payments components
   - **Action**: Review payments summary implementation

3. **Fixes order value for tax**
   - **Files**: Order details, tax calculation
   - **Action**: Verify tax calculations

4. **Adjust CustomerDetailsPage to trigger single mutation when metadata changes**
   - **Files**: Customer details page
   - **Action**: Review metadata update logic

5. **Add `Go to/Create Product Type` entry to the Cmd+K menu**
   - **Files**: Command menu/navigator
   - **Action**: Add product type entry

---

### Version 3.22.14

**Status**: ⚠️ **MAJOR REDESIGN**

1. **Redesign order details payments and transactions section**
   - **New Component**: `OrderSummary` component
   - **Files Affected**:
     - Order details page
     - Payments components
     - Transaction components
   - **Action**: **HIGH PRIORITY** - Major UI change, needs careful implementation

2. **Remove focus border from datagrid cells**
   - **Files**: Datagrid components
   - **Action**: Set `drawFocusRing={false}` on DataEditor

3. **Fixed bug with App (with extensions) installation**
   - **Files**: App installation/validation
   - **Action**: Review app extension validation

---

### Version 3.22.13

**Status**: ⚠️ **MULTIPLE FIXES**

1. **Fix visual regressions in datagrid**
   - **Files**: Datagrid components
   - **Action**: Review sort arrow and button order

2. **Dashboard now uses new API to filter appExtensions query - `mountName` instead `mount`**
   - **Files**: App extensions queries
   - **Action**: Update GraphQL queries to use `mountName`

3. **Fix row checkbox visibility in DataGrid**
   - **Files**: Datagrid components
   - **Action**: Override `rowMarkerTheme accentColor`

4. **Add fulfillment metadata editing**
   - **Files**: Order fulfillment components
   - **Action**: Add metadata button and modal

5. **Improve order details datagrid visual polish**
   - **Files**: Order details datagrid
   - **Action**: Multiple styling improvements

6. **Improve draft order line item management**
   - **Files**: Draft order components
   - **Action**: Add row action bar

---

### Version 3.22.12

**Status**: ⚠️ **MULTIPLE CHANGES**

1. **Metadata filters will now omit `value` if none is provided**
   - **Files**: Filter components (Products, Orders, etc.)
   - **Action**: Update metadata filter logic

2. **Improve datagrid UI styling**
   - **Files**: Datagrid components
   - **Action**: Multiple styling changes

3. **Add metadata button to order line datagrid**
   - **Files**: Order details, order lines
   - **Action**: Add metadata button

4. **Add order metadata dialog**
   - **Files**: Order details page
   - **Action**: Add Code icon button and metadata dialog

5. **Add support for Translation extensions (popup only)**
   - **Files**: Translation extension components
   - **Action**: Implement bi-directional communication

---

### Version 3.22.11

**Status**: ⚠️ **INFRASTRUCTURE CHANGES**

1. **Fixed broken sidebar app alert url**
   - **Files**: Sidebar, app alerts
   - **Action**: Fix URL routing

2. **Dropped support for node 18. Migrated npm to pnpm**
   - **Files**: `package.json`, `packageManager` field
   - **Current**: `"packageManager": "pnpm@10.23.0"` ✅
   - **Action**: Already using pnpm

---

### Version 3.22.10

**Status**: ⚠️ **EXTENSION CHANGES**

1. **Added new extension mount point: TRANSLATIONS_MORE_ACTIONS**
   - **Files**: Extension mount points, translation pages
   - **Action**: Add new mount point

2. **Fix warehouse assignment modal**
   - **Files**: Warehouse assignment components
   - **Action**: Fix duplicate prevention

3. **Added new API for communication between App and Dashboard**
   - **Files**: App extension communication
   - **Action**: Implement form state communication

---

### Version 3.22.9

**Status**: ⚠️ **FEATURES ADDED**

1. **Add email field on warehouse details page**
   - **Files**: Warehouse details page
   - **Action**: Add email field

2. **Switched to new AppExtension fields (mount -> mountName, target -> targetName)**
   - **Files**: App extension queries and components
   - **Action**: Update to use new field names

---

### Version 3.22.8-3.22.1

**Status**: ⚠️ **VARIOUS FIXES**

Multiple bug fixes and improvements. See CHANGELOG.md for details.

---

## Critical Files That Need Updates

### High Priority (Breaking Changes / Major Features)

1. **Order Details Payments Redesign (3.22.14)**
   - **Files**:
     - `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx`
     - `src/orders/views/OrderDetails/` (multiple files)
     - New: `src/orders/components/OrderSummary/OrderSummary.tsx` (if new component)
   - **Impact**: Major UI change
   - **Risk**: High - affects order management

2. **App Extension API Changes (3.22.9, 3.22.13)**
   - **Files**:
     - All files using `mount` → change to `mountName`
     - All files using `target` → change to `targetName`
     - All files using `options` → change to `settings`
   - **Impact**: Breaking change for extensions
   - **Risk**: Medium - affects app functionality

3. **Metadata Filter Changes (3.22.12)**
   - **Files**:
     - Filter components for Products, Orders, Customers
     - Metadata filter validation
   - **Impact**: Filter behavior change
   - **Risk**: Medium - affects filtering

### Medium Priority (UI Improvements)

4. **Datagrid UI Improvements (3.22.12, 3.22.13)**
   - **Files**: All datagrid components
   - **Changes**:
     - Remove focus border (`drawFocusRing={false}`)
     - Fix checkbox visibility
     - Improve styling
   - **Impact**: Visual improvements
   - **Risk**: Low

5. **Address Component Modernization (3.22.19)**
   - **Files**:
     - `src/components/AddressEdit/AddressEdit.tsx`
   - **Action**: Verify uses modern MacawUI inputs
   - **Impact**: UI consistency
   - **Risk**: Low

6. **Icons Overhaul (3.22.19)**
   - **Files**: Multiple files using old icons
   - **Action**: Replace with Lucide icons
   - **Impact**: Visual consistency
   - **Risk**: Low

### Low Priority (Bug Fixes)

7. **Various Bug Fixes**
   - Shipping weight field (3.22.15)
   - Product edit permissions (3.22.16)
   - Translation extensions (3.22.17)
   - Warehouse assignment (3.22.10)
   - And many more...

---

## Implementation Checklist

### Phase 1: Critical Updates (Do First)

- [ ] **Update package.json version to 3.22.24**
- [ ] **Review and implement Order Details Payments Redesign (3.22.14)**
  - Check if `OrderSummary` component exists
  - Review order details page structure
  - Implement new two-column layout
- [ ] **Update App Extension API fields**
  - Search for `mount` → replace with `mountName`
  - Search for `target` → replace with `targetName`
  - Search for `options` → replace with `settings`
- [ ] **Update metadata filter logic (3.22.12)**
  - Make `value` optional in metadata filters
  - Add validation for `key` requirement

### Phase 2: UI Improvements

- [ ] **Update Address component to modern MacawUI (3.22.19)**
- [ ] **Fix datagrid focus border (3.22.13)**
- [ ] **Fix datagrid checkbox visibility (3.22.13)**
- [ ] **Add fulfillment metadata editing (3.22.13)**
- [ ] **Add order metadata dialog (3.22.12)**
- [ ] **Improve datagrid styling (3.22.12)**

### Phase 3: Bug Fixes

- [ ] **Fix shipping weight field (3.22.15)**
- [ ] **Fix product edit permissions (3.22.16)**
- [ ] **Fix translation extension bug (3.22.17)**
- [ ] **Fix warehouse assignment modal (3.22.10)**
- [ ] **Add email field to warehouse (3.22.9)**
- [ ] **Add Product Type to Cmd+K menu (3.22.15)**

### Phase 4: Verification

- [ ] **Test order details page**
- [ ] **Test app extensions**
- [ ] **Test metadata filters**
- [ ] **Test datagrid functionality**
- [ ] **Verify all icons are updated**
- [ ] **Run type checking**
- [ ] **Run linting**

---

## Files to Review/Update

### Configuration Files

1. `package.json` - Version and dependencies
2. `vite.config.js` - Build configuration (already has minify: true)

### Source Files by Category

#### Channel Configuration
- `src/channels/components/ChannelForm/ChannelForm.tsx` ✅ (Already updated)
- `src/channels/components/ChannelForm/AllowLegacyGiftCardUse.tsx` ✅ (Already updated)
- `src/channels/pages/ChannelDetailsPage/ChannelDetailsPage.tsx` ✅ (Already updated)

#### Order Management
- `src/orders/components/OrderDetailsPage/OrderDetailsPage.tsx` ⚠️ (Needs review for 3.22.14)
- `src/orders/views/OrderDetails/` (multiple files) ⚠️
- `src/orders/components/OrderSummary/` (may be new) ⚠️
- `src/orders/components/PaymentsSummary/` ⚠️ (3.22.15 refactor)

#### Datagrid Components
- All datagrid files in `src/` ⚠️ (Multiple improvements)

#### App Extensions
- `src/extensions/` (all files) ⚠️ (API field changes)
- Extension mount points ⚠️

#### Address Components
- `src/components/AddressEdit/AddressEdit.tsx` ⚠️ (3.22.19)
- `src/components/AddressFormatter/AddressFormatter.tsx` ⚠️

#### Filter Components
- Product filters ⚠️ (3.22.12 metadata changes)
- Order filters ⚠️
- Customer filters ⚠️

#### Translation Components
- Translation extension components ⚠️ (3.22.17, 3.22.10)

#### Warehouse Components
- Warehouse details page ⚠️ (3.22.9 email field)
- Warehouse assignment modal ⚠️ (3.22.10 fix)

---

## Dependencies to Verify

Current versions in `package.json`:
- `@saleor/macaw-ui-next`: `1.4.1` ✅ (3.22.20)
- `@saleor/app-sdk`: `1.5.0` ✅ (3.22.19)
- React: `18.3.1` ✅
- Node: `^20 || ^22` ✅ (3.22.11 dropped node 18)

---

## Notes

1. **Version Gap**: The CHANGELOG.md only shows up to version 3.22.20. Versions 3.22.21-3.22.24 may have additional changes not documented in the changelog, or they may be patch releases with minimal changes.

2. **GraphQL Schema**: Some changes require GraphQL schema updates. Ensure the Saleor API backend is updated to match.

3. **Testing**: After implementing changes, thoroughly test:
   - Order management (especially payments section)
   - App extensions
   - Metadata filters
   - Datagrid functionality
   - Channel configuration

4. **Backward Compatibility**: Some changes (like App Extension API) are breaking. Ensure all custom apps/extensions are updated.

---

## Recommended Approach

1. **Start with package.json**: Update version to 3.22.24
2. **Review major changes first**: Order details redesign, App Extension API
3. **Test incrementally**: After each major change, test functionality
4. **Use git branches**: Create a branch for the upgrade to easily revert if needed
5. **Document custom changes**: Note any customizations that conflict with updates

---

## Next Steps

1. Review this document
2. Identify which changes are most critical for your use case
3. Create a branch for the upgrade
4. Start with Phase 1 (Critical Updates)
5. Test thoroughly after each phase
6. Merge when all tests pass

---

**Generated**: December 2024  
**Based on**: CHANGELOG.md analysis

