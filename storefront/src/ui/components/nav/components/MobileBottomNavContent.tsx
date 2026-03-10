"use client";

import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useBranding, useContentConfig, useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";
import { MobileCartButtonClient } from "./MobileCartButtonClient";
import { MobileAccountButtonClient } from "./MobileAccountButtonClient";

import { useState, useEffect } from "react";

export function MobileBottomNavContent({ 
  channel, 
  pathname: _pathname, 
  isHome, 
  isProducts, 
  isCart, 
  isAccount,
  isLoggedIn = false,
}: { 
  channel: string; 
  pathname: string;
  isHome: boolean;
  isProducts: boolean;
  isCart: boolean;
  isAccount: boolean;
  isLoggedIn?: boolean;
}) {
  const branding = useBranding();
  const content = useContentConfig();
  const cdStyle = useComponentStyle("layout.mobileBottomNav");
  const cdClasses = useComponentClasses("layout.mobileBottomNav");
  const navbarText = content.navbar;

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // On product detail pages, keep the nav always visible (sticky add-to-cart bar sits above it)
  const pathParts = _pathname.split("/").filter(Boolean);
  const isProductDetail =
    pathParts.length >= 3 && pathParts[1] === "products" && pathParts.length === 3;

  // Force-show nav on PDP (sticky add-to-cart sits above it)
  useEffect(() => {
    if (isProductDetail) {
      setIsVisible(true);
    }
  }, [isProductDetail]);

  useEffect(() => {
    if (isProductDetail) return; // No scroll-hide on PDP

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Determine if at bottom (within 50px)
      const isAtBottom = windowHeight + currentScrollY >= documentHeight - 50;

      if (isAtBottom) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling DOWN and not at top -> Hide
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling UP -> Show
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isProductDetail]);

  return (
    <nav
      data-cd="layout-mobileBottomNav"
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      } ${cdClasses}`}
      style={{
        background: "var(--store-mobile-nav-bg)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--store-neutral-200)",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.08)",
        ...buildComponentStyle("layout.mobileBottomNav", cdStyle),
      }}
    >
      <div className="flex h-20 items-center justify-around px-2 py-2">
        {/* Home */}
        <LinkWithChannel
          href="/"
          className={isHome ? "group flex flex-col items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95" : "group flex flex-col items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-neutral-100/50"}
          style={{
            backgroundColor: isHome ? branding.colors.primary : "transparent",
            color: isHome ? "#ffffff" : "var(--store-text-muted)",
          }}
        >
          <div className="relative">
            {isHome ? (
              // Filled home icon for active state
              <svg 
                className="h-6 w-6 transition-transform group-hover:scale-110" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
              </svg>
            ) : (
              // Outline home icon for inactive state
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
                  d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" 
                />
              </svg>
            )}
          </div>
          <span className={`text-[11px] font-semibold leading-tight transition-colors ${isHome ? "text-white" : ""}`}>{navbarText.homeLabel}</span>
        </LinkWithChannel>

        {/* Shop All */}
        <LinkWithChannel
          href="/products"
          className={isProducts ? "group flex flex-col items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95" : "group flex flex-col items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-neutral-100/50"}
          style={{
            backgroundColor: isProducts ? branding.colors.primary : "transparent",
            color: isProducts ? "#ffffff" : "var(--store-text-muted)",
          }}
        >
          <div className="relative">
            {isProducts ? (
              // Filled search icon for active state
              <svg 
                className="h-6 w-6 transition-transform group-hover:scale-110" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
              </svg>
            ) : (
              // Outline search icon for inactive state
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
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" 
                />
              </svg>
            )}
          </div>
          <span className={`text-[11px] font-semibold leading-tight transition-colors ${isProducts ? "text-white" : ""}`}>{navbarText.shopLabel}</span>
        </LinkWithChannel>

        {/* Cart */}
        <MobileCartButtonClient isActive={isCart} channel={channel} />

        {/* Account when logged in, Sign In when not */}
        <MobileAccountButtonClient isActive={isAccount} isLoggedIn={isLoggedIn} />
      </div>
    </nav>
  );
}
