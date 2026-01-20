"use client";

import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useBranding, useContentConfig } from "@/providers/StoreConfigProvider";
import clsx from "clsx";
import { useEffect, useState } from "react";

export function MobileCartButtonContent({ isActive, channel }: { isActive: boolean; channel: string }) {
  const branding = useBranding();
  const content = useContentConfig();
  const navbarText = content.navbar;
  const [lineCount, setLineCount] = useState(0);

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
          const data = await response.json();
          setLineCount(data.count || 0);
        }
      } catch (error) {
        // Silently fail - cart count is not critical
        if (process.env.NODE_ENV === "development") {
          console.debug('[MobileCartButtonContent] Could not fetch cart count:', error);
        }
      }
    };

    // Initial fetch
    getCartCount();
    
    // Poll every 10 seconds (reduced from 2 seconds)
    intervalId = setInterval(getCartCount, 10000);
    
    // Listen for cart updates via custom events (immediate update)
    const handleCartUpdate = () => {
      if (isMounted) {
        getCartCount();
      }
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

  return (
    <LinkWithChannel
      href="/cart"
      className="relative flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-all duration-200"
      style={{
        backgroundColor: isActive ? branding.colors.primary : "transparent",
        color: isActive ? "#ffffff" : "var(--store-text-muted)",
      }}
    >
      <svg 
        className="h-6 w-6" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" 
        />
      </svg>
      {/* Cart Badge */}
      {lineCount > 0 && (
        <div
          className={clsx(
            "absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm",
            lineCount > 9 && "h-5 w-6",
          )}
          style={{ backgroundColor: branding.colors.primary }}
        >
          {lineCount > 99 ? "99+" : lineCount}
        </div>
      )}
      <span className="text-[10px] font-medium">{navbarText.cartLabel}</span>
    </LinkWithChannel>
  );
}

