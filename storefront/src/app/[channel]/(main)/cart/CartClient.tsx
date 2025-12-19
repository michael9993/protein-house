"use client";

import Image from "next/image";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { formatMoney, getHrefForVariant } from "@/lib/utils";
import { storeConfig } from "@/config";

interface CartLine {
  id: string;
  quantity: number;
  totalPrice: {
    gross: { amount: number; currency: string };
  };
  unitPrice: {
    gross: { amount: number; currency: string };
  };
  variant: {
    id: string;
    name: string;
    quantityAvailable: number;
    product: {
      slug: string;
      name: string;
      thumbnail: { url: string; alt: string | null } | null;
      category: { name: string } | null;
    };
  };
}

interface CartData {
  id: string;
  lines: CartLine[];
  totalPrice: {
    gross: { amount: number; currency: string };
  };
  subtotalPrice: {
    gross: { amount: number; currency: string };
  };
}

interface CartClientProps {
  cart: CartData | null;
  channel: string;
  deleteLineAction: (lineId: string) => Promise<void>;
  createCheckoutWithItems?: (variantIds: { variantId: string; quantity: number }[], channel: string) => Promise<{ checkoutId: string } | null>;
}

export function CartClient({ 
  cart, 
  channel, 
  deleteLineAction,
  createCheckoutWithItems,
}: CartClientProps) {
  const { branding, ecommerce } = storeConfig;
  const router = useRouter();
  const [promoCode, setPromoCode] = useState("");
  const [deletingLines, setDeletingLines] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  // Selection state - default all items selected
  const [selectedItems, setSelectedItems] = useState<Set<string>>(() => {
    if (!cart) return new Set();
    return new Set(cart.lines.map(line => line.id));
  });

  // Calculate selected items summary
  const { selectedLines, selectedSubtotal, selectedItemCount } = useMemo(() => {
    if (!cart) return { selectedLines: [], selectedSubtotal: 0, selectedItemCount: 0 };
    
    const lines = cart.lines.filter(line => selectedItems.has(line.id));
    const subtotal = lines.reduce((sum, line) => sum + line.totalPrice.gross.amount, 0);
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
    
    return { selectedLines: lines, selectedSubtotal: subtotal, selectedItemCount: itemCount };
  }, [cart, selectedItems]);

  const freeShippingThreshold = ecommerce.shipping.freeShippingThreshold;
  const amountToFreeShipping = freeShippingThreshold
    ? Math.max(0, freeShippingThreshold - selectedSubtotal)
    : null;
  const hasReachedFreeShipping = amountToFreeShipping === 0;

  const allSelected = cart ? selectedItems.size === cart.lines.length : false;
  const noneSelected = selectedItems.size === 0;
  const someSelected = !allSelected && !noneSelected;

  const handleSelectAll = () => {
    if (!cart) return;
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cart.lines.map(line => line.id)));
    }
  };

  const handleSelectItem = (lineId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(lineId)) {
        next.delete(lineId);
      } else {
        next.add(lineId);
      }
      return next;
    });
  };

  const handleDeleteLine = async (lineId: string) => {
    setDeletingLines(prev => new Set(prev).add(lineId));
    // Also remove from selected items
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.delete(lineId);
      return next;
    });
    startTransition(async () => {
      await deleteLineAction(lineId);
      setDeletingLines(prev => {
        const next = new Set(prev);
        next.delete(lineId);
        return next;
      });
    });
  };

  const handleProceedToCheckout = async () => {
    if (!cart || selectedItems.size === 0) return;

    // If all items selected, use existing checkout
    if (allSelected) {
      // Use replace to avoid stacking checkout entries in history
      router.replace(`/checkout?checkout=${cart.id}`);
      return;
    }

    // If partial selection and we have createCheckoutWithItems action, create new checkout
    if (createCheckoutWithItems) {
      setIsCreatingCheckout(true);
      try {
        const items = selectedLines.map(line => ({
          variantId: line.variant.id,
          quantity: line.quantity,
        }));
        const result = await createCheckoutWithItems(items, channel);
        if (result?.checkoutId) {
          // Store the line IDs that are being checked out for cleanup after purchase
          // This allows us to remove purchased items from the original cart
          const pendingCleanup = {
            originalCartId: cart.id,
            lineIds: Array.from(selectedItems),
            partialCheckoutId: result.checkoutId,
            timestamp: Date.now(),
          };
          localStorage.setItem('pendingCartCleanup', JSON.stringify(pendingCleanup));
          
          // Use replace to avoid stacking checkout entries in history
          router.replace(`/checkout?checkout=${result.checkoutId}`);
        }
      } catch (error) {
        console.error("Failed to create checkout:", error);
      } finally {
        setIsCreatingCheckout(false);
      }
    } else {
      // Fallback: use existing checkout (will include all items)
      router.replace(`/checkout?checkout=${cart.id}`);
    }
  };

  // Empty cart state
  if (!cart || cart.lines.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100">
              <svg className="h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              Your cart is empty
            </h1>
            <p className="mt-3 text-neutral-600">
              Looks like you haven't added any items to your cart yet.
            </p>

            <div className="mt-8">
              <LinkWithChannel
                href="/products"
                className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: branding.colors.primary }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Start Shopping
              </LinkWithChannel>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalItemCount = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
  const currency = cart.totalPrice.gross.currency;

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Free Shipping Progress */}
        {freeShippingThreshold && !hasReachedFreeShipping && amountToFreeShipping !== null && selectedSubtotal > 0 && (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-800">
                  Add {formatMoney(amountToFreeShipping, currency)} more for FREE shipping!
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (selectedSubtotal / freeShippingThreshold) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {hasReachedFreeShipping && selectedSubtotal > 0 && (
          <div className="mb-6 rounded-xl bg-emerald-50 p-4 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium text-emerald-800">
                🎉 You've unlocked FREE shipping!
              </p>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8 xl:gap-x-12">
          {/* Cart Items */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
              {/* Header with Select All */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">
                  Shopping Cart ({totalItemCount} {totalItemCount === 1 ? "item" : "items"})
                </h1>
                
                {/* Select All Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: branding.colors.primary }}
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                        allSelected
                          ? "border-transparent"
                          : someSelected
                          ? "border-neutral-300"
                          : "border-neutral-300"
                      }`}
                      style={allSelected ? { backgroundColor: branding.colors.primary } : undefined}
                    >
                      {allSelected && (
                        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {someSelected && (
                        <div className="h-2 w-2 rounded-sm bg-neutral-400" />
                      )}
                    </div>
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>
              </div>

              {/* Selection Info Banner */}
              {!allSelected && selectedItems.size > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">{selectedItemCount}</span> of {totalItemCount} items selected for checkout
                  </p>
                  <button
                    onClick={() => setSelectedItems(new Set(cart.lines.map(line => line.id)))}
                    className="text-sm font-medium text-blue-700 hover:underline"
                  >
                    Select all items
                  </button>
                </div>
              )}

              {noneSelected && (
                <div className="mt-4 flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-3">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-amber-700">
                    Select items to proceed to checkout
                  </p>
                </div>
              )}

              <ul className="mt-6 divide-y divide-neutral-100">
                {cart.lines.map((item) => {
                  const isSelected = selectedItems.has(item.id);
                  const isDeleting = deletingLines.has(item.id);

                  return (
                    <li
                      key={item.id}
                      className={`flex gap-4 py-5 transition-all ${
                        isDeleting ? "opacity-50" : isSelected ? "" : "opacity-60"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="flex items-start pt-1">
                        <button
                          onClick={() => handleSelectItem(item.id)}
                          disabled={isDeleting}
                          className="group flex h-6 w-6 items-center justify-center"
                        >
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                              isSelected
                                ? "border-transparent"
                                : "border-neutral-300 group-hover:border-neutral-400"
                            }`}
                            style={isSelected ? { backgroundColor: branding.colors.primary } : undefined}
                          >
                            {isSelected && (
                              <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      </div>

                      {/* Product Image */}
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:h-28 sm:w-28">
                        {item.variant.product.thumbnail?.url ? (
                          <Image
                            src={item.variant.product.thumbnail.url}
                            alt={item.variant.product.thumbnail.alt || item.variant.product.name}
                            fill
                            className="object-cover"
                            sizes="112px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <div className="flex-1">
                            <LinkWithChannel
                              href={getHrefForVariant({
                                productSlug: item.variant.product.slug,
                                variantId: item.variant.id,
                              })}
                              className="font-medium text-neutral-900 hover:text-neutral-700"
                            >
                              {item.variant.product.name}
                            </LinkWithChannel>
                            {item.variant.product.category?.name && (
                              <p className="mt-0.5 text-sm text-neutral-500">
                                {item.variant.product.category.name}
                              </p>
                            )}
                            {item.variant.name !== item.variant.id && (
                              <p className="mt-0.5 text-sm text-neutral-500">
                                {item.variant.name}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-neutral-900">
                              {formatMoney(item.totalPrice.gross.amount, item.totalPrice.gross.currency)}
                            </p>
                            <p className="mt-0.5 text-xs text-neutral-500">
                              {formatMoney(item.unitPrice.gross.amount, item.unitPrice.gross.currency)} each
                            </p>
                          </div>
                        </div>

                        {/* Quantity & Actions */}
                        <div className="mt-auto flex items-center justify-between pt-3">
                          {/* Quantity Display */}
                          <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2">
                            <span className="text-sm font-medium text-neutral-700">
                              Qty: {item.quantity}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-4">
                            {/* Save for Later (just deselect) */}
                            {isSelected && (
                              <button
                                type="button"
                                onClick={() => handleSelectItem(item.id)}
                                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-800"
                              >
                                Save for Later
                              </button>
                            )}
                            {!isSelected && (
                              <button
                                type="button"
                                onClick={() => handleSelectItem(item.id)}
                                className="text-sm font-medium transition-colors hover:opacity-80"
                                style={{ color: branding.colors.primary }}
                              >
                                Move to Cart
                              </button>
                            )}
                            
                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteLine(item.id)}
                              disabled={isDeleting}
                              className="flex items-center gap-1.5 text-sm font-medium text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
                            >
                              {isDeleting ? (
                                <>
                                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Continue Shopping */}
              <div className="mt-6 border-t border-neutral-100 pt-6">
                <LinkWithChannel
                  href="/products"
                  className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: branding.colors.primary }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  Continue Shopping
                </LinkWithChannel>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-8 lg:col-span-5 lg:mt-0 xl:col-span-4">
            <div className="sticky top-24 rounded-xl bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-neutral-900">
                Order Summary
                {!allSelected && selectedItems.size > 0 && (
                  <span className="ml-2 text-sm font-normal text-neutral-500">
                    ({selectedItemCount} {selectedItemCount === 1 ? "item" : "items"} selected)
                  </span>
                )}
              </h2>

              {/* Promo Code */}
              <div className="mt-6">
                <label htmlFor="promo" className="block text-sm font-medium text-neutral-700">
                  Promo Code
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    id="promo"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2"
                    style={{ "--tw-ring-color": branding.colors.primary } as React.CSSProperties}
                  />
                  <button
                    type="button"
                    disabled={!promoCode.trim()}
                    className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Summary Lines */}
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-600">Subtotal ({selectedItemCount} items)</dt>
                  <dd className="font-medium text-neutral-900">
                    {formatMoney(selectedSubtotal, currency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-600">Shipping</dt>
                  <dd className="font-medium text-neutral-900">
                    {selectedSubtotal > 0 && hasReachedFreeShipping ? (
                      <span className="text-emerald-600">FREE</span>
                    ) : (
                      "Calculated at checkout"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-3">
                  <dt className="text-base font-semibold text-neutral-900">Total</dt>
                  <dd className="text-base font-semibold text-neutral-900">
                    {formatMoney(selectedSubtotal, currency)}
                  </dd>
                </div>
              </dl>

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                disabled={noneSelected || isCreatingCheckout}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: branding.colors.primary }}
              >
                {isCreatingCheckout ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Preparing Checkout...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {noneSelected
                      ? "Select Items to Checkout"
                      : allSelected
                      ? "Proceed to Checkout"
                      : `Checkout ${selectedItemCount} Item${selectedItemCount !== 1 ? "s" : ""}`}
                  </>
                )}
              </button>

              {/* Non-selected items note */}
              {!allSelected && selectedItems.size > 0 && (
                <p className="mt-3 text-center text-xs text-neutral-500">
                  {cart.lines.length - selectedItems.size} item{cart.lines.length - selectedItems.size !== 1 ? "s" : ""} saved for later
                </p>
              )}

              {/* Trust Badges */}
              <div className="mt-6 flex items-center justify-center gap-4 border-t border-neutral-200 pt-6">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Secure Checkout
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  SSL Encrypted
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-6 border-t border-neutral-200 pt-6">
                <p className="mb-3 text-center text-xs text-neutral-500">Accepted Payment Methods</p>
                <div className="flex items-center justify-center gap-3">
                  {["Visa", "MC", "Amex", "PayPal"].map((method) => (
                    <div
                      key={method}
                      className="flex h-8 w-12 items-center justify-center rounded border border-neutral-200 bg-neutral-50 text-[10px] font-medium text-neutral-500"
                    >
                      {method}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
