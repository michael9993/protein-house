"use client";

import React, { useEffect, useState } from "react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useBranding, useContentConfig, useCartDisplayMode } from "@/providers/StoreConfigProvider";
import { useCartDrawerSafe } from "@/providers/CartDrawerProvider";
import clsx from "clsx";

export function MobileCartButtonClient({ isActive, channel }: { isActive: boolean; channel: string }) {
  const branding = useBranding();
  const content = useContentConfig();
  const displayMode = useCartDisplayMode();
  const drawerContext = useCartDrawerSafe();
  const navbarText = content.navbar;
  const [lineCount, setLineCount] = useState(0);

  const handleClick = (e: React.MouseEvent) => {
    // If in drawer mode and we have the drawer context, open the drawer
    if (displayMode === 'drawer' && drawerContext) {
      e.preventDefault();
      drawerContext.openDrawer();
    }
    // Otherwise, let the link navigate to /cart
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const getCartCount = async () => {
      // Don't poll if page is hidden
      if (document.hidden) {
        return;
      }

      try {
        const response = await fetch(`/api/cart-count?channel=${encodeURIComponent(channel)}`, {
          cache: 'no-store',
        });
        if (response.ok && isMounted) {
          const data = (await response.json()) as { count?: number };
          setLineCount(data.count ?? 0);
        }
      } catch (error) {
        // Silently fail - cart count is not critical
        if (process.env.NODE_ENV === "development") {
          console.debug('[MobileCartButton] Could not fetch cart count:', error);
        }
      }
    };

    // Initial fetch
    getCartCount();
    
    // Poll every 10 seconds (reduced from 2 seconds)
    intervalId = setInterval(getCartCount, 10000);
    
    // Listen for cart updates; support optimistic addQuantity for instant badge update
    const handleCartUpdate = (e?: Event) => {
      if (!isMounted) return;
      const detail = (e as CustomEvent<{ addQuantity?: number }> | undefined)?.detail;
      if (typeof detail?.addQuantity === "number") {
        setLineCount((prev) => prev + detail.addQuantity!);
      }
      getCartCount();
    };
    
    // Listen for visibility changes to resume polling when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && isMounted) {
        getCartCount();
      }
    };
    
    window.addEventListener('cart-updated', handleCartUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      window.removeEventListener('cart-updated', handleCartUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [channel]);

  const className = isActive ? "group relative flex flex-col items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95" : "group relative flex flex-col items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-neutral-100/50";
  const style = { backgroundColor: isActive ? branding.colors.primary : "transparent", color: isActive ? "#ffffff" : "var(--store-text-muted)" };

  const iconAndBadge = (
    <>
      <div className="relative">
        {isActive ? (
          <svg className="h-6 w-6 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 004.25 22.5h15.5a1.875 1.875 0 001.865-2.071l-1.263-12a1.875 1.875 0 00-1.865-1.679H16.5V6a4.5 4.5 0 10-9 0zM12 3a3 3 0 00-3 3v.75h6V6a3 3 0 00-3-3zm-3 8.25a3 3 0 106 0v-1.5a.75.75 0 011.5 0v1.5a4.5 4.5 0 11-9 0v-1.5a.75.75 0 011.5 0v1.5z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="h-6 w-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        )}
        {lineCount > 0 && (
          <div
            className={clsx(
              "absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full text-[10px] font-bold text-white shadow-lg transition-all z-10",
              lineCount > 9 && "min-w-[22px] px-1",
              lineCount > 99 && "min-w-[26px] text-[9px]",
            )}
            style={{ backgroundColor: isActive ? "#ffffff" : branding.colors.error, color: isActive ? branding.colors.primary : "#ffffff" }}
          >
            {lineCount > 99 ? "99+" : lineCount}
          </div>
        )}
      </div>
      <span className={`text-[11px] font-semibold leading-tight transition-colors ${isActive ? "text-white" : ""}`}>{navbarText.cartLabel}</span>
    </>
  );

  if (displayMode === "drawer") {
    return (
      <button type="button" className={className} style={style} onClick={handleClick} aria-label={navbarText.cartLabel}>
        {iconAndBadge}
      </button>
    );
  }

  return (
    <LinkWithChannel href="/cart" className={className} style={style} onClick={handleClick}>
      {iconAndBadge}
    </LinkWithChannel>
  );
}

