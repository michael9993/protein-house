# Saleor Dashboard Releases Summary: 3.22.21 - 3.22.24

**Source**: [GitHub Releases](https://github.com/saleor/saleor-dashboard/releases)  
**Analysis Date**: January 2025  
**Current Version**: 3.22.20  
**Target Version**: 3.22.24

---

## Overview

Based on the [GitHub releases page](https://github.com/saleor/saleor-dashboard/releases), there are **4 new patch versions** (3.22.21-3.22.24) with several bug fixes and improvements that need to be implemented or verified.

---

## Version 3.22.24 (Latest - 09 Jan 2025) 🆕

**Release**: https://github.com/saleor/saleor-dashboard/releases/tag/3.22.24

### Changes

1. **#6238** - Fixed broken question mark icons in Product Type variant attributes view
   - **File**: `src/productTypes/components/ProductTypeVariantAttributes/ProductTypeVariantAttributes.tsx`
   - **Status**: ⚠️ **NEEDS VERIFICATION** - Component uses `CircleQuestionMark` icon, may need styling fix

2. **#6233** - Fixed info icon sizing and alignment in Product details view attributes
   - **Change**: Info icons consistently 16px and properly aligned with text labels
   - **Status**: ⚠️ **NEEDS VERIFICATION**

3. **#6225** - Move Cloud env link to the Saleor Dashboard top-left logo hover state
   - **Status**: ⚠️ **NEEDS IMPLEMENTATION**
   - **Location**: Top navigation/logo component

4. **#6165** - Modals for assigning Products will now show Filter button
   - **Status**: ⚠️ **NEEDS IMPLEMENTATION**
   - **Files**: 
     - `src/shipping/components/ShippingMethodProductsAddDialog/ShippingMethodProductsAddDialog.tsx`
     - Other product assignment modals
   - **Details**: 
     - Add filter functionality with same conditions as Product list page
     - Display constraints based on context (e.g., limited Product type filter based on Reference Types config)

---

## Version 3.22.23 (18 Dec 2024)

**Release**: https://github.com/saleor/saleor-dashboard/releases/tag/3.22.23

### Changes

1. **#6227** - Added confirmation dialog ("Leave without saving changes?") to prevent accidental data loss
   - **Status**: ⚠️ **NEEDS IMPLEMENTATION**
   - **Affected Dialogs**:
     - Order metadata dialog (`src/orders/components/OrderMetadataDialog/OrderMetadataDialog.tsx`)
     - Order fulfillment metadata dialog
     - Order line metadata dialog (`src/orders/components/OrderLineMetadataDialog/OrderLineMetadataDialog.tsx`)
   - **Note**: `MetadataDialog` component has `formIsDirty` prop but no confirmation on close

2. **#6224** - Use Tooltip component for info icon and dates in timeline
   - **Status**: ⚠️ **NEEDS VERIFICATION**

3. **#6223** - Fix removing saved filters
   - **Status**: ⚠️ **NEEDS VERIFICATION**

4. **#6222** - Remove redundant elements in the main titles
   - **Status**: ⚠️ **NEEDS VERIFICATION**

---

## Version 3.22.22 (17 Dec 2024)

**Release**: https://github.com/saleor/saleor-dashboard/releases/tag/3.22.22

### Changes

1. **#6217** - Transaction actions: Capture button now directly visible on transaction cards
   - **Status**: ⚠️ **NEEDS VERIFICATION**
   - **Change**: Capture button visible, destructive actions (Cancel) remain in menu

2. **#6178** - Update order Transactions cards
   - **Status**: ⚠️ **NEEDS VERIFICATION**

3. **#6189** - Redesigned "Order summary" section (improvement of 3.22.14)
   - **Status**: ✅ **ALREADY IMPLEMENTED** (OrderSummary component exists)
   - **Note**: This appears to be an enhancement of the 3.22.14 redesign

---

## Version 3.22.21 (Date not shown)

**Release**: https://github.com/saleor/saleor-dashboard/releases/tag/3.22.21

### Changes

- Improvements to Order summary section
- Automatic checkout completion settings (now controllable from dashboard settings page)
- Previously only available via GraphQL, now accessible via UI

**Status**: ⚠️ **NEEDS VERIFICATION**

---

## Implementation Checklist

### High Priority (User-Facing Features)

- [ ] **#6165** - Add Filter button to Product assignment modals
  - [ ] Update `ShippingMethodProductsAddDialog.tsx`
  - [ ] Add filter UI with same conditions as Product list
  - [ ] Display context-based constraints
  - [ ] Test with Reference Types config

- [ ] **#6227** - Add confirmation dialogs to metadata dialogs
  - [ ] Update `MetadataDialog.tsx` to check `formIsDirty` on close
  - [ ] Add confirmation dialog component
  - [ ] Update Order metadata dialog
  - [ ] Update Order fulfillment metadata dialog
  - [ ] Update Order line metadata dialog

- [ ] **#6225** - Move Cloud env link to logo hover
  - [ ] Find logo component in top navigation
  - [ ] Add hover state with Cloud env link
  - [ ] Remove old Cloud env link location

### Medium Priority (Bug Fixes)

- [ ] **#6238** - Fix broken question mark icons
  - [ ] Verify `CircleQuestionMark` icon rendering
  - [ ] Fix any styling issues

- [ ] **#6233** - Fix info icon sizing (16px, aligned)
  - [ ] Find all info icons in Product details attributes
  - [ ] Set consistent 16px size
  - [ ] Align with text labels

- [ ] **#6223** - Fix removing saved filters
  - [ ] Test saved filter removal
  - [ ] Fix any bugs

### Low Priority (UI Polish)

- [ ] **#6224** - Use Tooltip component for timeline
- [ ] **#6222** - Remove redundant title elements
- [ ] **#6217** - Make Capture button visible on transaction cards
- [ ] **#6178** - Update transaction cards UI

---

## Files to Modify

### Product Assignment Modals
```
src/shipping/components/ShippingMethodProductsAddDialog/ShippingMethodProductsAddDialog.tsx
src/shipping/components/ShippingMethodProducts/ShippingMethodProducts.tsx
(Other product assignment dialogs)
```

### Metadata Dialogs
```
src/components/MetadataDialog/MetadataDialog.tsx
src/orders/components/OrderMetadataDialog/OrderMetadataDialog.tsx
src/orders/components/OrderLineMetadataDialog/OrderLineMetadataDialog.tsx
src/orders/components/OrderFulfillmentMetadataDialog/ (if exists)
```

### Navigation/Logo
```
src/components/AppLayout/TopNav/ (logo component)
src/components/AppLayout/ (main layout)
```

### Product Details
```
src/products/views/ProductDetails/ (info icons)
src/productTypes/components/ProductTypeVariantAttributes/ProductTypeVariantAttributes.tsx
```

### Transaction Cards
```
src/orders/components/OrderSummary/TransactionsApiButtons.tsx
src/orders/components/TransactionCard/ (if exists)
```

---

## Implementation Notes

### Metadata Dialog Confirmation (#6227)

The `MetadataDialog` component already has:
- `formIsDirty` prop to track changes
- `onChange` callback for close events

**What's needed**:
- Intercept `onClose` when `formIsDirty === true`
- Show confirmation dialog: "Leave without saving changes?"
- Only close if user confirms

**Implementation approach**:
```typescript
// In MetadataDialog.tsx
const handleClose = () => {
  if (formIsDirty) {
    // Show confirmation dialog
    // Only call onClose if confirmed
  } else {
    onClose();
  }
};
```

### Product Assignment Modal Filters (#6165)

**Current state**: Modal has search but no advanced filters

**What's needed**:
- Add Filter button to modal header
- Integrate same filter system as Product list page
- Show context-based constraints (e.g., Product type filter limited by Reference Types)

**Implementation approach**:
- Reuse filter components from Product list
- Add filter state management
- Apply filters to product query in modal

---

## Testing Checklist

After implementing changes:

- [ ] Test metadata dialogs with unsaved changes
- [ ] Test product assignment modal filters
- [ ] Test Cloud env link on logo hover
- [ ] Verify question mark icons render correctly
- [ ] Verify info icons are 16px and aligned
- [ ] Test removing saved filters
- [ ] Verify transaction card Capture button visibility
- [ ] Test all changes in dark mode
- [ ] Test responsive behavior

---

## Reference Links

- **GitHub Releases**: https://github.com/saleor/saleor-dashboard/releases
- **3.22.24 Release**: https://github.com/saleor/saleor-dashboard/releases/tag/3.22.24
- **3.22.23 Release**: https://github.com/saleor/saleor-dashboard/releases/tag/3.22.23
- **3.22.22 Release**: https://github.com/saleor/saleor-dashboard/releases/tag/3.22.22
- **3.22.21 Release**: https://github.com/saleor/saleor-dashboard/releases/tag/3.22.21

---

**Next Steps**: Start with high-priority features (#6165, #6227, #6225) and then move to bug fixes.

