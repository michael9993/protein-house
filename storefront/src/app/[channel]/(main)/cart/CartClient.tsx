"use client";

import Image from "next/image";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-toastify";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { formatMoney, getHrefForVariant } from "@/lib/utils";
import { useBranding, useEcommerceSettings, useContentConfig, useButtonStyle, useBadgeStyle } from "@/providers/StoreConfigProvider";
import { trackBeginCheckout } from "@/lib/analytics";

interface CartLine {
  id: string;
  quantity: number;
  isGift?: boolean;
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
    attributes?: Array<{
      attribute: {
        id: string;
        name: string;
        slug: string;
      };
      values: Array<{
        id: string;
        name: string;
        slug: string;
      }>;
    }> | null;
    pricing?: {
      price?: {
        gross: {
          amount: number;
          currency: string;
        };
      } | null;
      priceUndiscounted?: {
        gross: {
          amount: number;
          currency: string;
        };
      } | null;
    } | null;
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
  voucherCode?: string | null;
  voucherId?: string | null;
  discount?: { amount: number; currency: string } | null;
  discountName?: string | null;
}

interface CartClientProps {
  cart: CartData | null;
  channel: string;
  deleteLineAction: (lineId: string, productSlug?: string) => Promise<{ success: boolean; error?: string } | void>;
  updateLineQuantityAction: (lineId: string, quantity: number, productSlug?: string) => Promise<{ success: boolean; error?: string }>;
  createCheckoutWithItems?: (variantIds: { variantId: string; quantity: number }[], channel: string) => Promise<{ checkoutId: string } | null>;
  applyPromoCodeAction?: (checkoutId: string, promoCode: string) => Promise<{ success: boolean; error?: string }>;
  removePromoCodeAction?: (checkoutId: string, options: { promoCodeId?: string; promoCode?: string }) => Promise<{ success: boolean; error?: string }>;
}

export function CartClient({ 
  cart, 
  channel, 
  deleteLineAction,
  updateLineQuantityAction,
  createCheckoutWithItems,
  applyPromoCodeAction,
  removePromoCodeAction,
}: CartClientProps) {
  // Use hooks for config
  const branding = useBranding();
  const ecommerce = useEcommerceSettings();
  const content = useContentConfig();
  const primaryButtonStyle = useButtonStyle("primary");
  const saleBadgeStyle = useBadgeStyle("sale");
  
  const router = useRouter();
  const pathname = usePathname();
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoPending, setPromoPending] = useState(false);
  const [deletingLines, setDeletingLines] = useState<Set<string>>(new Set());
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);

  // Optimistic quantity state — shows user's intended quantity immediately
  const [optimisticQuantities, setOptimisticQuantities] = useState<Map<string, number>>(new Map());
  const debounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingQuantitiesRef = useRef<Map<string, number>>(new Map());

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      debounceTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // When server data arrives (via revalidatePath), clear matching optimistic entries
  useEffect(() => {
    if (!cart) return;
    setOptimisticQuantities(prev => {
      if (prev.size === 0) return prev;
      const next = new Map(prev);
      let changed = false;
      for (const line of cart.lines) {
        if (next.has(line.id) && next.get(line.id) === line.quantity) {
          next.delete(line.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [cart]);

  // One-time toast when cart has a gift line (Option A: show once per session)
  const giftToastShownRef = useRef(false);
  useEffect(() => {
    if (!cart?.lines?.length || giftToastShownRef.current) return;
    const hasGift = cart.lines.some((l) => l.isGift);
    if (hasGift) {
      giftToastShownRef.current = true;
      toast.info(content.cart.giftAddedMessage ?? "A free gift has been added to your cart.");
    }
  }, [cart?.lines, content.cart.giftAddedMessage]);

  // Reset navigation state when pathname changes (navigation completed)
  useEffect(() => {
    if (pathname && !pathname.includes('/checkout')) {
      setIsNavigatingToCheckout(false);
    }
  }, [pathname]);

  // Selection state - default all items selected
  const [selectedItems, setSelectedItems] = useState<Set<string>>(() => {
    if (!cart) return new Set();
    return new Set(cart.lines.map(line => line.id));
  });

  // Auto-select newly added cart lines when cart updates (e.g. after add to cart)
  const prevCartLineIdsRef = useRef<string>("");
  const cartLineIds = cart?.lines?.map((l) => l.id).join(",") ?? "";
  useEffect(() => {
    if (!cart?.lines?.length) return;
    const currentLineIds = new Set(cart.lines.map((l) => l.id));
    const previousLineIds = new Set(prevCartLineIdsRef.current ? prevCartLineIdsRef.current.split(",") : []);
    prevCartLineIdsRef.current = cartLineIds;

    setSelectedItems((prev) => {
      const newSet = new Set<string>();
      for (const id of currentLineIds) {
        const wasInPrevious = previousLineIds.has(id);
        const isNewLine = !wasInPrevious;
        const wasSelected = prev.has(id);
        if (wasSelected && wasInPrevious) newSet.add(id);
        if (isNewLine) newSet.add(id);
      }
      if (newSet.size === prev.size && [...newSet].every((id) => prev.has(id))) return prev;
      return newSet;
    });
  }, [cartLineIds, cart?.lines?.length]);

  // Calculate selected items summary, savings, and subtotal before discount (gift-aware)
  const { selectedLines, selectedSubtotal, selectedItemCount, totalSavings, subtotalBeforeDiscount } = useMemo(() => {
    if (!cart) return { selectedLines: [], selectedSubtotal: 0, selectedItemCount: 0, totalSavings: 0, subtotalBeforeDiscount: 0 };

    const lines = cart.lines.filter(line => selectedItems.has(line.id));
    const subtotal = lines.reduce((sum, line) => sum + line.totalPrice.gross.amount, 0);
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

    // Savings: for gift lines use full undiscounted value; for regular lines use (undiscounted - current) * qty.
    // Fallback for gift: if priceUndiscounted missing, use variant price so we show at least sale value.
    const savings = lines.reduce((sum, line) => {
      const undiscounted = line.variant.pricing?.priceUndiscounted?.gross?.amount ?? line.variant.pricing?.price?.gross?.amount ?? line.unitPrice.gross.amount ?? 0;
      const current = line.variant.pricing?.price?.gross?.amount ?? line.unitPrice.gross.amount ?? 0;
      const isGift = line.isGift;
      const lineSavings = isGift
        ? undiscounted * line.quantity
        : undiscounted > current
          ? (undiscounted - current) * line.quantity
          : 0;
      return sum + lineSavings;
    }, 0);

    // Subtotal before discount = sum of (undiscounted unit price * qty)
    const beforeDiscount = lines.reduce((sum, line) => {
      const undiscounted = line.variant.pricing?.priceUndiscounted?.gross?.amount ?? line.variant.pricing?.price?.gross?.amount ?? line.unitPrice.gross.amount ?? line.totalPrice.gross.amount / line.quantity;
      return sum + undiscounted * line.quantity;
    }, 0);

    return {
      selectedLines: lines,
      selectedSubtotal: subtotal,
      selectedItemCount: itemCount,
      totalSavings: savings,
      subtotalBeforeDiscount: beforeDiscount,
    };
  }, [cart, selectedItems]);

  const freeShippingThreshold = ecommerce.shipping.freeShippingThreshold;
  // Use same "Your price" as order summary so free shipping message matches threshold (no voucher/subtotal mismatch)
  const effectiveTotalForShipping = selectedItems.size > 0
    ? Math.max(0, subtotalBeforeDiscount - totalSavings - (cart?.discount?.amount ?? 0))
    : selectedSubtotal;
  const amountToFreeShipping = freeShippingThreshold
    ? Math.max(0, freeShippingThreshold - effectiveTotalForShipping)
    : null;
  const hasReachedFreeShipping = freeShippingThreshold != null && effectiveTotalForShipping >= freeShippingThreshold;

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

  // Helper functions to extract variant attributes
  const getAttributeFromVariant = (
    variant: CartLine["variant"],
    attributeName: string
  ): { id: string; name: string; slug: string } | null => {
    if (!variant?.attributes) return null;
    
    for (const attr of variant.attributes) {
      const attrName = attr.attribute?.name?.trim().toLowerCase();
      const attrSlug = attr.attribute?.slug?.trim().toLowerCase();
      const searchName = attributeName.toLowerCase();
      
      if (attrName === searchName || attrSlug === searchName) {
        const value = attr.values?.[0];
        if (value) {
          return {
            id: value.id,
            name: value.name,
            slug: value.slug || value.name.toLowerCase().replace(/\s+/g, "-"),
          };
        }
      }
    }
    
    return null;
  };
  
  const getColorFromVariant = (variant: CartLine["variant"]): { id: string; name: string; slug: string } | null => {
    return getAttributeFromVariant(variant, "color") || getAttributeFromVariant(variant, "colour");
  };
  
  // Helper function to convert color name to hex (basic mapping)
  const getColorHex = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      // Basic colors
      black: "#000000",
      white: "#FFFFFF",
      gray: "#808080",
      grey: "#808080",
      red: "#FF0000",
      blue: "#0000FF",
      green: "#008000",
      yellow: "#FFFF00",
      orange: "#FFA500",
      purple: "#800080",
      pink: "#FFC0CB",
      brown: "#A52A2A",
      beige: "#F5F5DC",
      navy: "#000080",
      maroon: "#800000",
      olive: "#808000",
      lime: "#00FF00",
      aqua: "#00FFFF",
      teal: "#008080",
      silver: "#C0C0C0",
      gold: "#FFD700",
      // Common variations
      dark: "#2C2C2C",
      light: "#E0E0E0",
      charcoal: "#36454F",
      cream: "#FFFDD0",
      ivory: "#FFFFF0",
      tan: "#D2B48C",
      khaki: "#C3B091",
      burgundy: "#800020",
      coral: "#FF7F50",
      salmon: "#FA8072",
      peach: "#FFE5B4",
      mint: "#98FB98",
      turquoise: "#40E0D0",
      lavender: "#E6E6FA",
      violet: "#8B00FF",
      indigo: "#4B0082",
      cyan: "#00FFFF",
      magenta: "#FF00FF",
    };
    
    const normalized = colorName.toLowerCase().trim();
    return colorMap[normalized] || "#6b7280"; // Default to gray if not found
  };
  
  const isOnSale = (variant: CartLine["variant"]): boolean => {
    if (!variant.pricing?.price || !variant.pricing.priceUndiscounted) return false;
    return variant.pricing.price.gross.amount < variant.pricing.priceUndiscounted.gross.amount;
  };

  // Helper to get the displayed quantity (optimistic or server)
  const getDisplayQuantity = useCallback((lineId: string, serverQuantity: number) => {
    return optimisticQuantities.get(lineId) ?? serverQuantity;
  }, [optimisticQuantities]);

  const handleUpdateQuantity = (lineId: string, newQuantity: number) => {
    const line = cart?.lines.find(l => l.id === lineId);
    if (!line) return;

    if (newQuantity < 1) {
      toast.error(content.cart.quantityMinError);
      return;
    }

    // Stock check: use server's original quantity for available calculation
    const totalAvailable = line.variant.quantityAvailable + line.quantity;
    const currentDisplayQty = getDisplayQuantity(lineId, line.quantity);
    if (newQuantity > currentDisplayQty && newQuantity > totalAvailable) {
      toast.error(content.cart.onlyXItemsAvailable.replace("{count}", totalAvailable.toString()));
      return;
    }

    // Set optimistic quantity immediately — no spinner, instant feedback
    setOptimisticQuantities(prev => new Map(prev).set(lineId, newQuantity));

    // Debounce the server call so rapid clicks coalesce into one mutation
    const existing = debounceTimersRef.current.get(lineId);
    if (existing) clearTimeout(existing);

    pendingQuantitiesRef.current.set(lineId, newQuantity);

    const timer = setTimeout(() => {
      const finalQty = pendingQuantitiesRef.current.get(lineId);
      if (finalQty === undefined) return;
      pendingQuantitiesRef.current.delete(lineId);
      debounceTimersRef.current.delete(lineId);

      updateLineQuantityAction(lineId, finalQty, line.variant.product.slug)
        .then(result => {
          if (result.success) {
            window.dispatchEvent(new CustomEvent("cart-updated"));
          } else {
            // Revert optimistic on error
            setOptimisticQuantities(prev => {
              const next = new Map(prev);
              next.delete(lineId);
              return next;
            });
            toast.error(result.error || content.cart.failedToUpdateQuantity);
          }
        });
    }, 400);

    debounceTimersRef.current.set(lineId, timer);
  };

  const handleDeleteLine = async (lineId: string) => {
    const line = cart?.lines.find(l => l.id === lineId);
    const productSlug = line?.variant.product.slug;

    // Cancel any pending quantity update for this line
    const pendingTimer = debounceTimersRef.current.get(lineId);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      debounceTimersRef.current.delete(lineId);
      pendingQuantitiesRef.current.delete(lineId);
    }

    setDeletingLines(prev => new Set(prev).add(lineId));
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.delete(lineId);
      return next;
    });

    const result = await deleteLineAction(lineId, productSlug);
    setDeletingLines(prev => {
      const next = new Set(prev);
      next.delete(lineId);
      return next;
    });
    if (result && !result.success) {
      toast.error(result.error ?? content.cart.failedToUpdateQuantity);
    } else if (result?.success) {
      toast.success(content.cart.quantityUpdatedSuccess ?? "Item removed");
      window.dispatchEvent(new CustomEvent("cart-updated"));
    }
  };

  const handleProceedToCheckout = async () => {
    if (!cart || selectedItems.size === 0) return;

    // GA4 begin_checkout event
    if (selectedLines.length > 0) {
      const firstCurrency = selectedLines[0].unitPrice.gross.currency;
      trackBeginCheckout({
        currency: firstCurrency,
        value: selectedLines.reduce((sum, l) => sum + l.totalPrice.gross.amount, 0),
        items: selectedLines.map((l) => ({
          item_id: l.variant.id,
          item_name: l.variant.product?.name || l.variant.name,
          price: l.unitPrice.gross.amount,
          currency: l.unitPrice.gross.currency,
          quantity: l.quantity,
        })),
        coupon: cart.voucherCode || undefined,
      });
    }

    // Set navigating state to show loader
    setIsNavigatingToCheckout(true);

    // If all items selected, use existing checkout (channel-aware)
    if (allSelected) {
      // Use replace to avoid stacking checkout entries in history
      router.replace(`/${channel}/checkout?checkout=${cart.id}`);
      // Keep loading state - it will be cleared when page unloads or navigation completes
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
          // Mark this checkout as "no gift" so checkout page removes any gift lines Saleor re-adds
          try {
            const raw = typeof window !== "undefined" ? sessionStorage.getItem("checkout-no-gift-ids") : null;
            const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
            if (Array.isArray(ids) && !ids.includes(result.checkoutId)) {
              sessionStorage.setItem("checkout-no-gift-ids", JSON.stringify([...ids, result.checkoutId]));
            }
          } catch {
            /* ignore */
          }
          // Store the line IDs that are being checked out for cleanup after purchase
          // This allows us to remove purchased items from the original cart
          const pendingCleanup = {
            originalCartId: cart.id,
            lineIds: Array.from(selectedItems),
            partialCheckoutId: result.checkoutId,
            timestamp: Date.now(),
          };
          localStorage.setItem('pendingCartCleanup', JSON.stringify(pendingCleanup));
          
          // Use replace to avoid stacking checkout entries in history (channel-aware)
          router.replace(`/${channel}/checkout?checkout=${result.checkoutId}`);
          // Keep loading state - it will be cleared when page unloads or navigation completes
        } else {
          setIsNavigatingToCheckout(false);
        }
      } catch (error) {
        console.error("Failed to create checkout:", error);
        setIsNavigatingToCheckout(false);
      } finally {
        setIsCreatingCheckout(false);
      }
    } else {
      // Fallback: use existing checkout (will include all items, channel-aware)
      router.replace(`/${channel}/checkout?checkout=${cart.id}`);
      // Keep loading state - it will be cleared when page unloads or navigation completes
    }
  };

  // Loading overlay during navigation to checkout
  const showLoadingOverlay = isNavigatingToCheckout;

  // Empty cart state
  if (!cart || cart.lines.length === 0) {
    return (
      <div className="min-h-screen animate-fade-in" style={{ backgroundColor: branding.colors.surface }}>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
            <div 
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full"
              style={{ backgroundColor: `${branding.colors.primary}15` }}
            >
              <svg className="h-12 w-12" style={{ color: branding.colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: branding.colors.text }}>
              {content.cart.emptyCartTitle}
            </h1>
            <p className="mt-3" style={{ color: branding.colors.textMuted }}>
              {content.cart.emptyCartMessage}
            </p>

            <div className="mt-8">
              <LinkWithChannel
                href="/products"
                className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ 
                  backgroundColor: primaryButtonStyle.backgroundColor,
                  color: primaryButtonStyle.color,
                }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {content.cart.continueShoppingButton}
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
    <div className="min-h-screen bg-neutral-50/50 relative animate-fade-in">
      {/* Full-page loading overlay during navigation to checkout */}
      {showLoadingOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <svg className="h-12 w-12 animate-spin text-neutral-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-lg font-medium text-neutral-700">{content.cart.loadingCheckoutTitle}</p>
            <p className="text-sm text-neutral-500">{content.cart.loadingCheckoutMessage}</p>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Free Shipping Progress */}
        {freeShippingThreshold && !hasReachedFreeShipping && amountToFreeShipping !== null && effectiveTotalForShipping > 0 && (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 sm:mb-8 animate-fade-in-up" style={{ animationDelay: "50ms", animationFillMode: "both" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-800">
                  {content.cart.addXMoreForFreeShipping.replace("{amount}", formatMoney(amountToFreeShipping, currency))}
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (effectiveTotalForShipping / freeShippingThreshold) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {hasReachedFreeShipping && effectiveTotalForShipping > 0 && (
          <div className="mb-6 rounded-xl bg-emerald-50 p-4 sm:mb-8 animate-fade-in-up" style={{ animationDelay: "50ms", animationFillMode: "both" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium text-emerald-800">
                🎉 {content.cart.unlockedFreeShipping}
              </p>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8 xl:gap-x-12">
          {/* Cart Items */}
          <div className="lg:col-span-7 xl:col-span-8 animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
            <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
              {/* Header with Select All */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-xl font-bold sm:text-2xl" style={{ color: branding.colors.text }}>
                  {content.cart.cartTitle} ({totalItemCount} {totalItemCount === 1 ? content.cart.itemSingular : content.cart.itemPlural})
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
                    {allSelected ? content.cart.deselectAllButton : content.cart.selectAllButton}
                  </button>
                </div>
              </div>

              {/* Selection Info Banner */}
              {!allSelected && selectedItems.size > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">{selectedItemCount}</span> {selectedItemCount === 1 ? content.cart.itemSingular : content.cart.itemPlural} of {totalItemCount} {totalItemCount === 1 ? content.cart.itemSingular : content.cart.itemPlural} {content.cart.selectItemsToCheckout}
                  </p>
                  <button
                    onClick={() => setSelectedItems(new Set(cart.lines.map(line => line.id)))}
                    className="text-sm font-medium text-blue-700 hover:underline"
                  >
                    {content.cart.selectAllItemsButton}
                  </button>
                </div>
              )}

              {noneSelected && (
                <div className="mt-4 flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-3">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-amber-700">
                    {content.cart.selectItemsToCheckout}
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
                            alt={item.variant.product.thumbnail.alt || ((item.variant.product as any).translation?.name || item.variant.product.name)}
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
                            <div className="flex items-center gap-2">
                              {/* Color cube/swatch */}
                              {(() => {
                                const color = getColorFromVariant(item.variant);
                                if (color) {
                                  return (
                                    <div
                                      className="h-4 w-4 flex-shrink-0 rounded border border-neutral-300"
                                      style={{ backgroundColor: getColorHex(color.name) }}
                                      title={color.name}
                                    />
                                  );
                                }
                                return null;
                              })()}
                              <LinkWithChannel
                                href={getHrefForVariant({
                                  productSlug: item.variant.product.slug,
                                  variantId: item.variant.id,
                                })}
                                className="font-medium text-neutral-900 hover:text-neutral-700"
                              >
                                {(item.variant.product as any).translation?.name || item.variant.product.name}
                              </LinkWithChannel>
                              {item.isGift && (
                                <span className="ml-2 inline-flex items-center">
                                  <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
                                    {content.cart.giftLabel ?? "Gift"}
                                  </span>
                                </span>
                              )}
                            </div>
                            {item.variant.product.category?.name && (
                              <p className="mt-0.5 text-sm text-neutral-500">
                                {(item.variant.product.category as any).translation?.name || item.variant.product.category.name}
                              </p>
                            )}
                            {item.variant.name !== item.variant.id && (
                              <p className="mt-0.5 text-sm text-neutral-500">
                                {item.variant.name}
                              </p>
                            )}
                            {/* Display sale badge if on sale */}
                            {isOnSale(item.variant) && (
                              <span 
                                className="mt-1 inline-block rounded px-2 py-0.5 text-xs font-semibold"
                                style={{
                                  backgroundColor: saleBadgeStyle.backgroundColor,
                                  color: saleBadgeStyle.color,
                                }}
                              >
                                {content.product.saleBadgeText}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-neutral-900">
                              {formatMoney(item.totalPrice.gross.amount, item.totalPrice.gross.currency)}
                            </p>
                            {isOnSale(item.variant) && item.variant.pricing?.priceUndiscounted && (
                              <p className="mt-0.5 text-sm text-neutral-400 line-through">
                                {formatMoney(
                                  item.variant.pricing.priceUndiscounted.gross.amount * item.quantity,
                                  item.variant.pricing.priceUndiscounted.gross.currency
                                )}
                              </p>
                            )}
                            <p className="mt-0.5 text-xs text-neutral-500">
                              {formatMoney(item.unitPrice.gross.amount, item.unitPrice.gross.currency)} {content.cart.eachLabel}
                            </p>
                            <p className={`mt-0.5 text-xs ${item.variant.quantityAvailable > 0 ? 'text-neutral-500' : 'text-red-600 font-medium'}`}>
                              {item.variant.quantityAvailable > 0 
                                ? `${item.variant.quantityAvailable} ${content.cart.availableLabel}`
                                : content.cart.outOfStockLabel}
                            </p>
                          </div>
                        </div>

                        {/* Quantity & Actions — hide for gift; gift is always qty 1, deselect to exclude */}
                        <div className="mt-auto flex items-center justify-between pt-3">
                          {item.isGift ? (
                            <p className="text-xs text-neutral-500">
                              {content.cart.giftRemoveHint ?? "Deselect above to exclude from checkout"}
                            </p>
                          ) : (
                            <>
                              {/* Quantity Controls */}
                              {(() => {
                                const displayQty = getDisplayQuantity(item.id, item.quantity);
                                const totalAvailable = item.variant.quantityAvailable + item.quantity;
                                return (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuantity(item.id, displayQty - 1)}
                                      disabled={displayQty <= 1 || isDeleting}
                                      className="flex h-8 w-8 items-center justify-center rounded border border-neutral-300 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                                      title={displayQty <= 1 ? "Use Delete to remove item" : undefined}
                                    >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                      </svg>
                                    </button>
                                    <div className="flex min-w-[3rem] items-center justify-center rounded border border-neutral-200 bg-neutral-50 px-3 py-1">
                                      <span className="text-sm font-medium text-neutral-700">
                                        {displayQty}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuantity(item.id, displayQty + 1)}
                                      disabled={
                                        item.variant.quantityAvailable === 0 ||
                                        displayQty >= totalAvailable ||
                                        isDeleting
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded border border-neutral-300 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                                      title={
                                        item.variant.quantityAvailable === 0
                                          ? "No additional stock available"
                                          : undefined
                                      }
                                    >
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              })()}

                              {/* Actions */}
                              <div className="flex items-center gap-4">
                                {/* Save for Later (just deselect) */}
                                {isSelected && (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectItem(item.id)}
                                    className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-800"
                                  >
                                    {content.cart.saveForLaterButton}
                                  </button>
                                )}
                                {!isSelected && (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectItem(item.id)}
                                    className="text-sm font-medium transition-colors hover:opacity-80"
                                    style={{ color: branding.colors.primary }}
                                  >
                                    {content.cart.moveToCartButton}
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
                                  {content.cart.deleteButton}
                                </>
                              )}
                            </button>
                          </div>
                            </>
                          )}
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
                  {content.cart.continueShoppingButton}
                </LinkWithChannel>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-8 lg:col-span-5 lg:mt-0 xl:col-span-4 animate-fade-in-up" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
            <div className="sticky top-24 rounded-xl bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-neutral-900">
                {content.cart.orderSummaryTitle}
                {!allSelected && selectedItems.size > 0 && (
                  <span className="ml-2 text-sm font-normal text-neutral-500">
                    ({selectedItemCount} {selectedItemCount === 1 ? content.cart.itemSingular : content.cart.itemPlural} selected)
                  </span>
                )}
              </h2>

              {/* Promo Code: applied voucher or input */}
              <div className="mt-6">
                {cart.voucherCode ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-emerald-800 truncate">
                        {(content.cart as Record<string, string>).voucherLabel ?? "Voucher"}: {cart.voucherCode}
                      </p>
                      {cart.discount && (
                        <p className="text-xs text-emerald-600 mt-0.5">
                          −{formatMoney(cart.discount.amount, cart.discount.currency)}
                          {cart.discountName ? ` (${cart.discountName})` : ""}
                        </p>
                      )}
                    </div>
                    {removePromoCodeAction && (
                      <button
                        type="button"
                        onClick={async () => {
                          setPromoPending(true);
                          setPromoError(null);
                          const result = await removePromoCodeAction(cart.id, {
                            promoCodeId: cart.voucherId ?? undefined,
                            promoCode: cart.voucherCode ?? undefined,
                          });
                          setPromoPending(false);
                          if (result.success) {
                            toast.success((content.cart as Record<string, string>).voucherRemoved ?? "Voucher removed");
                            window.dispatchEvent(new CustomEvent("cart-updated"));
                          } else {
                            setPromoError(result.error ?? "Failed to remove");
                          }
                        }}
                        disabled={promoPending}
                        className="shrink-0 rounded p-1.5 text-neutral-500 hover:bg-emerald-100 hover:text-neutral-700 disabled:opacity-50"
                        aria-label="Remove voucher"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <label htmlFor="promo" className="block text-sm font-medium text-neutral-700">
                      {content.cart.promoCodeLabel}
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        id="promo"
                        value={promoCodeInput}
                        onChange={(e) => {
                          setPromoCodeInput(e.target.value);
                          setPromoError(null);
                        }}
                        placeholder={content.cart.promoCodePlaceholder}
                        className="flex-1 rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2"
                        style={{ "--tw-ring-color": branding.colors.primary } as React.CSSProperties}
                      />
                      <button
                        type="button"
                        disabled={!promoCodeInput.trim() || promoPending || !applyPromoCodeAction}
                        onClick={async () => {
                          if (!applyPromoCodeAction || !promoCodeInput.trim()) return;
                          setPromoPending(true);
                          setPromoError(null);
                          const result = await applyPromoCodeAction(cart.id, promoCodeInput.trim());
                          setPromoPending(false);
                          if (result.success) {
                            toast.success((content.cart as Record<string, string>).promoCodeApplied ?? "Promo code applied");
                            setPromoCodeInput("");
                            window.dispatchEvent(new CustomEvent("cart-updated"));
                          } else {
                            setPromoError(result.error ?? "Invalid code");
                          }
                        }}
                        className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {promoPending ? (
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          content.cart.promoCodeApplyButton
                        )}
                      </button>
                    </div>
                    {promoError && (
                      <p className="mt-1.5 text-sm text-red-600">{promoError}</p>
                    )}
                  </>
                )}
              </div>

              {/* Order summary: single clear section for subtotal, savings, voucher, shipping, total */}
              <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-neutral-900 mb-4">
                  {(content.cart as { orderSummaryTitle?: string }).orderSummaryTitle ?? "Order summary"}
                  {!allSelected && selectedItemCount > 0 && (
                    <span className="ml-1 font-normal text-neutral-500">
                      ({selectedItemCount} {selectedItemCount === 1 ? content.cart.itemSingular : content.cart.itemPlural})
                    </span>
                  )}
                </h3>
                <dl className="space-y-3 text-sm">
                  {(() => {
                    const voucherAmount = cart?.discount?.amount ?? 0;
                    const combinedSavings = totalSavings + voucherAmount;
                    return combinedSavings > 0 ? (
                      <>
                        <div className="flex justify-between text-neutral-500">
                          <dt>{(content.cart as { originalSubtotalLabel?: string })?.originalSubtotalLabel ?? content.cart.subtotalLabel ?? "Subtotal"}</dt>
                          <dd className="line-through">{formatMoney(subtotalBeforeDiscount, currency)}</dd>
                        </div>
                        <div className="flex justify-between items-center rounded-lg bg-emerald-50 px-3 py-2 border border-emerald-200">
                          <dt className="flex items-center gap-1.5 font-medium text-emerald-800">
                            <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                              <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5z" clipRule="evenodd" />
                            </svg>
                            {(content.cart as { youSaveLabel?: string })?.youSaveLabel ?? "You save"}
                          </dt>
                          <dd className="font-semibold text-emerald-800">−{formatMoney(combinedSavings, currency)}</dd>
                        </div>
                      </>
                    ) : null;
                  })()}
                  <div className="flex justify-between">
                    <dt className="text-neutral-600">
                      {(content.cart as { discountedSubtotalLabel?: string })?.discountedSubtotalLabel ?? "Your price"}
                      {!allSelected && selectedItemCount > 0 && ` (${selectedItemCount})`}
                    </dt>
                    <dd className="font-medium text-neutral-900">
                      {formatMoney(
                        selectedItems.size > 0
                          ? Math.max(0, subtotalBeforeDiscount - totalSavings - (cart?.discount?.amount ?? 0))
                          : selectedSubtotal,
                        currency
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <dt>{content.cart.shippingLabel}</dt>
                    <dd>
                      {selectedSubtotal > 0 && hasReachedFreeShipping ? (
                        <span className="text-emerald-600 font-medium">{content.cart.shippingFree}</span>
                      ) : (
                        content.cart.shippingCalculatedAtCheckout
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-neutral-200 pt-3 mt-3">
                    <dt className="text-base font-semibold text-neutral-900">{content.cart.totalLabel}</dt>
                    <dd className="text-base font-semibold text-neutral-900">
                      {formatMoney(
                        selectedItems.size > 0
                          ? Math.max(0, subtotalBeforeDiscount - totalSavings - (cart?.discount?.amount ?? 0))
                          : selectedSubtotal,
                        currency
                      )}
                    </dd>
                  </div>
                </dl>
                {!allSelected && selectedItems.size > 0 && (cart?.voucherCode ?? cart?.discount) && (
                  <p className="mt-3 text-xs text-neutral-500">{content.cart.shippingCalculatedAtCheckout}</p>
                )}
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                disabled={noneSelected || isCreatingCheckout || isNavigatingToCheckout}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ 
                  backgroundColor: primaryButtonStyle.backgroundColor,
                  color: primaryButtonStyle.color,
                }}
              >
                {(isCreatingCheckout || isNavigatingToCheckout) ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {isCreatingCheckout ? content.cart.preparingCheckout : content.cart.loadingCheckout}
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {noneSelected
                      ? content.cart.selectItemsButton
                      : allSelected
                      ? content.cart.checkoutButton
                      : `${content.cart.checkoutButton} (${selectedItemCount})`}
                  </>
                )}
              </button>

              {/* Non-selected items note */}
              {!allSelected && selectedItems.size > 0 && (
                <p className="mt-3 text-center text-xs text-neutral-500">
                  {(() => {
                    const savedCount = cart.lines.length - selectedItems.size;
                    return content.cart.itemsSavedForLater
                      .replace("{count}", savedCount.toString())
                      .replace("item(s)", savedCount === 1 ? content.cart.itemSingular : content.cart.itemPlural);
                  })()}
                </p>
              )}

              {/* Trust Badges */}
              <div className="mt-6 flex items-center justify-center gap-4 border-t border-neutral-200 pt-6">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {content.cart.secureCheckoutText}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {content.cart.sslEncryptedText}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
