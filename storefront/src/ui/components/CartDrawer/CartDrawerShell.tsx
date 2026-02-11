"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { useCartDisplayMode } from '@/providers/StoreConfigProvider';
import { CartDrawerProvider, useCartDrawer, useCartDrawerSafe } from '@/providers/CartDrawerProvider';
import { deleteLineAction, updateLineQuantityAction, applyPromoCodeAction, removePromoCodeAction, createCheckoutWithItemsAction } from "@/app/cart-actions";
import { CartDrawer } from './CartDrawer';

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
  const [checkoutData, setCheckoutData] = useState<{ voucherCode?: string | null; [key: string]: unknown } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen } = useCartDrawer();
  // Per-line lock to allow concurrent operations on different items
  const updatingLinesRef = React.useRef(new Set<string>());

  // Helper to refresh cart data from API
  const refreshCartData = async () => {
    try {
      const res = await fetch(`/api/cart-data?channel=${channel}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setCheckoutData(data.checkout);
      }
    } catch (error) {
      console.error("Failed to refresh cart data:", error);
    }
  };

  // ... (lines 75-121 omitted)

  // Handle quantity updates with optimistic UI
  const handleUpdateQuantity = async (lineId: string, quantity: number) => {
    if (updatingLinesRef.current.has(lineId)) return;
    updatingLinesRef.current.add(lineId);

    // Optimistic: update quantity in local state immediately
    setCheckoutData(prev => {
      if (!prev) return prev;
      const lines = (prev as any).lines;
      if (!Array.isArray(lines)) return prev;
      return {
        ...prev,
        lines: lines.map((line: any) => {
          if (line.id !== lineId) return line;
          const unitAmount = line.quantity > 0
            ? line.totalPrice.gross.amount / line.quantity
            : 0;
          return {
            ...line,
            quantity,
            totalPrice: { ...line.totalPrice, gross: { ...line.totalPrice.gross, amount: unitAmount * quantity } },
          };
        }),
      };
    });

    try {
      await updateLineQuantityAction(channel, lineId, quantity);
      // Background refresh for accurate totals + notify header badge
      window.dispatchEvent(new Event("cart-updated"));
    } catch (error) {
      console.error("Failed to update quantity:", error);
      refreshCartData();
    } finally {
      updatingLinesRef.current.delete(lineId);
    }
  };

  // Handle line deletion with optimistic UI
  const handleDeleteLine = async (lineId: string) => {
    if (updatingLinesRef.current.has(lineId)) return;
    updatingLinesRef.current.add(lineId);

    // Capture pre-update state for rollback
    const previousData = checkoutData;

    // Optimistic: remove line immediately
    setCheckoutData(prev => {
      if (!prev) return prev;
      const lines = (prev as any).lines;
      if (!Array.isArray(lines)) return prev;
      return { ...prev, lines: lines.filter((line: any) => line.id !== lineId) };
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
    } finally {
      updatingLinesRef.current.delete(lineId);
    }
  };

  // Fetch when drawer opens (skip if already have data and drawer was just toggled)
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      refreshCartData().finally(() => setIsLoading(false));
    }
  }, [isOpen, channel]);

  // Listen for cart-updated events to refresh (debounced)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleCartUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (channel) {
          fetch(`/api/cart-data?channel=${channel}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => setCheckoutData(data.checkout))
            .catch(() => {});
        }
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
