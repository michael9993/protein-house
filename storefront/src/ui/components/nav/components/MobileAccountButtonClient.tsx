"use client";

import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { storeConfig } from "@/config";
import clsx from "clsx";

export function MobileAccountButtonClient({ isActive }: { isActive: boolean }) {
  const { branding } = storeConfig;

  // For now, just show sign in link - we can enhance this later to check auth status
  // The account page will handle redirecting if not logged in
  return (
    <LinkWithChannel
      href="/account"
      className={clsx(
        "flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-all duration-200",
        isActive ? "text-white" : "text-neutral-600"
      )}
      style={{
        backgroundColor: isActive ? branding.colors.primary : "transparent",
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
          d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" 
        />
      </svg>
      <span className="text-[10px] font-medium">Account</span>
    </LinkWithChannel>
  );
}

