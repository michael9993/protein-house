# Saleor Dashboard Releases 3.22.21 - 3.22.24

**Source**: [GitHub Releases](https://github.com/saleor/saleor-dashboard/releases)  
**Current Version**: 3.22.20  
**Target Version**: 3.22.24  
**Date**: January 2025

---

## Version 3.22.24 (Latest - 09 Jan 2025)

### Patch Changes

1. **#6238** - Fixed broken question mark icons in Product Type variant attributes view

   - **Status**: ⚠️ **NEEDS VERIFICATION**
   - **File**: `src/productTypes/components/ProductTypeVariantAttributes/ProductTypeVariantAttributes.tsx`
   - **Note**: Component already uses `CircleQuestionMark` icon (line 246), but may need icon fix

2. **#6233** - Fixed info icon sizing and alignment in Product details view attributes

   - **Status**: ⚠️ **NEEDS VERIFICATION**
   - **Files**: Product details view, attribute components
   - **Change**: Info icons should be consistently 16px and properly aligned with text labels

3. **#6225** - Move Cloud env link to the Saleor Dashboard top-left logo hover state

   - **Status**: ⚠️ **NEEDS IMPLEMENTATION**
   - **Files**: Top navigation, logo component
   - **Change**: Cloud environment link should appear on logo hover instead of separate location

4. **#6165** - Modals for assigning Products will now show Filter button
   - **Status**: ⚠️ **NEEDS IMPLEMENTATION**
   - **Files**: Product assignment modals (e.g., `ShippingMethodProductsAddDialog.tsx`)
   - **Change**: Add filter functionality to product assignment modals with same conditions as Product list page
   - **Note**: Should display constraints based on context (e.g., limited Product type filter based on Reference Types config)

---

## Version 3.22.23 (18 Dec 2024)

### Patch Changes

1. **#6227** - Added confirmation dialog ("Leave without saving changes?") to prevent accidental data loss when closing metadata dialogs with unsaved changes

   - **Status**: ⚠️ **NEEDS IMPLEMENTATION**
   - **Files**:
     - `src/orders/components/OrderMetadataDialog/OrderMetadataDialog.tsx`
     - Order fulfillment metadata dialog
     - Order line metadata dialog
   - **Change**: Add exit confirmation when there are unsaved changes

2. **#6224** - Use Tooltip component for info icon and dates in timeline

   - **Status**: ⚠️ **NEEDS VERIFICATION**
   - **Files**: Timeline components, info icon components
   - **Change**: Replace existing tooltip implementation with Tooltip component

3. **#6223** - Fix removing saved filters

   - **Status**: ⚠️ **NEEDS VERIFICATION**
   - **Files**: Filter components, saved filters functionality
   - **Change**: Fix bug when removing saved filter presets

4. **#6222** - Remove redundant elements in the main titles
   - **Status**: ⚠️ **NEEDS VERIFICATION**
   - **Files**: Page title components, main layout
   - **Change**: Clean up redundant UI elements in page titles

---

## Version 3.22.22 (17 Dec 2024)

### Patch Changes

1. **#6217** - Transaction actions: The Capture button is now directly visible on transaction cards for quicker access, while destructive actions like Cancel remain safely tucked in the menu

   - **Status**: ⚠️ **NEEDS VERIFICATION**
   - **Files**: Transaction card components, order details
   - **Change**: Move Capture button to be directly visible on transaction cards

2. **#6178** - Update order Transactions cards

   - **Status**: ⚠️ **NEEDS VERIFICATION**
   - **Files**: Order transaction components
   - **Change**: UI updates to transaction cards

3. **#6189** - Introduced a redesigned "Order summary" section that unifies order details and payment information across all order types, including Drafts and Unconfirmed orders
   - **Status**: ✅ **ALREADY IMPLEMENTED** (from 3.22.14)
   - **Files**: `src/orders/components/OrderSummary/OrderSummary.tsx`
   - **Note**: This appears to be a continuation/improvement of the 3.22.14 redesign

---

## Version 3.22.21 (Date not shown in releases)

### Patch Changes

Based on the release notes, this version includes:

- Improvements to Order summary section
- Automatic checkout completion settings (now controllable from dashboard settings page)
- Previously only available via GraphQL, now accessible via UI

**Status**: ⚠️ **NEEDS VERIFICATION**

---

## Implementation Priority

### High Priority (User-Facing Features)

1. **#6165** - Product assignment modal filters

   - **Impact**: Improves UX when assigning products
   - **Files**: `src/shipping/components/ShippingMethodProductsAddDialog/ShippingMethodProductsAddDialog.tsx` and similar modals

2. **#6227** - Metadata dialog confirmation dialogs

   - **Impact**: Prevents accidental data loss
   - **Files**: Order metadata dialogs

3. **#6225** - Cloud env link on logo hover
   - **Impact**: UI improvement
   - **Files**: Top navigation/logo component

### Medium Priority (Bug Fixes)

4. **#6238** - Fix broken question mark icons

   - **Impact**: Visual bug fix
   - **Files**: Product Type variant attributes

5. **#6233** - Fix info icon sizing

   - **Impact**: Visual consistency
   - **Files**: Product details attributes

6. **#6223** - Fix removing saved filters
   - **Impact**: Bug fix
   - **Files**: Filter components

### Low Priority (UI Polish)

7. **#6224** - Use Tooltip component
8. **#6222** - Remove redundant title elements
9. **#6217** - Transaction card Capture button visibility
10. **#6178** - Update transaction cards

---

## Files to Check/Update

### Product Assignment Modals

- `src/shipping/components/ShippingMethodProductsAddDialog/ShippingMethodProductsAddDialog.tsx`
- Other product assignment dialogs

### Metadata Dialogs

- `src/orders/components/OrderMetadataDialog/OrderMetadataDialog.tsx`
- `src/orders/components/OrderLineMetadataDialog/OrderLineMetadataDialog.tsx`
- Order fulfillment metadata dialog

### Navigation/Logo

- Top navigation component
- Logo component with hover state

### Product Details

- Product details view attributes
- Info icon components

### Transaction Cards

- Transaction card components
- Order details transaction section

---

## Next Steps

1. **Verify existing implementations** - Check if any of these changes are already implemented
2. **Implement high-priority features** - Start with product assignment filters and metadata dialog confirmations
3. **Fix visual bugs** - Address icon sizing and alignment issues
4. **Test thoroughly** - Ensure all changes work correctly

---

## Reference

- **GitHub Releases**: https://github.com/saleor/saleor-dashboard/releases
- **Full Changelog**: See `dashboard/CHANGELOG.md` for versions 3.22.1-3.22.20
