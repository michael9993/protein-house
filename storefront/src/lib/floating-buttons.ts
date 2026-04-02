/**
 * Shared logic for floating action buttons positioning.
 * Each FAB calls computeFloatingButtonPosition() with its own ID
 * to get its computed bottom offset, side, and enabled state.
 *
 * Per-FAB config: each button has its own enabled, side, and order.
 * Stacking is computed independently per side — buttons on opposite
 * sides don't affect each other's position.
 *
 * Dynamic visibility: FABs like scroll-to-top are enabled but
 * conditionally visible. When hidden, other FABs on the same side
 * collapse into the gap. The external store (setFabVisible / useHiddenFabIds)
 * broadcasts visibility so all FABs can recompute positions with animation.
 */

import { useSyncExternalStore } from "react";
import type { FloatingButtonId, FloatingButtonsConfig } from "@saleor/apps-storefront-config";

const FAB_SIZE_REM = 3; // 48px = 3rem (h-12 w-12)
const PDP_EXTRA_OFFSET_REM = 4; // Extra space on PDP for sticky add-to-cart

const FAB_IDS: FloatingButtonId[] = ["whatsapp", "recentlyViewed", "wishlist", "scrollToTop"];

export interface FloatingButtonPosition {
  /** Whether this FAB should render */
  enabled: boolean;
  /** CSS bottom value */
  bottom: string;
  /** CSS side: "left" or "right" (resolved from logical "start"/"end" based on dir) */
  side: "left" | "right";
}

// ─── Visibility external store ──────────────────────────────────────
// Lets FABs with conditional visibility (e.g. scroll-to-top) broadcast
// their state so other FABs on the same side can collapse / expand.

let hiddenFabIds: ReadonlySet<FloatingButtonId> = new Set<FloatingButtonId>();
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((l) => l());
}

/**
 * Call from FABs with conditional visibility to register show/hide.
 * Other FABs on the same side will animate into the vacated position.
 */
export function setFabVisible(id: FloatingButtonId, visible: boolean) {
  const isHidden = hiddenFabIds.has(id);
  if (visible && isHidden) {
    const next = new Set(hiddenFabIds);
    next.delete(id);
    hiddenFabIds = next;
    emitChange();
  } else if (!visible && !isHidden) {
    const next = new Set(hiddenFabIds);
    next.add(id);
    hiddenFabIds = next;
    emitChange();
  }
}

/** React hook — returns the set of currently hidden FAB IDs. */
export function useHiddenFabIds(): ReadonlySet<FloatingButtonId> {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => hiddenFabIds,
    () => hiddenFabIds,
  );
}

// ─── Position computation ───────────────────────────────────────────

function resolvePhysicalSide(
  logical: "start" | "end",
  dir: "ltr" | "rtl",
): "left" | "right" {
  if (logical === "start") return dir === "rtl" ? "right" : "left";
  return dir === "rtl" ? "left" : "right";
}

/**
 * Compute a FAB's position based on config and current visibility state.
 *
 * @param hiddenIds — FABs that are enabled but temporarily not visible.
 *   Hidden FABs are excluded from the stacking index so others collapse
 *   into the gap. Pass useHiddenFabIds() result here.
 */
export function computeFloatingButtonPosition(
  id: FloatingButtonId,
  config: FloatingButtonsConfig,
  isPDP: boolean,
  dir: "ltr" | "rtl" = "ltr",
  hiddenIds: ReadonlySet<FloatingButtonId> = new Set(),
): FloatingButtonPosition {
  const item = config[id];
  if (!item.enabled) {
    return { enabled: false, bottom: "0", side: "left" };
  }

  // Collect all enabled AND visible FABs on the SAME side, sorted by order
  const sameSideFabs = FAB_IDS
    .filter((fabId) =>
      config[fabId].enabled &&
      config[fabId].side === item.side &&
      !hiddenIds.has(fabId),
    )
    .sort((a, b) => config[a].order - config[b].order);

  // Find this FAB's index among same-side visible FABs
  const index = sameSideFabs.indexOf(id);

  // If this FAB is hidden, it won't be in the list — still return enabled
  // so the component can render (with opacity 0) for animation purposes
  if (index === -1) {
    // Hidden FAB: return base position (it'll be invisible anyway)
    const baseOffset = config.baseOffset + (isPDP ? PDP_EXTRA_OFFSET_REM : 0);
    const ownOrder = config[id].order;
    // Count visible FABs with lower order to find where we'd slot in
    const visibleBelow = sameSideFabs.filter(
      (fabId) => config[fabId].order < ownOrder,
    ).length;
    const bottomRem = baseOffset + visibleBelow * (FAB_SIZE_REM + config.gap);
    return {
      enabled: true,
      bottom: `calc(${bottomRem}rem + env(safe-area-inset-bottom, 0px))`,
      side: resolvePhysicalSide(item.side, dir),
    };
  }

  // Calculate bottom: baseOffset + index * (FAB_SIZE + gap)
  const baseOffset = config.baseOffset + (isPDP ? PDP_EXTRA_OFFSET_REM : 0);
  const bottomRem = baseOffset + index * (FAB_SIZE_REM + config.gap);

  return {
    enabled: true,
    bottom: `calc(${bottomRem}rem + env(safe-area-inset-bottom, 0px))`,
    side: resolvePhysicalSide(item.side, dir),
  };
}
