"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const HIDE_CLASS = "scroll-hide--hidden";
const HEADER_SELECTOR = '[data-scroll-hide="header"]';
const MOBILE_NAV_SELECTOR = '[data-scroll-hide="mobile-nav"]';

/** Scroll down (px) accumulated before hiding the nav. */
const THRESHOLD_HIDE_PX = 100;
/** Scroll up (px) accumulated before showing the nav. */
const THRESHOLD_SHOW_PX = 40;
/** Near top of page: always show header. */
const TOP_ZONE_PX = 60;

/**
 * Smooth, jitter-free scroll-hide/show for header and mobile nav.
 * Uses accumulated scroll distance (not per-frame deltas) to prevent rapid toggles.
 * GPU-only transitions (transform) with proper compositor layer isolation.
 */
export function ScrollHideController() {
  const pathname = usePathname();
  const stateRef = useRef({
    lastScrollY: 0,
    accumulatedDown: 0,
    accumulatedUp: 0,
    isHidden: false,
    ticking: false,
    /** Timestamp until which scroll events are ignored (route-change cooldown). */
    cooldownUntil: 0,
  });

  // Force-show nav and start cooldown — shared by both route change and manual trigger
  const forceShow = useCallback(() => {
    const state = stateRef.current;
    state.isHidden = false;
    state.accumulatedDown = 0;
    state.accumulatedUp = 0;
    state.lastScrollY = window.scrollY;
    state.cooldownUntil = Date.now() + 400;

    document.querySelector<HTMLElement>(HEADER_SELECTOR)?.classList.remove(HIDE_CLASS);
    document.querySelector<HTMLElement>(MOBILE_NAV_SELECTOR)?.classList.remove(HIDE_CLASS);
  }, []);

  // Reset on route change
  useEffect(() => {
    forceShow();
  }, [pathname, forceShow]);

  // Listen for synchronous "force-show-nav" events from drawers/modals.
  // This fires in the click handler BEFORE Vaul's scroll restoration,
  // and the cooldown prevents scroll events from re-hiding.
  useEffect(() => {
    const handler = () => forceShow();
    window.addEventListener("force-show-nav", handler);
    return () => window.removeEventListener("force-show-nav", handler);
  }, [forceShow]);

  useEffect(() => {
    const headerEl = document.querySelector<HTMLElement>(HEADER_SELECTOR);
    const mobileNavEl = document.querySelector<HTMLElement>(MOBILE_NAV_SELECTOR);

    if (!headerEl && !mobileNavEl) return;

    const state = stateRef.current;
    state.lastScrollY = window.scrollY;

    const setHidden = (hidden: boolean) => {
      if (state.isHidden === hidden) return;
      state.isHidden = hidden;
      headerEl?.classList.toggle(HIDE_CLASS, hidden);
      mobileNavEl?.classList.toggle(HIDE_CLASS, hidden);
      // Reset accumulators after toggle to prevent bounce-back
      state.accumulatedDown = 0;
      state.accumulatedUp = 0;
    };

    const update = () => {
      state.ticking = false;

      // Skip scroll processing during cooldown (route transition settling)
      if (Date.now() < state.cooldownUntil) {
        state.lastScrollY = window.scrollY;
        return;
      }

      const currentY = window.scrollY;
      const delta = currentY - state.lastScrollY;
      state.lastScrollY = currentY;

      // Always show when near top
      if (currentY <= TOP_ZONE_PX) {
        setHidden(false);
        return;
      }

      // Accumulate scroll in current direction
      if (delta > 0) {
        // Scrolling down
        state.accumulatedUp = 0;
        state.accumulatedDown += delta;
        if (!state.isHidden && state.accumulatedDown >= THRESHOLD_HIDE_PX) {
          setHidden(true);
        }
      } else if (delta < 0) {
        // Scrolling up
        state.accumulatedDown = 0;
        state.accumulatedUp -= delta;
        if (state.isHidden && state.accumulatedUp >= THRESHOLD_SHOW_PX) {
          setHidden(false);
        }
      }
    };

    const onScroll = () => {
      if (state.ticking) return;
      state.ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
