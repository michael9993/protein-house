"use client";

import Image from "next/image";
import { useState } from "react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { formatMoney, getHrefForVariant } from "@/lib/utils";
import { storeConfig } from "@/config";
import { useBranding, useContentConfig } from "@/providers/StoreConfigProvider";

interface CartLine {
  id: string;
  quantity: number;
  totalPrice: {
    gross: {
      amount: number;
      currency: string;
    };
  };
  variant: {
    id: string;
    name: string;
    product: {
      slug: string;
      name: string;
      thumbnail?: {
        url: string;
        alt?: string;
      } | null;
      category?: {
        name: string;
      } | null;
    };
    pricing?: {
      price?: {
        gross: {
          amount: number;
          currency: string;
        };
      } | null;
    } | null;
  };
}

interface CartPageProps {
  lines: CartLine[];
  totalPrice: {
    gross: {
      amount: number;
      currency: string;
    };
  };
  checkoutId: string;
  channel: string;
  onDeleteLine: (lineId: string) => Promise<void>;
  onUpdateQuantity: (lineId: string, quantity: number) => Promise<void>;
}

export function CartPage({ 
  lines, 
  totalPrice, 
  checkoutId,
  channel,
  onDeleteLine,
  onUpdateQuantity 
}: CartPageProps) {
  const { branding: staticBranding, ecommerce } = storeConfig;
  const branding = useBranding();
  const content = useContentConfig();
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [updatingLines, setUpdatingLines] = useState<Set<string>>(new Set());

  const freeShippingThreshold = ecommerce.shipping.freeShippingThreshold;
  const amountToFreeShipping = freeShippingThreshold 
    ? Math.max(0, freeShippingThreshold - totalPrice.gross.amount)
    : null;
  const hasReachedFreeShipping = amountToFreeShipping === 0;

  const handleQuantityChange = async (lineId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdatingLines(prev => new Set(prev).add(lineId));
    try {
      await onUpdateQuantity(lineId, newQuantity);
    } finally {
      setUpdatingLines(prev => {
        const next = new Set(prev);
        next.delete(lineId);
        return next;
      });
    }
  };

  const handleDeleteLine = async (lineId: string) => {
    setUpdatingLines(prev => new Set(prev).add(lineId));
    try {
      await onDeleteLine(lineId);
    } finally {
      setUpdatingLines(prev => {
        const next = new Set(prev);
        next.delete(lineId);
        return next;
      });
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsApplyingPromo(true);
    // TODO: Implement promo code application
    setTimeout(() => setIsApplyingPromo(false), 1000);
  };

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Empty Cart Icon */}
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
              className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Free Shipping Progress */}
      {freeShippingThreshold && !hasReachedFreeShipping && (
        <div className="mb-8 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-800">
                Add {formatMoney(amountToFreeShipping!, totalPrice.gross.currency)} more for FREE shipping!
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-200">
                <div 
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, (totalPrice.gross.amount / freeShippingThreshold) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {hasReachedFreeShipping && (
        <div className="mb-8 rounded-xl bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-emerald-800">
              🎉 Congratulations! You've unlocked FREE shipping!
            </p>
          </div>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
        {/* Cart Items */}
        <div className="lg:col-span-7">
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            Shopping Cart ({lines.length} {lines.length === 1 ? "item" : "items"})
          </h1>

          <ul className="mt-8 divide-y divide-neutral-200">
            {lines.map((item) => (
              <li 
                key={item.id} 
                className={`flex gap-4 py-6 ${updatingLines.has(item.id) ? "opacity-50" : ""}`}
              >
                {/* Product Image */}
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:h-32 sm:w-32">
                  {item.variant.product.thumbnail?.url ? (
                    <Image
                      src={item.variant.product.thumbnail.url}
                      alt={item.variant.product.thumbnail.alt || item.variant.product.name}
                      fill
                      className="object-cover"
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
                  <div className="flex justify-between">
                    <div>
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
                        <p className="mt-1 text-sm text-neutral-500">
                          {item.variant.product.category.name}
                        </p>
                      )}
                      {item.variant.name !== item.variant.id && (
                        <p className="mt-1 text-sm text-neutral-500">
                          {item.variant.name}
                        </p>
                      )}
                    </div>
                    <p className="text-right font-semibold text-neutral-900">
                      {formatMoney(item.totalPrice.gross.amount, item.totalPrice.gross.currency)}
                    </p>
                  </div>

                  {/* Quantity & Remove */}
                  <div className="mt-auto flex items-center justify-between pt-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center rounded-lg border border-neutral-200">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updatingLines.has(item.id)}
                        className="flex h-9 w-9 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-12 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={updatingLines.has(item.id)}
                        className="flex h-9 w-9 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteLine(item.id)}
                      disabled={updatingLines.has(item.id)}
                      className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Continue Shopping */}
          <div className="mt-6">
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

        {/* Order Summary */}
        <div className="mt-10 lg:col-span-5 lg:mt-0">
          <div className="sticky top-24 rounded-2xl bg-neutral-50 p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Order Summary</h2>

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
                  className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": branding.colors.primary } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={isApplyingPromo || !promoCode.trim()}
                  className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isApplyingPromo ? "..." : content.cart.promoCodeApplyButton}
                </button>
              </div>
            </div>

            {/* Summary Lines */}
            <dl className="mt-6 space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm text-neutral-600">Subtotal</dt>
                <dd className="text-sm font-medium text-neutral-900">
                  {formatMoney(totalPrice.gross.amount, totalPrice.gross.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-neutral-600">Shipping</dt>
                <dd className="text-sm font-medium text-neutral-900">
                  {hasReachedFreeShipping ? (
                    <span className="text-emerald-600">FREE</span>
                  ) : (
                    "Calculated at checkout"
                  )}
                </dd>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-4">
                <dt className="text-base font-semibold text-neutral-900">Total</dt>
                <dd className="text-base font-semibold text-neutral-900">
                  {formatMoney(totalPrice.gross.amount, totalPrice.gross.currency)}
                </dd>
              </div>
            </dl>

            {/* Checkout Button */}
            <a
              href={`/${channel}/checkout?checkout=${checkoutId}`}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: branding.colors.primary }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Proceed to Checkout
            </a>

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                SSL Encrypted
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

