"use client";

import { Suspense, useEffect, useState } from "react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useBranding, useContentConfig } from "@/providers/StoreConfigProvider";
import { CurrentUserDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import clsx from "clsx";
import type { UserDetailsFragment } from "@/gql/graphql";

function AccountButtonContent({ isActive }: { isActive: boolean }) {
  const branding = useBranding();
  const content = useContentConfig();
  const navbarText = content.navbar;
  const [user, setUser] = useState<UserDetailsFragment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { me } = await executeGraphQL(CurrentUserDocument, {
          cache: "no-cache",
        });
        setUser(me || null);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);
  const { me: user } = await executeGraphQL(CurrentUserDocument, {
    cache: "no-cache",
  });

  if (user) {
    // User is logged in - show account icon
    return (
      <div className={clsx(
        "flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-all duration-200",
        isActive ? "text-white" : "text-neutral-600"
      )}>
        <div className="relative">
          <LinkWithChannel
            href="/account"
            className="flex items-center justify-center"
            style={{
              backgroundColor: isActive ? branding.colors.primary : "transparent",
              borderRadius: "8px",
              padding: "8px",
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
          </LinkWithChannel>
        </div>
        <span className="text-[10px] font-medium">{navbarText.accountLabel}</span>
      </div>
    );
  }

  // User is not logged in - show sign in
  return (
    <LinkWithChannel
      href="/login"
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
          d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" 
        />
      </svg>
      <span className="text-[10px] font-medium">Sign In</span>
    </LinkWithChannel>
  );
}

export function MobileAccountButton({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <AccountButtonContent isActive={isActive} />
    </div>
  );
}

