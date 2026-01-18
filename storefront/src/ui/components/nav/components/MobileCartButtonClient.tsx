"use client";

import { useEffect, useState } from "react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useBranding } from "@/providers/StoreConfigProvider";
import clsx from "clsx";

export function MobileCartButtonClient({ isActive, channel }: { isActive: boolean; channel: string }) {
  const branding = useBranding();
  const [lineCount, setLineCount] = useState(0);

  useEffect(() => {
    // Fetch cart count from cookies on client side
    const getCartCount = async () => {
      try {
        const cookies = document.cookie.split(';');
        const checkoutCookie = cookies.find(c => c.trim().startsWith(`checkout_${channel}=`));
        if (checkoutCookie) {
          const checkoutId = checkoutCookie.split('=')[1]?.trim();
          if (checkoutId) {
            // Use a server action or API route to fetch checkout
            // For now, we'll just read from cookie and show 0
            // The actual count will be updated when the page loads
            setLineCount(0);
          }
        }
      } catch (error) {
        setLineCount(0);
      }
    };

    getCartCount();
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
      <span className="text-[10px] font-medium">Cart</span>
    </LinkWithChannel>
  );
}

