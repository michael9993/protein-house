"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartDrawer } from '@/providers/CartDrawerProvider';
import { useDirection } from '@/providers/DirectionProvider';
import { useBranding, useContentConfig, useBadgeStyle, useUiConfig, useEcommerceSettings } from '@/providers/StoreConfigProvider';
import { formatMoney } from '@/lib/utils';

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
    quantityAvailable?: number;
    attributes?: Array<{
      attribute: { name: string };
      values: Array<{ name: string }>;
    }>;
    pricing?: {
      price?: { gross: { amount: number; currency: string } } | null;
      priceUndiscounted?: { gross: { amount: number; currency: string } } | null;
    } | null;
    product: {
      id?: string;
      name: string;
      slug: string;
      thumbnail?: { url: string; alt?: string } | null;
      category?: { name: string } | null;
    };
  };
}

interface CartDrawerProps {
  checkoutData: {
    id: string;
    lines: CartLine[];
    totalPrice: { gross: { amount: number; currency: string } };
    voucherCode?: string | null;
    voucherId?: string | null;
    discount?: { amount: number; currency: string } | null;
    discountName?: string | null;
  } | null;
  onUpdateQuantity?: (lineId: string, quantity: number) => Promise<void>;
  onDeleteLine?: (lineId: string) => Promise<void>;
  onApplyPromoCode?: (checkoutId: string, promoCode: string) => Promise<{ success: boolean; error?: string }>;
  onRemovePromoCode?: (checkoutId: string, options: { promoCodeId?: string; promoCode?: string }) => Promise<{ success: boolean; error?: string }>;
  /** When user has partial selection (e.g. gift deselected), create checkout with only selected items and redirect */
  onCreateCheckoutWithSelection?: (items: { variantId: string; quantity: number }[]) => Promise<{ checkoutId: string } | null>;
  channel: string;
  loading?: boolean;
}

export function CartDrawer({ checkoutData, onUpdateQuantity, onDeleteLine, onApplyPromoCode, onRemovePromoCode, onCreateCheckoutWithSelection, channel, loading = false }: CartDrawerProps) {
  const { isOpen, closeDrawer } = useCartDrawer();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const branding = useBranding();
  const { direction, isRTL, drawerSide } = useDirection();
  const content = useContentConfig();
  const ui = useUiConfig();
  const ecommerce = useEcommerceSettings();
  const saleBadgeStyle = useBadgeStyle("sale");
  const drawerRef = useRef<HTMLDivElement>(null);

  const cartUi = ui.cart as { showDeleteText?: boolean; showSaveForLater?: boolean } | undefined;
  const showDeleteText = cartUi?.showDeleteText ?? false;
  const showSaveForLater = cartUi?.showSaveForLater ?? false;
  
  const isLeft = drawerSide === 'left'; // position only: which side of screen
  
  const cartText = content.cart;
  const lines = checkoutData?.lines ?? [];
  const currency = checkoutData?.totalPrice?.gross?.currency ?? 'USD';
  const voucherCode = checkoutData?.voucherCode ?? null;
  const voucherId = checkoutData?.voucherId ?? null;
  const discount = checkoutData?.discount ?? null;
  const discountName = checkoutData?.discountName ?? null;

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoPending, setPromoPending] = useState(false);

  // Selection state - default all items selected
  const [selectedItems, setSelectedItems] = useState<Set<string>>(() => new Set(lines.map(line => line.id)));

  // Track previous line ids to auto-select newly added items
  const prevLineIdsRef = useRef<string>("");

  // Stable line IDs for dependency tracking
  const lineIds = lines.map(l => l.id).join(",");

  // Sync selection when lines change: keep existing selection, auto-select new lines, drop removed
  useEffect(() => {
    const currentLineIds = new Set(lines.map((l) => l.id));
    const previousLineIds = new Set(prevLineIdsRef.current ? prevLineIdsRef.current.split(",") : []);
    prevLineIdsRef.current = lineIds;

    setSelectedItems((prev: Set<string>) => {
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
  }, [lineIds]);

  // Computed values including savings
  const { selectedSubtotal, selectedItemCount, allSelected, noneSelected, totalSavings, subtotalBeforeDiscount } = useMemo(() => {
    const selected = lines.filter(line => selectedItems.has(line.id));
    const subtotal = selected.reduce((sum, line) => sum + line.totalPrice.gross.amount, 0);
    const itemCount = selected.reduce((sum, line) => sum + line.quantity, 0);
    const all = lines.length > 0 && selectedItems.size === lines.length;
    const none = selectedItems.size === 0;
    
    // Calculate total savings: for gift lines use full undiscounted value (they pay 0);
    // for regular lines use (undiscounted - current) * qty.
    // Fallback for gift: if priceUndiscounted missing, use variant price so we show at least sale value.
    const savings = selected.reduce((sum, line) => {
      const undiscounted = line.variant.pricing?.priceUndiscounted?.gross?.amount ?? line.variant.pricing?.price?.gross?.amount ?? 0;
      const current = line.variant.pricing?.price?.gross?.amount ?? 0;
      const isGift = (line as { isGift?: boolean }).isGift;
      const lineSavings = isGift
        ? undiscounted * line.quantity
        : (undiscounted > current) ? (undiscounted - current) * line.quantity : 0;
      return sum + lineSavings;
    }, 0);

    // Subtotal before discount = sum of (undiscounted unit price * qty) so it reflects true "full price"
    const subtotalBeforeDiscount = selected.reduce((sum, line) => {
      const undiscounted = line.variant.pricing?.priceUndiscounted?.gross?.amount ?? line.variant.pricing?.price?.gross?.amount ?? line.totalPrice.gross.amount / line.quantity;
      return sum + undiscounted * line.quantity;
    }, 0);
    
    return { selectedSubtotal: subtotal, selectedItemCount: itemCount, allSelected: all, noneSelected: none, totalSavings: savings, subtotalBeforeDiscount };
  }, [lines, selectedItems]);

  const totalItemCount = useMemo(() => lines.reduce((acc, line) => acc + line.quantity, 0), [lines]);

  const freeShippingThreshold = ecommerce.shipping.freeShippingThreshold;
  // Use same "Your price" as order summary so free shipping message matches threshold (no voucher/subtotal mismatch)
  const effectiveTotalForShipping = selectedItemCount > 0
    ? Math.max(0, subtotalBeforeDiscount - totalSavings - (discount?.amount ?? 0))
    : selectedSubtotal;
  const amountToFreeShipping = freeShippingThreshold != null
    ? Math.max(0, freeShippingThreshold - effectiveTotalForShipping)
    : null;
  const hasReachedFreeShipping = freeShippingThreshold != null && effectiveTotalForShipping >= freeShippingThreshold;

  // Handlers
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(lines.map(line => line.id)));
    }
  }, [allSelected, lines]);

  const handleSelectItem = useCallback((lineId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(lineId)) {
        next.delete(lineId);
      } else {
        next.add(lineId);
      }
      return next;
    });
  }, []);

  const isOnSale = useCallback((variant: CartLine['variant']): boolean => {
    if (!variant.pricing?.price || !variant.pricing.priceUndiscounted) return false;
    return variant.pricing.price.gross.amount < variant.pricing.priceUndiscounted.gross.amount;
  }, []);

  // Keyboard handling
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeDrawer();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeDrawer]);

  useEffect(() => {
    if (isOpen && drawerRef.current) drawerRef.current.focus();
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`cart-drawer-overlay ${isOpen ? 'cart-drawer-overlay--open' : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={cartText?.cartTitle ?? 'Shopping Cart'}
        tabIndex={-1}
        className={`cart-drawer ${isOpen ? 'cart-drawer--open' : ''} ${isLeft ? 'cart-drawer--left' : ''}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">
            {cartText?.cartTitle ?? 'Shopping Cart'}
            {lines.length > 0 && <span className="cart-drawer__count">({totalItemCount})</span>}
          </h2>
          <button onClick={closeDrawer} className="cart-drawer__close" aria-label="Close cart">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Select All Bar */}
        {lines.length > 0 && (
          <div className="cart-drawer__select-bar">
            <button onClick={handleSelectAll} className="cart-drawer__select-all">
              <div className={`cart-drawer__checkbox ${allSelected ? 'cart-drawer__checkbox--checked' : ''}`}
                   style={allSelected ? { backgroundColor: branding.colors.primary } : undefined}>
                {allSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span style={{ color: branding.colors.primary }}>
                {allSelected ? cartText?.deselectAllButton ?? 'Deselect All' : cartText?.selectAllButton ?? 'Select All'}
              </span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="cart-drawer__content relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
            </div>
          )}
          
          {lines.length === 0 ? (
            <div className="cart-drawer__empty">
              <div className="cart-drawer__empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="cart-drawer__empty-text">{cartText?.emptyCartMessage ?? 'Your cart is empty'}</p>
              <button onClick={closeDrawer} className="cart-drawer__continue-btn" style={{ backgroundColor: branding.colors.primary }}>
                {cartText?.continueShoppingButton ?? 'Continue Shopping'}
              </button>
            </div>
          ) : (
            <div className="cart-drawer__items">
              {lines.map((line) => {
                const isSelected = selectedItems.has(line.id);
                const onSale = isOnSale(line.variant);
                const unitPrice = line.unitPrice?.gross ?? line.variant.pricing?.price?.gross;
                const undiscountedPrice = line.variant.pricing?.priceUndiscounted?.gross;

                return (
                  <div key={line.id} className={`cart-drawer__item ${!isSelected ? 'opacity-60' : ''}`}>
                    {/* Checkbox */}
                    <button onClick={() => handleSelectItem(line.id)} className="cart-drawer__item-checkbox" disabled={loading}>
                      <div className={`cart-drawer__checkbox ${isSelected ? 'cart-drawer__checkbox--checked' : ''}`}
                           style={isSelected ? { backgroundColor: branding.colors.primary } : undefined}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>

                    {/* Image */}
                    <div className="cart-drawer__item-image">
                      {line.variant.product.thumbnail?.url ? (
                        <Image
                          src={line.variant.product.thumbnail.url}
                          alt={line.variant.product.thumbnail.alt ?? line.variant.product.name}
                          width={80}
                          height={80}
                          className="cart-drawer__item-img"
                        />
                      ) : (
                        <div className="cart-drawer__item-placeholder">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="cart-drawer__item-info">
                      <div className="cart-drawer__item-row flex justify-between items-start gap-2">
                        <div className="cart-drawer__info-col flex-1 min-w-0">
                          <Link href={`/${channel}/products/${line.variant.product.slug}`} className="cart-drawer__item-name" onClick={closeDrawer}>
                            {line.variant.product.name}
                          </Link>
                          {(line as { isGift?: boolean }).isGift && (
                            <span className="ml-1.5 inline-flex items-center">
                              <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
                                {(cartText as { giftLabel?: string })?.giftLabel ?? 'Gift'}
                              </span>
                            </span>
                          )}
                          {line.variant.product.category && (
                            <p className="text-xs text-gray-500">{line.variant.product.category.name}</p>
                          )}
                          {line.variant.name !== line.variant.product.name && (
                            <p className="text-xs text-gray-500">{line.variant.name}</p>
                          )}
                          {onSale && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded"
                                  style={{ backgroundColor: saleBadgeStyle.backgroundColor, color: saleBadgeStyle.color }}>
                              {content.product?.saleBadgeText ?? 'Sale'}
                            </span>
                          )}
                        </div>
                        <div className="cart-drawer__price-col text-right flex-shrink-0">
                          <p className="font-semibold text-gray-900">
                            {formatMoney(line.totalPrice.gross.amount, line.totalPrice.gross.currency)}
                          </p>
                          {onSale && undiscountedPrice && (
                            <p className="text-xs text-gray-400 line-through">
                              {formatMoney(undiscountedPrice.amount * line.quantity, undiscountedPrice.currency)}
                            </p>
                          )}
                          {unitPrice && (
                            <p className="text-xs text-gray-500">
                              {formatMoney(unitPrice.amount, unitPrice.currency)} {cartText?.eachLabel ?? 'each'}
                            </p>
                          )}
                          <p className={`text-xs ${(line.variant.quantityAvailable ?? 0) > 0 ? 'text-gray-500' : 'text-red-600 font-medium'}`}>
                            {(line.variant.quantityAvailable ?? 0) > 0
                              ? `${line.variant.quantityAvailable} ${cartText?.availableLabel ?? 'available'}`
                              : cartText?.outOfStockLabel ?? 'Out of stock'}
                          </p>
                        </div>
                      </div>

                      {/* Quantity & Actions — gift: no quantity/delete, deselect to exclude */}
                      <div className="cart-drawer__actions-row flex justify-between items-center mt-3">
                        {(line as { isGift?: boolean }).isGift ? (
                          <p className="text-xs text-gray-500">
                            {(cartText as { giftRemoveHint?: string })?.giftRemoveHint ?? 'Deselect to exclude from checkout'}
                          </p>
                        ) : (
                          <>
                            <div className="cart-drawer__item-qty">
                              <button
                                onClick={() => line.quantity > 1 ? onUpdateQuantity?.(line.id, line.quantity - 1) : onDeleteLine?.(line.id)}
                                className="cart-drawer__qty-btn"
                                disabled={loading}
                              >−</button>
                              <span className="cart-drawer__qty-value">{line.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity?.(line.id, line.quantity + 1)}
                                className="cart-drawer__qty-btn"
                                disabled={loading || (line.variant.quantityAvailable !== undefined && line.quantity >= line.variant.quantityAvailable)}
                              >+</button>
                            </div>

                            <div className="cart-drawer__action-btns flex items-center gap-3">
                              {showSaveForLater && (
                                isSelected ? (
                                  <button onClick={() => handleSelectItem(line.id)} className="text-xs font-medium text-gray-600 hover:text-gray-800">
                                    {cartText?.saveForLaterButton ?? 'Save for later'}
                                  </button>
                                ) : (
                                  <button onClick={() => handleSelectItem(line.id)} className="text-xs font-medium" style={{ color: branding.colors.primary }}>
                                    {cartText?.moveToCartButton ?? 'Move to cart'}
                                  </button>
                                )
                              )}
                              <button
                                onClick={() => onDeleteLine?.(line.id)}
                                className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                                disabled={loading}
                                aria-label={cartText?.deleteButton ?? 'Delete'}
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                {showDeleteText && <span className="cart-drawer__delete-text">{cartText?.deleteButton ?? 'Delete'}</span>}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && (
          <div className="cart-drawer__footer">
            {/* Free shipping progress (same as cart page) */}
            {freeShippingThreshold != null && !hasReachedFreeShipping && amountToFreeShipping != null && effectiveTotalForShipping > 0 && (
              <div className="mb-2 rounded-lg bg-emerald-50/80 px-2.5 py-1.5">
                <p className="text-xs font-medium text-emerald-800">
                  {(cartText as { addXMoreForFreeShipping?: string })?.addXMoreForFreeShipping?.replace('{amount}', formatMoney(amountToFreeShipping, currency)) ?? `Add ${formatMoney(amountToFreeShipping, currency)} more for free shipping`}
                </p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-emerald-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, (effectiveTotalForShipping / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            {freeShippingThreshold != null && hasReachedFreeShipping && effectiveTotalForShipping > 0 && (
              <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2.5 py-1.5">
                <svg className="h-3.5 w-3.5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-xs font-medium text-emerald-800">
                  {(cartText as { unlockedFreeShipping?: string })?.unlockedFreeShipping ?? "You've unlocked free shipping!"}
                </p>
              </div>
            )}
            {/* Promo / Voucher */}
            <div className="cart-drawer__promo-section">
              {voucherCode ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 px-2.5 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-emerald-800 truncate">
                      {(cartText as { voucherLabel?: string })?.voucherLabel ?? 'Voucher'}: {voucherCode}
                    </p>
                    {discount && (
                      <p className="text-xs text-emerald-600 mt-0.5">
                        −{formatMoney(discount.amount, discount.currency)}
                        {discountName ? ` (${discountName})` : ''}
                      </p>
                    )}
                  </div>
                  {onRemovePromoCode && checkoutData?.id && (
                    <button
                      type="button"
                      onClick={async () => {
                        setPromoPending(true);
                        setPromoError(null);
                        const result = await onRemovePromoCode(checkoutData.id, { promoCodeId: voucherId ?? undefined, promoCode: voucherCode ?? undefined });
                        setPromoPending(false);
                        if (!result.success) setPromoError(result.error ?? 'Failed to remove');
                        else if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart-updated'));
                      }}
                      disabled={promoPending}
                      className="shrink-0 rounded p-1 text-neutral-500 hover:bg-emerald-100 hover:text-neutral-700 disabled:opacity-50"
                      aria-label="Remove voucher"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ) : onApplyPromoCode && checkoutData?.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value); setPromoError(null); }}
                    placeholder={cartText?.promoCodePlaceholder ?? 'Enter code'}
                    className="cart-drawer__promo-input flex-1 min-w-0 rounded border border-neutral-300 px-2.5 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={!promoInput.trim() || promoPending}
                    onClick={async () => {
                      if (!promoInput.trim()) return;
                      setPromoPending(true);
                      setPromoError(null);
                      const result = await onApplyPromoCode(checkoutData.id, promoInput.trim());
                      setPromoPending(false);
                      if (result.success) {
                        setPromoInput('');
                        if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart-updated'));
                      } else {
                        setPromoError(result.error ?? 'Invalid code');
                      }
                    }}
                    className="cart-drawer__promo-apply rounded border border-neutral-300 px-2.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {promoPending ? '…' : (cartText?.promoCodeApplyButton ?? 'Apply')}
                  </button>
                </div>
              ) : null}
              {promoError && <p className="mt-1 text-xs text-red-600">{promoError}</p>}
            </div>

            {/* Order summary: single section; "You save" includes product + voucher discounts */}
            {(() => {
              const voucherAmount = discount?.amount ?? 0;
              const combinedSavings = totalSavings + voucherAmount;
              return (
            <div className="cart-drawer__summary-section pt-3 pb-1">
              <h3 className="cart-drawer__summary-title text-sm mb-2">
                {(cartText as { orderSummaryTitle?: string })?.orderSummaryTitle ?? 'Order summary'}
                {!allSelected && selectedItemCount > 0 && (
                  <span className="cart-drawer__summary-count"> ({selectedItemCount})</span>
                )}
              </h3>
              {combinedSavings > 0 && (
                <>
                  <div className="cart-drawer__subtotal-row cart-drawer__subtotal-row--original">
                    <span className="cart-drawer__subtotal-row-label">{cartText?.originalSubtotalLabel ?? 'Subtotal'}</span>
                    <span className="cart-drawer__subtotal-row-amount cart-drawer__subtotal-row-amount--strikethrough">
                      {formatMoney(subtotalBeforeDiscount, currency)}
                    </span>
                  </div>
                  <div className="cart-drawer__savings">
                    <span className="cart-drawer__savings-label">
                      <svg className="cart-drawer__savings-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5z" clipRule="evenodd" />
                      </svg>
                      {cartText?.youSaveLabel ?? 'You save'}
                    </span>
                    <span className="cart-drawer__savings-amount">−{formatMoney(combinedSavings, currency)}</span>
                  </div>
                </>
              )}
              <div className="cart-drawer__subtotal">
                <span className="cart-drawer__subtotal-label">{cartText?.discountedSubtotalLabel ?? 'Your price'} {!allSelected && selectedItemCount > 0 && `(${selectedItemCount})`}</span>
                <span className="cart-drawer__subtotal-amount cart-drawer__subtotal-amount--discounted">
                  {formatMoney(
                    selectedItemCount > 0
                      ? Math.max(0, subtotalBeforeDiscount - totalSavings - (discount?.amount ?? 0))
                      : selectedSubtotal,
                    currency
                  )}
                </span>
              </div>
              <p className="cart-drawer__shipping-note">{cartText?.shippingNote ?? 'Shipping and taxes calculated at checkout'}</p>
            </div>
              );
            })()}
            
            {/* Single checkout button for all selection states (rounded, consistent) */}
            <div className="cart-drawer__buttons flex flex-col gap-3">
              <button
                type="button"
                disabled={noneSelected || isCreatingCheckout || loading}
                className={`cart-drawer__checkout-btn flex items-center justify-center gap-2 rounded-full ${noneSelected ? 'opacity-50 pointer-events-none' : ''}`}
                style={{ backgroundColor: branding.colors.primary, color: '#FFFFFF', borderRadius: '9999px' }}
                onClick={async () => {
                  if (noneSelected || !checkoutData?.lines) return;
                  if (allSelected && checkoutData?.id) {
                    closeDrawer();
                    window.location.href = `/${channel}/checkout?checkout=${checkoutData.id}`;
                    return;
                  }
                  if (selectedItemCount > 0 && onCreateCheckoutWithSelection) {
                    const selected = lines.filter(line => selectedItems.has(line.id));
                    const items = selected.map(line => ({ variantId: line.variant.id, quantity: line.quantity }));
                    setIsCreatingCheckout(true);
                    try {
                      const result = await onCreateCheckoutWithSelection(items);
                      if (result?.checkoutId && typeof window !== 'undefined') {
                        try {
                          const raw = sessionStorage.getItem('checkout-no-gift-ids');
                          const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
                          if (Array.isArray(ids) && !ids.includes(result.checkoutId)) {
                            sessionStorage.setItem('checkout-no-gift-ids', JSON.stringify([...ids, result.checkoutId]));
                          }
                        } catch {
                          /* ignore */
                        }
                        closeDrawer();
                        window.location.href = `/${channel}/checkout?checkout=${result.checkoutId}`;
                      }
                    } finally {
                      setIsCreatingCheckout(false);
                    }
                  }
                }}
              >
                {isCreatingCheckout ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                {isCreatingCheckout
                  ? (cartText?.loadingCheckoutTitle ?? 'Loading...')
                  : noneSelected
                    ? (cartText?.selectItemsButton ?? 'Select items')
                    : (cartText?.checkoutButton ?? 'Proceed to Checkout')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Styles */}
      <style jsx>{`
        .cart-drawer-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0);
          transition: background-color 0.3s ease;
          pointer-events: none;
          z-index: 9998;
        }
        .cart-drawer-overlay--open {
          background-color: rgba(0, 0, 0, 0.5);
          pointer-events: auto;
        }
        .cart-drawer {
          position: fixed;
          top: 0;
          bottom: 0;
          width: 100%;
          max-width: 420px;
          background: white;
          box-shadow: ${isLeft ? '4px 0 20px rgba(0, 0, 0, 0.1)' : '-4px 0 20px rgba(0, 0, 0, 0.1)'};
          transform: ${isOpen ? 'translateX(0)' : (isLeft ? 'translateX(-100%)' : 'translateX(100%)')};
          transition: transform 0.3s ease;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          outline: none;
          ${isLeft ? 'left: 0;' : 'right: 0;'}
        }
        .cart-drawer__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #eee;
        }
        .cart-drawer__title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
        .cart-drawer__count {
          font-weight: 400;
          color: #666;
          margin-inline-start: 8px;
        }
        .cart-drawer__close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          color: #333;
        }
        .cart-drawer__select-bar {
          padding: 12px 20px;
          border-bottom: 1px solid #f3f4f6;
          background: #fafafa;
        }
        .cart-drawer__select-all {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        .cart-drawer__checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .cart-drawer__checkbox--checked {
          border-color: transparent;
        }
        .cart-drawer__content {
          flex: 1;
          overflow-y: auto;
        }
        .cart-drawer__empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 40px 24px;
          text-align: center;
        }
        .cart-drawer__empty-icon { color: #ccc; margin-bottom: 16px; }
        .cart-drawer__empty-text { color: #666; margin-bottom: 24px; }
        .cart-drawer__continue-btn {
          color: white;
          border: none;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 9999px;
        }
        .cart-drawer__items { padding: 0 20px; }
        .cart-drawer__item {
          display: flex;
          gap: 12px;
          padding: 16px 0;
          border-bottom: 1px solid #f3f4f6;
          transition: opacity 0.15s;
        }
        .cart-drawer__item:last-child { border-bottom: none; }
        .cart-drawer__item-checkbox {
          flex-shrink: 0;
          padding: 4px;
          background: none;
          border: none;
          cursor: pointer;
        }
        .cart-drawer__item-image {
          flex-shrink: 0;
          width: 72px;
          height: 72px;
          background: #f5f5f5;
          border-radius: 8px;
          overflow: hidden;
        }
        :global(.cart-drawer__item-img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cart-drawer__item-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ccc;
        }
        .cart-drawer__item-info {
          flex: 1;
          min-width: 0;
        }
        .cart-drawer__item-row {
          gap: 12px;
        }
        .cart-drawer__actions-row {
          gap: 12px;
        }
        .cart-drawer__item-name {
          display: block;
          font-weight: 500;
          font-size: 14px;
          color: #333;
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cart-drawer__item-name:hover { color: #000; }
        .cart-drawer__item-qty {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cart-drawer__qty-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e7eb;
          background: white;
          cursor: pointer;
          font-size: 16px;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .cart-drawer__qty-btn:hover:not(:disabled) { background: #f3f4f6; }
        .cart-drawer__qty-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cart-drawer__qty-value {
          min-width: 24px;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
        }
        .cart-drawer__footer {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background: #fafafa;
        }
        .cart-drawer__subtotal {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          margin-bottom: 8px;
        }
        .cart-drawer__subtotal-amount { font-weight: 600; }
        .cart-drawer__subtotal-amount--discounted { 
          font-weight: 700; 
          color: #059669;
        }
        
        /* Subtotal row variant (for original price) */
        .cart-drawer__subtotal-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin-bottom: 4px;
          color: #6b7280;
        }
        .cart-drawer__subtotal-row-amount--strikethrough {
          text-decoration: line-through;
          opacity: 0.7;
        }
        .cart-drawer__subtotal-row--rtl {
          flex-direction: row-reverse;
        }
        
        .cart-drawer__shipping-note {
          font-size: 11px;
          color: #6b7280;
          margin: 0 0 10px;
        }
        
        /* Order summary section (condensed for more product space) */
        .cart-drawer__summary-section {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        .cart-drawer__summary-title {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px;
        }
        .cart-drawer__summary-count {
          font-weight: 400;
          color: #6b7280;
        }
        .cart-drawer__voucher-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #047857;
          margin-bottom: 8px;
        }
        .cart-drawer__voucher-label {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cart-drawer__voucher-amount {
          font-weight: 600;
          margin-left: 8px;
          flex-shrink: 0;
        }
        
        /* Savings row - promotion/discount display */
        .cart-drawer__savings {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          margin-bottom: 8px;
          padding: 8px 12px;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border-radius: 8px;
          border: 1px solid #a7f3d0;
        }
        .cart-drawer__savings-label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #059669;
          font-weight: 500;
        }
        .cart-drawer__savings-icon {
          width: 16px;
          height: 16px;
        }
        .cart-drawer__savings-amount {
          font-weight: 700;
          color: #047857;
        }
        .cart-drawer__savings--rtl {
          flex-direction: row-reverse;
        }
        .cart-drawer__savings--rtl .cart-drawer__savings-label {
          flex-direction: row-reverse;
        }
        
        /* Promo code section styling (condensed) */
        .cart-drawer__promo-section {
          margin-bottom: 8px;
        }
        .cart-drawer--content-rtl .cart-drawer__promo-section {
          direction: rtl;
        }
        
        .cart-drawer__checkout-btn {
          width: 100%;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
          border-radius: 9999px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .cart-drawer__checkout-btn:hover { opacity: 0.95; }
        .cart-drawer__view-cart-btn {
          width: 100%;
          padding: 12px;
          font-size: 14px;
          font-weight: 500;
          border: 1px solid #d1d5db;
          border-radius: 9999px;
          background: white;
          color: #374151;
          text-decoration: none;
          transition: all 0.2s;
        }
        .cart-drawer__view-cart-btn:hover { background: #f9fafb; }
        @media (max-width: 480px) {
          .cart-drawer { max-width: 90%; width: 90%; }
        }
        
        /* ===== RTL content layout (html dir="rtl" / Hebrew, Arabic) ===== */
        /* Uses global html[dir="rtl"] selector for single source of truth */
        
        /* Header RTL: title at start (right), close at end (left) */
        :global(html[dir="rtl"]) .cart-drawer__header {
          flex-direction: row;
        }
        
        /* Select bar: align content to logical start (right in RTL) so checkbox/text block is on the right */
        :global(html[dir="rtl"]) .cart-drawer__select-bar {
          display: flex;
          justify-content: flex-start;
        }
        :global(html[dir="rtl"]) .cart-drawer__select-all {
          flex-direction: row-reverse;
        }
        
        /* Cart items RTL: keep row order so checkbox stays at start (right): checkbox → image → info */
        :global(html[dir="rtl"]) .cart-drawer__item {
          flex-direction: row;
        }
        
        /* Item row RTL: name (start/right) then price (end/left) – no reverse */
        :global(html[dir="rtl"]) .cart-drawer__item-row {
          flex-direction: row;
          gap: 12px;
        }
        
        /* RTL text: info start-aligned, price end-aligned */
        :global(html[dir="rtl"]) .cart-drawer__info-col {
          text-align: start;
        }
        :global(html[dir="rtl"]) .cart-drawer__info-col p,
        :global(html[dir="rtl"]) .cart-drawer__info-col span {
          text-align: start;
        }
        :global(html[dir="rtl"]) .cart-drawer__price-col {
          text-align: end;
        }
        :global(html[dir="rtl"]) .cart-drawer__price-col p {
          text-align: end;
        }
        
        /* Actions row RTL: delete (end/left) then qty (start/right) – no reverse */
        :global(html[dir="rtl"]) .cart-drawer__actions-row {
          flex-direction: row;
          gap: 12px;
        }
        :global(html[dir="rtl"]) .cart-drawer__action-btns {
          flex-direction: row;
        }
        
        /* Quantity: minus on end, plus on start (RTL) */
        :global(html[dir="rtl"]) .cart-drawer__item-qty {
          flex-direction: row-reverse;
        }
        
        /* Footer subtotal RTL */
        :global(html[dir="rtl"]) .cart-drawer__subtotal {
          flex-direction: row;
          justify-content: space-between;
        }
        /* Removed order: -1 to keep Label (Right) -> Amount (Left) natural RTL flow */
        
        /* Removed row-reverse to keep Label (Right) -> Amount (Left) natural RTL flow */
        :global(html[dir="rtl"]) .cart-drawer__subtotal-row {
          flex-direction: row; 
        }
        :global(html[dir="rtl"]) .cart-drawer__savings {
          flex-direction: row;
        }
        /* Keep savings label direction if icon is involved */
        :global(html[dir="rtl"]) .cart-drawer__savings-label {
          flex-direction: row;
        }
        :global(html[dir="rtl"]) .cart-drawer__shipping-note {
          text-align: start;
        }
        
        /* Checkout button: icon on logical end in RTL */
        :global(html[dir="rtl"]) .cart-drawer__checkout-btn {
          flex-direction: row;
        }
        
        /* Empty cart state */
        :global(html[dir="rtl"]) .cart-drawer__empty {
          text-align: start;
        }
        
        /* Payment methods styling */
        .cart-drawer__payment-methods {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }
        .cart-drawer__payment-icons {
          display: flex;
          gap: 8px;
          justify-content: center;
        }
        .cart-drawer__payment-icon {
          width: 36px;
          height: 24px;
          border-radius: 4px;
        }
        .cart-drawer__powered-by {
          font-size: 11px;
          color: #9ca3af;
        }
        
        /* RTL: payment icons centered */
        :global(html[dir="rtl"]) .cart-drawer__payment-methods {
          align-items: center;
        }
        :global(html[dir="rtl"]) .cart-drawer__payment-icons {
          justify-content: center;
          flex-direction: row; 
        }
        :global(html[dir="rtl"]) .cart-drawer__powered-by {
          text-align: center;
        }
      `}</style>
    </>
  );
}

export default CartDrawer;
