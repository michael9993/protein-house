"use client";

import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useBranding, useContentConfig } from "@/providers/StoreConfigProvider";

export function MobileAccountButtonClient({ isActive }: { isActive: boolean }) {
  const branding = useBranding();
  const content = useContentConfig();
  const navbarText = content.navbar;

  // For now, just show sign in link - we can enhance this later to check auth status
  // The account page will handle redirecting if not logged in
  return (
    <LinkWithChannel
      href="/account"
      className={isActive ? "group flex flex-col items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95" : "group flex flex-col items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-neutral-100/50"}
      style={{
        backgroundColor: isActive ? branding.colors.primary : "transparent",
        color: isActive ? "#ffffff" : "var(--store-text-muted)",
      }}
    >
      <div className="relative">
        {isActive ? (
          // Filled user icon for active state
          <svg 
            className="h-6 w-6 transition-transform group-hover:scale-110" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
          </svg>
        ) : (
          // Outline user icon for inactive state
          <svg 
            className="h-6 w-6 transition-transform group-hover:scale-110" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" 
            />
          </svg>
        )}
      </div>
      <span className={`text-[11px] font-semibold leading-tight transition-colors ${isActive ? "text-white" : ""}`}>{navbarText.accountLabel}</span>
    </LinkWithChannel>
  );
}

