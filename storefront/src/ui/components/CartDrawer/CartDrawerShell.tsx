"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { useCartDisplayMode } from '@/providers/StoreConfigProvider';
import { CartDrawerProvider, useCartDrawer, useCartDrawerSafe } from '@/providers/CartDrawerProvider';
import { deleteLineAction, updateLineQuantityAction, applyPromoCodeAction, removePromoCodeAction, createCheckoutWithItemsAction } from "@/app/cart-actions";
import { CartDrawer } from './CartDrawer';

/** Minimal checkout shape matching CartDrawer expectations. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheckoutData = {
  id: string;
  lines: any[];
  totalPrice: { gross: { amount: number; currency: string } };
  voucherCode?: string | null;
  voucherId?: string | null;
  discount?: { amount: number; currency: string } | null;
  discountName?: string | null;
};

/**
 * CartDrawerShell wraps the app with drawer functionality when enabled.
 * It handles:
 * 1. Conditional wrapping based on displayMode
 * 2. CartDrawer rendering
 * 3. Partial selection: when user deselects items (e.g. gift), proceed to checkout with only selected items
 *
 * Cart data is managed externally - the drawer receives updates
 * through the CartDrawerProvider context when items are added.
 */

interface CartDrawerShellProps {
  children: React.ReactNode;
  /** When provided, drawer can create a checkout with only selected items (e.g. gift deselected). Optional voucherCode is applied to the new checkout. */
  createCheckoutWithItems?: (channel: string, items: { variantId: string; quantity: number }[], voucherCode?: string | null) => Promise<{ checkoutId: string } | null>;
}

// Re-export CartDrawerProvider for use in layout
export { CartDrawerProvider };

/**
 * Client component that conditionally enables cart drawer functionality.
 * Must be used inside StoreConfigProvider.
 */
export function CartDrawerShell({ children, createCheckoutWithItems }: CartDrawerShellProps) {
  const displayMode = useCartDisplayMode();
  const params = useParams();
  const channel = (params?.channel as string) ?? '';

  // If mode is 'page', render children without drawer functionality
  if (displayMode === 'page') {
    return <>{children}</>;
  }

  // If mode is 'drawer', wrap with provider and include the drawer
  return (
    <CartDrawerProvider>
      {children}
      <CartDrawerContent channel={channel} createCheckoutWithItems={createCheckoutWithItems} />
    </CartDrawerProvider>
  );
}

/**
 * Internal component that renders the CartDrawer.
 * Separated to ensure it's within the CartDrawerProvider context.
 */
function CartDrawerContent({
  channel,
  createCheckoutWithItems,
}: {
  channel: string;
  createCheckoutWithItems?: (channel: string, items: { variantId: string; quantity: number }[], voucherCode?: string | null) => Promise<{ checkoutId: string } | null>;
}) {
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen } = useCartDrawer();
  // Optimistic qty ref — always synchronously up-to-date (no React batching delay)
  const optimisticQtyRef = useRef(new Map<string, number>());
  // Debounce refs — coalesce rapid clicks into single server mutation
  const debounceTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      debounceTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Helper to refresh cart data from API, overlaying any pending optimistic quantities
  const refreshCartData = async () => {
    try {
      const res = await fetch(`/api/cart-data?channel=${channel}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { checkout: CheckoutData | null };
        if (data.checkout) {
          // Reconcile optimistic ref with server data
          data.checkout.lines = data.checkout.lines.map((line: any) => {
            const optQty = optimisticQtyRef.current.get(line.id);
            if (optQty === undefined) return line;
            if (optQty === line.quantity) {
              // Server matches optimistic — converged, clear ref
              optimisticQtyRef.current.delete(line.id);
              return line;
            }
            // Server doesn't match yet — overlay optimistic qty
            const unitAmount = line.unitPrice?.gross?.amount
              ?? (line.quantity > 0 ? line.totalPrice.gross.amount / line.quantity : 0);
            return {
              ...line,
              quantity: optQty,
              totalPrice: { ...line.totalPrice, gross: { ...line.totalPrice.gross, amount: unitAmount * optQty } },
            };
          });
        }
        setCheckoutData(data.checkout);
      }
    } catch (error) {
      console.error("Failed to refresh cart data:", error);
    }
  };

  // Handle quantity updates — delta-based (+1/-1), optimistic via sync ref, debounced server call
  const handleUpdateQuantity = async (lineId: string, delta: number) => {
    const serverLine = checkoutData?.lines.find((l: any) => l.id === lineId);
    if (!serverLine) return;

    // Use ref (always sync) to get the true latest quantity — not stale React state
    const currentQty = optimisticQtyRef.current.get(lineId) ?? serverLine.quantity;
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    // Update ref synchronously — next click sees this immediately
    optimisticQtyRef.current.set(lineId, newQty);

    // Optimistic React state update for rendering
    setCheckoutData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        lines: prev.lines.map((line: any) => {
          if (line.id !== lineId) return line;
          const unitAmount = line.unitPrice?.gross?.amount
            ?? (line.quantity > 0 ? line.totalPrice.gross.amount / line.quantity : 0);
          return {
            ...line,
            quantity: newQty,
            totalPrice: { ...line.totalPrice, gross: { ...line.totalPrice.gross, amount: unitAmount * newQty } },
          };
        }),
      };
    });

    // Debounce the server call — rapid clicks coalesce into one mutation
    const existing = debounceTimersRef.current.get(lineId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      const finalQty = optimisticQtyRef.current.get(lineId);
      if (finalQty === undefined) return;
      debounceTimersRef.current.delete(lineId);
      try {
        await updateLineQuantityAction(channel, lineId, finalQty);
        window.dispatchEvent(new Event("cart-updated"));
      } catch (error) {
        console.error("Failed to update quantity:", error);
        optimisticQtyRef.current.delete(lineId);
        refreshCartData();
      }
    }, 400);
    debounceTimersRef.current.set(lineId, timer);
  };

  // Flush all pending debounced mutations (called before checkout navigation)
  const flushPendingUpdates = async () => {
    if (debounceTimersRef.current.size === 0) return;
    // Cancel all debounce timers
    debounceTimersRef.current.forEach(t => clearTimeout(t));
    debounceTimersRef.current.clear();
    // Fire all pending optimistic quantities
    const pending = Array.from(optimisticQtyRef.current.entries());
    if (pending.length === 0) return;
    await Promise.all(
      pending.map(([lineId, qty]) => updateLineQuantityAction(channel, lineId, qty))
    );
    window.dispatchEvent(new Event("cart-updated"));
  };

  // Handle line deletion with optimistic UI
  const handleDeleteLine = async (lineId: string) => {
    // Cancel any pending quantity debounce for this line
    const pendingTimer = debounceTimersRef.current.get(lineId);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      debounceTimersRef.current.delete(lineId);
    }
    optimisticQtyRef.current.delete(lineId);

    // Capture pre-update state for rollback
    const previousData = checkoutData;

    // Optimistic: remove line immediately
    setCheckoutData(prev => {
      if (!prev) return prev;
      return { ...prev, lines: prev.lines.filter((line: any) => line.id !== lineId) };
    });

    try {
      const result = await deleteLineAction(channel, lineId);
      if (result && !result.success) {
        toast.error(result.error ?? "Could not remove item");
        setCheckoutData(previousData);
      } else {
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (error) {
      console.error("Failed to delete line:", error);
      toast.error("Could not remove item");
      setCheckoutData(previousData);
    }
  };

  // Fetch when drawer opens (skip if already have data and drawer was just toggled)
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      refreshCartData().finally(() => setIsLoading(false));
    }
  }, [isOpen, channel]);

  // Listen for cart-updated events to refresh (debounced, overlays pending quantities)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleCartUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (channel) refreshCartData();
      }, 300);
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [channel]);

  const handleApplyPromoCode = async (checkoutId: string, promoCode: string) =>
    applyPromoCodeAction(channel, checkoutId, promoCode);
  const handleRemovePromoCode = async (
    checkoutId: string,
    options: { promoCodeId?: string; promoCode?: string }
  ) => removePromoCodeAction(channel, checkoutId, options);

  const handleCreateCheckoutWithSelection = createCheckoutWithItems
    ? (items: { variantId: string; quantity: number }[]) =>
        createCheckoutWithItems(channel, items, checkoutData?.voucherCode ?? undefined)
    : undefined;

  return (
    <CartDrawer
      checkoutData={checkoutData}
      channel={channel}
      onUpdateQuantity={handleUpdateQuantity}
      onDeleteLine={handleDeleteLine}
      onApplyPromoCode={handleApplyPromoCode}
      onRemovePromoCode={handleRemovePromoCode}
      onCreateCheckoutWithSelection={handleCreateCheckoutWithSelection}
      onBeforeCheckout={flushPendingUpdates}
      loading={isLoading}
    />
  );
}

/**
 * Custom hook for components that need to trigger the cart drawer.
 * Returns a function that opens the drawer (or navigates to cart page if in page mode).
 * 
 * Usage:
 * const openCart = useOpenCart();
 * <button onClick={() => openCart()}>Add to Cart</button>
 */
export function useOpenCart() {
  const displayMode = useCartDisplayMode();
  const drawerContext = useCartDrawerSafe();
  const params = useParams();
  const channel = (params?.channel as string) ?? '';
  
  return () => {
    if (displayMode === 'drawer' && drawerContext) {
      drawerContext.openDrawer();
    } else {
      // Navigate to cart page
      window.location.href = `/${channel}/cart`;
    }
  };
}

export default CartDrawerShell;
