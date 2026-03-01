"use client";

import React, { useEffect, useState } from 'react';
import clsx from "clsx";
import { useCartDisplayMode, useBranding } from "@/providers/StoreConfigProvider";
import { useCartDrawerSafe } from "@/providers/CartDrawerProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

interface CartNavItemClientProps {
  channel: string;
  lineCount: number;
}

/**
 * Client component for cart nav button.
 * Opens drawer in drawer mode, links to cart page in page mode.
 */
export function CartNavItemClient({ channel, lineCount }: CartNavItemClientProps) {
  const displayMode = useCartDisplayMode();
  const drawerContext = useCartDrawerSafe();
  const branding = useBranding();
  const [bouncing, setBouncing] = useState(false);

  // Listen for fly-to-cart animation completion to trigger badge bounce
  useEffect(() => {
    const handleBounce = () => {
      setBouncing(true);
      const timer = setTimeout(() => setBouncing(false), 400);
      return () => clearTimeout(timer);
    };
    window.addEventListener("cart-badge-bounce", handleBounce);
    return () => window.removeEventListener("cart-badge-bounce", handleBounce);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (displayMode === 'drawer' && drawerContext) {
      e.preventDefault();
      drawerContext.openDrawer();
    }
  };

  const className = "nav-action-btn group relative flex items-center justify-center rounded-full p-2 transition-all duration-200 hover:bg-neutral-100";
  const content = (
    <>
      {/* Shopping Bag Icon */}
      <svg
        className="h-5 w-5 text-neutral-600 transition-colors group-hover:text-neutral-900"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>

      {/* Cart Count Badge */}
      {lineCount > 0 ? (
        <div
          className={clsx(
            "absolute -end-0.5 -top-0.5 flex items-center justify-center rounded-full text-[10px] font-bold text-white transition-all duration-200 group-hover:scale-110",
            lineCount > 9 ? "h-[18px] min-w-[18px] px-1" : "h-[18px] w-[18px]",
            bouncing && "animate-cart-badge-bounce",
          )}
          style={{ backgroundColor: branding.colors.primary }}
        >
          {lineCount > 99 ? "99+" : lineCount}
          <span className="sr-only">{lineCount} item{lineCount > 1 ? "s" : ""} in cart, view bag</span>
        </div>
      ) : (
        <span className="sr-only">0 items in cart</span>
      )}
    </>
  );

  if (displayMode === "drawer") {
    return (
      <button
        type="button"
        className={className}
        onClick={handleClick}
        data-testid="CartNavItem"
        aria-label={`${lineCount} item${lineCount !== 1 ? "s" : ""} in cart`}
      >
        {content}
      </button>
    );
  }

  return (
    <LinkWithChannel href="/cart" className={className} data-testid="CartNavItem" onClick={handleClick}>
      {content}
    </LinkWithChannel>
  );
}

export default CartNavItemClient;
