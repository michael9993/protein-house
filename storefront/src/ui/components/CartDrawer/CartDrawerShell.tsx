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
  const [isUpdating, setIsUpdating] = useState(false);
  const { isOpen } = useCartDrawer();

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

  // Handle quantity updates using server action
  const handleUpdateQuantity = async (lineId: string, quantity: number) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      // Optimistic update could be done here, but for now we'll wait for server
      // Using the shared server action for consistency
      await updateLineQuantityAction(channel, lineId, quantity);
      
      // Refresh cart data to get latest totals
      await refreshCartData();
    } catch (error) {
      console.error("Failed to update quantity:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle line deletion using server action (including gift lines)
  const handleDeleteLine = async (lineId: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const result = await deleteLineAction(channel, lineId);
      await refreshCartData();
      if (result && !result.success) {
        toast.error(result.error ?? "Could not remove item");
      } else if (result?.success && typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (error) {
      console.error("Failed to delete line:", error);
      toast.error("Could not remove item");
    } finally {
      setIsUpdating(false);
    }
  };

  // Also fetch on mount
  useEffect(() => {
    setIsLoading(true);
    refreshCartData().finally(() => setIsLoading(false));
  }, [channel]);

  // Refetch when drawer opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      refreshCartData().finally(() => setIsLoading(false));
    }
  }, [isOpen, channel]);

  // Also listen for cart-updated events to refresh
  useEffect(() => {
    const handleCartUpdate = () => {
      if (channel) {
          fetch(`/api/cart-data?channel=${channel}`, {
          cache: 'no-store',
        })
          .then(res => res.json())
          .then(data => {
            setCheckoutData(data.checkout);
          })
          .catch(err => {
            console.error('[CartDrawerContent] Error refreshing cart:', err);
          });
      }
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => {
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
