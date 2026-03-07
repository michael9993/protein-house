"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ShareButton } from "@/ui/components/ProductSharing";
import { useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";

type ButtonState = "needsSelection" | "outOfStock" | "ready" | "adding" | "added";

interface StickyMobileAddToCartProps {
  isOriginalVisible: boolean;
  /** Ref forwarded to the button wrapper — used as FlyToCart source */
  buttonRef: React.RefObject<HTMLDivElement | null>;
  displayPrice: string;
  displayOriginalPrice: string | null;
  hasDiscount: boolean;
  primaryColor: string;
  buttonState: ButtonState;
  onAddToCart: () => void;
  wishlistEnabled: boolean;
  isWishlisted: boolean;
  onWishlistToggle: () => void;
  shareProps: { productName: string; productUrl: string; productImage: string | null };
  text: {
    selectOptions: string;
    outOfStock: string;
    addToCart: string;
    adding: string;
    addedToCart: string;
  };
  /** "page" = sits above bottom nav (bottom-20, z-50); "modal" = sits at viewport bottom (bottom-0, z-[10000]) */
  mode?: "page" | "modal";
}

export function StickyMobileAddToCart({
  isOriginalVisible,
  buttonRef,
  displayPrice,
  displayOriginalPrice,
  hasDiscount,
  primaryColor,
  buttonState,
  onAddToCart,
  wishlistEnabled,
  isWishlisted,
  onWishlistToggle,
  shareProps,
  text,
  mode = "page",
}: StickyMobileAddToCartProps) {
  const cdStyle = useComponentStyle("pdp.stickyAddToCart");
  const cdClasses = useComponentClasses("pdp.stickyAddToCart");
  const variantSectionRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleClick = useCallback(() => {
    if (buttonState === "needsSelection") {
      // Scroll to variant selector section so user can pick options
      const section =
        variantSectionRef.current ??
        document.querySelector("[data-variant-selector]");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    onAddToCart();
  }, [buttonState, onAddToCart]);

  const isDisabled =
    buttonState === "needsSelection" ||
    buttonState === "outOfStock" ||
    buttonState === "adding";

  const bgColor = buttonState === "added" ? "var(--store-success-600, #059669)" : primaryColor;

  const buttonLabel =
    buttonState === "adding"
      ? text.adding
      : buttonState === "added"
        ? text.addedToCart
        : buttonState === "outOfStock"
          ? text.outOfStock
          : buttonState === "needsSelection"
            ? text.selectOptions
            : text.addToCart;

  // Portal to document.body to escape ancestor transform containing block
  // (a parent div with transition-all has transform: matrix(...) which breaks position: fixed)
  if (!mounted) return null;

  // In modal mode: sit at viewport bottom above the modal (z-[10000] > modal z-[9999])
  // In page mode: sit above the mobile bottom nav (bottom-20, z-50)
  const isModal = mode === "modal";
  const positionClass = isModal ? "bottom-0 z-[10000]" : "bottom-20 z-50";
  const hideTranslate = isModal ? "translate-y-full" : "translate-y-[calc(100%+5rem)]";

  return createPortal(
    <div
      data-cd="pdp-stickyAddToCart"
      className={`fixed inset-x-0 ${positionClass} md:hidden transition-[translate] duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
        isOriginalVisible ? hideTranslate : "translate-y-0"
      } ${cdClasses}`}
      style={{ ...(isModal ? { paddingBottom: "env(safe-area-inset-bottom, 0px)" } : {}), ...buildComponentStyle("pdp.stickyAddToCart", cdStyle) }}
    >
      <div
        className="border-t border-neutral-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      >
        <div className="flex h-16 items-center gap-2 px-3">
          {/* Price */}
          <div className="flex shrink-0 flex-col items-start leading-tight">
            <span
              className="text-base font-bold"
              style={{ color: hasDiscount ? "var(--store-error, #ef4444)" : undefined }}
            >
              {displayPrice}
            </span>
            {displayOriginalPrice && (
              <span className="text-xs text-neutral-400 line-through">
                {displayOriginalPrice}
              </span>
            )}
          </div>

          {/* Add to Cart button */}
          <div ref={buttonRef} className="min-w-0 flex-1">
            <button
              type="button"
              onClick={handleClick}
              disabled={isDisabled && buttonState !== "needsSelection"}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-white whitespace-nowrap transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: bgColor }}
            >
              {buttonState === "adding" && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {buttonState === "added" && (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {buttonLabel}
            </button>
          </div>

          {/* Wishlist */}
          {wishlistEnabled && (
            <button
              type="button"
              onClick={onWishlistToggle}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                isWishlisted
                  ? "border-red-200 bg-red-50 text-red-500"
                  : "border-neutral-200 text-neutral-500"
              }`}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg
                className="h-5 w-5"
                fill={isWishlisted ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          )}

          {/* Share */}
          <ShareButton
            variant="icon"
            productName={shareProps.productName}
            productUrl={shareProps.productUrl}
            productImage={shareProps.productImage}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors"
            iconClassName="h-5 w-5"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
