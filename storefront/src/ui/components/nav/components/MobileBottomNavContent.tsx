"use client";

import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useBranding } from "@/providers/StoreConfigProvider";
import { MobileCartButtonClient } from "./MobileCartButtonClient";
import { MobileAccountButtonClient } from "./MobileAccountButtonClient";

export function MobileBottomNavContent({ 
  channel, 
  pathname: _pathname, 
  isHome, 
  isProducts, 
  isCart, 
  isAccount 
}: { 
  channel: string; 
  pathname: string;
  isHome: boolean;
  isProducts: boolean;
  isCart: boolean;
  isAccount: boolean;
}) {
  const branding = useBranding();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        backgroundColor: "var(--store-mobile-nav-bg)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--store-neutral-200)",
        boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="flex h-16 items-center justify-around px-2">
        {/* Home */}
        <LinkWithChannel
          href="/"
          className="flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-all duration-200"
          style={{
            backgroundColor: isHome ? branding.colors.primary : "transparent",
            color: isHome ? "#ffffff" : "var(--store-text-muted)",
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
              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" 
            />
          </svg>
          <span className="text-[10px] font-medium">Home</span>
        </LinkWithChannel>

        {/* Shop All */}
        <LinkWithChannel
          href="/products"
          className="flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-all duration-200"
          style={{
            backgroundColor: isProducts ? branding.colors.primary : "transparent",
            color: isProducts ? "#ffffff" : "var(--store-text-muted)",
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
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" 
            />
          </svg>
          <span className="text-[10px] font-medium">Shop</span>
        </LinkWithChannel>

        {/* Cart */}
        <MobileCartButtonClient isActive={isCart} channel={channel} />

        {/* Account / Sign In */}
        <MobileAccountButtonClient isActive={isAccount} />
      </div>
    </nav>
  );
}

