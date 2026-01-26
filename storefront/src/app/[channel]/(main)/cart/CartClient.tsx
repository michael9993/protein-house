"use client";

import Image from "next/image";
import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-toastify";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { formatMoney, getHrefForVariant } from "@/lib/utils";
import { useBranding, useEcommerceSettings, useContentConfig, useButtonStyle, useBadgeStyle } from "@/providers/StoreConfigProvider";

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
}

interface CartClientProps {
  cart: CartData | null;
  channel: string;
  deleteLineAction: (lineId: string, productSlug?: string) => Promise<void>;
  updateLineQuantityAction: (lineId: string, quantity: number, productSlug?: string) => Promise<{ success: boolean; error?: string }>;
  createCheckoutWithItems?: (variantIds: { variantId: string; quantity: number }[], channel: string) => Promise<{ checkoutId: string } | null>;
}

export function CartClient({ 
  cart, 
  channel, 
  deleteLineAction,
  updateLineQuantityAction,
  createCheckoutWithItems,
}: CartClientProps) {
  // Use hooks for config
  const branding = useBranding();
  const ecommerce = useEcommerceSettings();
  const content = useContentConfig();
  const primaryButtonStyle = useButtonStyle("primary");
  const saleBadgeStyle = useBadgeStyle("sale");
  
  const router = useRouter();
  const pathname = usePathname();
  const [promoCode, setPromoCode] = useState("");
  const [deletingLines, setDeletingLines] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);

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

  const [updatingQuantities, setUpdatingQuantities] = useState<Set<string>>(new Set());

  const handleUpdateQuantity = async (lineId: string, newQuantity: number) => {
    const line = cart?.lines.find(l => l.id === lineId);
    if (!line) return;
    
    // Validate quantity
    if (newQuantity < 1) {
      toast.error(content.cart.quantityMinError);
      return;
    }
    
    // Calculate total available stock (what's available + what's already in cart)
    const totalAvailable = line.variant.quantityAvailable + line.quantity;
    
    // Only check stock limit when increasing quantity
    // When decreasing, we're freeing up stock, so it's always allowed
    if (newQuantity > line.quantity && newQuantity > totalAvailable) {
      toast.error(content.cart.onlyXItemsAvailable.replace("{count}", totalAvailable.toString()));
      return;
    }
    
    // When decreasing, ensure we don't go below 1 (use Delete button instead)
    if (newQuantity < 1) {
      toast.error(content.cart.useDeleteButtonMessage);
      return;
    }
    
    setUpdatingQuantities(prev => new Set(prev).add(lineId));
    
    startTransition(async () => {
      const result = await updateLineQuantityAction(
        lineId,
        newQuantity,
        line.variant.product.slug
      );
      
      setUpdatingQuantities(prev => {
        const next = new Set(prev);
        next.delete(lineId);
        return next;
      });
      
      if (result.success) {
        toast.success(content.cart.quantityUpdatedSuccess);
        router.refresh();
      } else {
        toast.error(result.error || content.cart.failedToUpdateQuantity);
      }
    });
  };

  const handleDeleteLine = async (lineId: string) => {
    // Find the product slug for this line before deleting
    const line = cart?.lines.find(l => l.id === lineId);
    const productSlug = line?.variant.product.slug;
    
    setDeletingLines(prev => new Set(prev).add(lineId));
    // Also remove from selected items
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.delete(lineId);
      return next;
    });
    startTransition(async () => {
      await deleteLineAction(lineId, productSlug);
      setDeletingLines(prev => {
        const next = new Set(prev);
        next.delete(lineId);
        return next;
      });
    });
  };

  const handleProceedToCheckout = async () => {
    if (!cart || selectedItems.size === 0) return;

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
        {freeShippingThreshold && !hasReachedFreeShipping && amountToFreeShipping !== null && selectedSubtotal > 0 && (
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
                      width: `${Math.min(100, (selectedSubtotal / freeShippingThreshold) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {hasReachedFreeShipping && selectedSubtotal > 0 && (
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
                                {item.variant.product.name}
                              </LinkWithChannel>
                            </div>
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

                        {/* Quantity & Actions */}
                        <div className="mt-auto flex items-center justify-between pt-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updatingQuantities.has(item.id) || isDeleting}
                              className="flex h-8 w-8 items-center justify-center rounded border border-neutral-300 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                              title={item.quantity <= 1 ? "Use Delete to remove item" : undefined}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <div className="flex min-w-[3rem] items-center justify-center rounded border border-neutral-200 bg-neutral-50 px-3 py-1">
                              {updatingQuantities.has(item.id) ? (
                                <svg className="h-4 w-4 animate-spin text-neutral-500" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <span className="text-sm font-medium text-neutral-700">
                                  {item.quantity}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={
                                item.variant.quantityAvailable === 0 ||
                                updatingQuantities.has(item.id) ||
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

              {/* Promo Code */}
              <div className="mt-6">
                <label htmlFor="promo" className="block text-sm font-medium text-neutral-700">
                  {content.cart.promoCodeLabel}
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    id="promo"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder={content.cart.promoCodePlaceholder}
                    className="flex-1 rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2"
                    style={{ "--tw-ring-color": branding.colors.primary } as React.CSSProperties}
                  />
                  <button
                    type="button"
                    disabled={!promoCode.trim()}
                    className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {content.cart.promoCodeApplyButton}
                  </button>
                </div>
              </div>

              {/* Summary Lines */}
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-600">
                    {content.cart.subtotalLabelWithCount.replace("{count}", selectedItemCount.toString())}
                  </dt>
                  <dd className="font-medium text-neutral-900">
                    {formatMoney(selectedSubtotal, currency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-600">{content.cart.shippingLabel}</dt>
                  <dd className="font-medium text-neutral-900">
                    {selectedSubtotal > 0 && hasReachedFreeShipping ? (
                      <span className="text-emerald-600">{content.cart.shippingFree}</span>
                    ) : (
                      content.cart.shippingCalculatedAtCheckout
                    )}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-3">
                  <dt className="text-base font-semibold text-neutral-900">{content.cart.totalLabel}</dt>
                  <dd className="text-base font-semibold text-neutral-900">
                    {formatMoney(selectedSubtotal, currency)}
                  </dd>
                </div>
              </dl>

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                disabled={noneSelected || isCreatingCheckout || isNavigatingToCheckout}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
                    {isCreatingCheckout ? "Preparing..." : "Loading..."}
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {noneSelected
                      ? "Select Items"
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

              {/* Payment Methods */}
              <div className="mt-6 border-t border-neutral-200 pt-6">
                <p className="mb-3 text-center text-xs text-neutral-500">{content.cart.acceptedPaymentMethods}</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {/* Visa */}
                  <div className="flex h-8 w-14 items-center justify-center rounded border border-neutral-200 bg-white p-1.5">
                    <svg className="h-full w-full" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="48" height="32" rx="4" fill="#1434CB"/>
                      <path d="M20 11h8l-4.5 10h-8l4.5-10z" fill="white"/>
                      <path d="M28 11h4l2.5 10h-4l-2.5-10z" fill="#FF5F00"/>
                    </svg>
                  </div>
                  {/* Mastercard */}
                  <div className="flex h-8 w-14 items-center justify-center rounded border border-neutral-200 bg-white p-1.5">
                    <svg className="h-full w-full" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="48" height="32" rx="4" fill="#EB001B"/>
                      <circle cx="18" cy="16" r="6" fill="#FF5F00"/>
                      <circle cx="30" cy="16" r="6" fill="#EB001B"/>
                    </svg>
                  </div>
                  {/* Google Pay */}
                  <div className="flex h-8 w-14 items-center justify-center rounded border border-neutral-200 bg-white p-1">
                    <svg className="h-full w-full" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="48" height="32" rx="4" fill="#000000"/>
                      <path d="M16 10h16v12h-16v-12z" fill="white"/>
                      <path d="M18 12h12v8h-12v-8z" fill="#4285F4"/>
                      <path d="M18 12h6v8h-6v-8z" fill="#EA4335"/>
                      <path d="M24 12h6v4h-6v-4z" fill="#FBBC04"/>
                      <path d="M24 16h6v4h-6v-4z" fill="#34A853"/>
                    </svg>
                  </div>
                  {/* PayPal */}
                  <div className="flex h-8 w-14 items-center justify-center rounded border border-neutral-200 bg-white p-1.5">
                    <svg className="h-full w-full" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="48" height="32" rx="4" fill="#0070BA"/>
                      <path d="M18 12h8c2 0 3.5 1.5 3.5 3.5s-1.5 3.5-3.5 3.5h-6v3h-2v-10zm2 5h6c1 0 1.5-0.5 1.5-1.5s-0.5-1.5-1.5-1.5h-6v3z" fill="white"/>
                    </svg>
                  </div>
                  {/* Link (Stripe) */}
                  <div className="flex h-8 w-14 items-center justify-center rounded border border-neutral-200 bg-white p-1.5" style={{ backgroundColor: "#635BFF" }}>
                    <span className="text-[9px] font-bold text-white">Link</span>
                  </div>
                </div>
                <p className="mt-2 text-center text-[10px] text-neutral-400">{content.cart.providedByStripe}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
