# Billing/Shipping Address Separation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix checkout v2 so billing and shipping addresses have fully independent selection, editing, and deletion — with correct default detection and account persistence.

**Architecture:** Add a `name` prop to `SavedAddressList` so each instance gets its own radio group. Extract billing edit/delete state into its own set of state variables in `ShippingStep`. Persist billing addresses to the user account with type `"BILLING"` and set defaults correctly per section.

**Tech Stack:** React 19, TypeScript, React Hook Form, Saleor GraphQL

---

## Bugs Fixed

1. **Radio `name` collision** — `SavedAddressList` hardcodes `name="savedAddress"`. Both shipping and billing instances share the same radio group, so selecting one deselects the other.
2. **Shared edit/delete state** — Billing section passes the shipping handlers (`handleEdit`, `handleDeleteRequest`), so editing a billing address mutates shipping form state.
3. **No billing persistence** — Only shipping address gets saved to the user account; billing edits/creates are lost.

---

### Task 1: Add `name` prop to SavedAddressList

**Files:**
- Modify: `storefront/src/checkout-v2/components/SavedAddressList.tsx`

**Step 1: Add `name` to the interface and radio input**

Add required `name` prop to the interface:

```typescript
interface SavedAddressListProps {
  addresses: AddressFragment[];
  selectedId: string | null;
  onSelect: (address: AddressFormValues) => void;
  onAddNew: () => void;
  onEdit?: (addressId: string) => void;
  onDelete?: (addressId: string) => void;
  name: string; // unique radio group name per section
}
```

Destructure `name` in the component and replace `name="savedAddress"` on the radio input with `name={name}`.

**Step 2: Commit**

```
feat(checkout-v2): add name prop to SavedAddressList for independent radio groups
```

---

### Task 2: Separate billing state, handlers, and UI in ShippingStep

**Files:**
- Modify: `storefront/src/checkout-v2/steps/ShippingStep.tsx`

This is the main task. Changes:

**Step 1: Add billing-specific edit/delete state variables**

After existing edit/delete state (lines 58-61), add:

```typescript
// Billing edit/delete state (independent from shipping)
const [editingBillingAddressId, setEditingBillingAddressId] = useState<string | null>(null);
const [showBillingNewForm, setShowBillingNewForm] = useState(false);
const [deleteBillingConfirmId, setDeleteBillingConfirmId] = useState<string | null>(null);
const [deletingBilling, setDeletingBilling] = useState(false);
```

**Step 2: Add billing-specific edit/delete handlers**

After `handleDeleteConfirm`, add:

```typescript
function handleBillingEdit(addressId: string) {
  const addr = savedAddresses.find((a: { id: string }) => a.id === addressId);
  if (!addr) return;
  setEditingBillingAddressId(addressId);
  setShowBillingNewForm(true);
  setBillingMode("new");
  setBillingDefaults({
    firstName: addr.firstName ?? "",
    lastName: addr.lastName ?? "",
    companyName: addr.companyName ?? "",
    streetAddress1: addr.streetAddress1 ?? "",
    streetAddress2: addr.streetAddress2 ?? "",
    city: addr.city ?? "",
    cityArea: addr.cityArea ?? "",
    countryCode: addr.country.code,
    countryArea: addr.countryArea ?? "",
    postalCode: addr.postalCode ?? "",
    phone: addr.phone ?? "",
  });
  setBillingFormKey((k) => k + 1);
}

function handleBillingDeleteRequest(addressId: string) {
  setDeleteBillingConfirmId(addressId);
}

async function handleBillingDeleteConfirm() {
  if (!deleteBillingConfirmId) return;
  setDeletingBilling(true);
  try {
    const result = await deleteUserAddress(deleteBillingConfirmId);
    if (result.success) {
      if (selectedBillingId === deleteBillingConfirmId) {
        setSelectedBillingId(null);
      }
      if (selectedAddressId === deleteBillingConfirmId) {
        setSelectedAddressId(null);
      }
      await reload();
    }
  } finally {
    setDeletingBilling(false);
    setDeleteBillingConfirmId(null);
  }
}
```

**Step 3: Update shipping handleDeleteConfirm to also clear billing**

In the existing `handleDeleteConfirm`, add after the `selectedAddressId` check:

```typescript
if (selectedBillingId === deleteConfirmId) {
  setSelectedBillingId(null);
}
```

**Step 4: Pass `name` prop to both SavedAddressList instances**

Shipping: `name="shipping-address"`
Billing: `name="billing-address"`

**Step 5: Replace the billing section UI**

Replace the `!billingMatchesShipping` block with:

```tsx
{!billingMatchesShipping && (
  <div className="space-y-3">
    <p className="text-sm font-medium text-neutral-700">
      {t.billingAddressTitle ?? "Billing Address"}
    </p>
    <p className="text-sm text-neutral-500">
      {t.billingAddressSubtitle ?? "For your invoice"}
    </p>

    {/* Saved billing address list */}
    {hasSavedAddresses && billingMode === "saved" && !showBillingNewForm && (
      <SavedAddressList
        name="billing-address"
        addresses={savedAddresses}
        selectedId={selectedBillingId}
        onSelect={(addr) => {
          const match = savedAddresses.find(
            (a) => a.streetAddress1 === addr.streetAddress1 &&
                   a.firstName === addr.firstName &&
                   a.lastName === addr.lastName,
          );
          setSelectedBillingId(match?.id ?? null);
          setBillingDefaults(addr);
        }}
        onAddNew={() => {
          setBillingMode("new");
          setShowBillingNewForm(true);
          setSelectedBillingId(null);
          setEditingBillingAddressId(null);
          setBillingDefaults({});
          setBillingFormKey((k) => k + 1);
        }}
        onEdit={handleBillingEdit}
        onDelete={handleBillingDeleteRequest}
      />
    )}

    {/* "Back to saved" link when showing billing form */}
    {hasSavedAddresses && (billingMode === "new" || showBillingNewForm) && (
      <button
        type="button"
        onClick={() => {
          setBillingMode("saved");
          setShowBillingNewForm(false);
          setEditingBillingAddressId(null);
          const prev = savedAddresses.find((a) => a.id === selectedBillingId)
            ?? savedAddresses.find((a) => a.isDefaultBillingAddress)
            ?? savedAddresses[0];
          if (prev) {
            setSelectedBillingId(prev.id);
            setBillingDefaults({
              firstName: prev.firstName ?? "",
              lastName: prev.lastName ?? "",
              companyName: prev.companyName ?? "",
              streetAddress1: prev.streetAddress1 ?? "",
              streetAddress2: prev.streetAddress2 ?? "",
              city: prev.city ?? "",
              cityArea: prev.cityArea ?? "",
              countryCode: prev.country.code,
              countryArea: prev.countryArea ?? "",
              postalCode: prev.postalCode ?? "",
              phone: prev.phone ?? "",
            });
          }
        }}
        className="text-sm text-[var(--store-primary,theme(colors.neutral.900))] underline-offset-2 hover:underline"
      >
        &larr; {editingBillingAddressId
          ? (t.cancelButton ?? "Cancel")
          : (t.useSavedAddressButton ?? "Use a saved address")}
      </button>
    )}

    {/* Billing address form */}
    {(billingMode === "new" || showBillingNewForm || !hasSavedAddresses) && (
      <AddressForm
        ref={billingFormRef}
        key={billingFormKey}
        id="billing-address-form"
        defaultValues={billingDefaults}
        onSubmit={async () => {}}
      />
    )}
  </div>
)}
```

**Step 6: Add billing delete confirmation dialog**

After the existing `ConfirmDialog`:

```tsx
<ConfirmDialog
  open={!!deleteBillingConfirmId}
  title={t.deleteAddressConfirmTitle ?? "Delete address?"}
  message={t.deleteAddressConfirmMessage ?? "This address will be permanently removed."}
  confirmLabel={deletingBilling ? (t.processingText ?? "Processing…") : (t.deleteAddressButton ?? "Delete")}
  cancelLabel={t.cancelButton ?? "Cancel"}
  onConfirm={handleBillingDeleteConfirm}
  onCancel={() => setDeleteBillingConfirmId(null)}
/>
```

**Step 7: Update saveToSaleor to persist billing address to account**

After the existing shipping account persistence block, add:

```typescript
// Persist billing address to user account (if separate)
if (authenticated && !billingMatchesShipping) {
  if (editingBillingAddressId && (billingMode === "new" || showBillingNewForm)) {
    const billingAddr = billingFormRef.current?.getValues();
    if (billingAddr) {
      const updateResult = await updateUserAddress(editingBillingAddressId, billingAddr);
      if (!updateResult.errors.length) {
        await reload();
        setSelectedBillingId(editingBillingAddressId);
      }
      setEditingBillingAddressId(null);
    }
  } else if ((billingMode === "new" || showBillingNewForm) && !selectedBillingId && billingFormRef.current) {
    const billingAddr = billingFormRef.current.getValues();
    const saveResult = await createUserAddress(billingAddr, "BILLING" as any);
    if (!saveResult.errors.length) {
      await reload();
    }
  }
}
```

**Step 8: Commit**

```
fix(checkout-v2): separate billing/shipping address state, handlers, and radio groups
```

---

### Task 3: Restart and verify

**Step 1:** Restart storefront container
**Step 2:** Run `pnpm type-check`
**Step 3:** Check logs for runtime errors

**Manual QA:**
1. Log in with user that has 2+ addresses with different shipping/billing defaults → checkbox auto-unchecked, both lists independent
2. Select different addresses in shipping vs billing → radio groups don't interfere
3. Edit billing address → shipping form unchanged
4. Delete billing address → shipping selection preserved
5. Submit with separate billing → both addresses saved to checkout and account
6. Guest checkout → no regression

---

## Files Summary

| File | Change |
|------|--------|
| `SavedAddressList.tsx` | Add required `name` prop for radio group isolation |
| `ShippingStep.tsx` | Billing-specific state + handlers, `name` props, billing persist, billing delete dialog |
