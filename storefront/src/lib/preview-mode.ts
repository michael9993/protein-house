/**
 * Preview Mode Bridge
 *
 * When the storefront is loaded inside the Storefront Control admin iframe
 * with ?preview=1, this module converts PostMessage config updates into
 * the existing CustomEvent("storefront-config-updated") that StoreConfigProvider
 * already listens for. Also initializes the visual overlay for the Component
 * Designer.
 */

import {
  initOverlay,
  setRegistryLabels,
  highlightComponent,
  setOverlayEnabled,
  setOverriddenKeys,
  handleSectionsReordered,
} from "./preview-overlay";

function isInPreviewMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // Check if in iframe AND has preview query param
    return (
      window !== window.parent &&
      new URLSearchParams(window.location.search).has("preview")
    );
  } catch {
    return false;
  }
}

let initialized = false;

export function initPreviewMode(): void {
  if (!isInPreviewMode() || initialized) return;
  initialized = true;

  // Notify parent that we're ready
  window.parent.postMessage(
    {
      type: "storefront-control:preview-ready",
      payload: { currentPath: window.location.pathname },
    },
    "*",
  );

  // Initialize the visual overlay for Component Designer (starts disabled — admin toggles it on)
  initOverlay();
  setOverlayEnabled(false);

  // Forward section reorder events to admin
  handleSectionsReordered((order) => {
    window.parent.postMessage(
      {
        type: "storefront-control:sections-reordered",
        payload: { sectionOrder: order },
      },
      "*",
    );
  });

  // Listen for messages from admin
  window.addEventListener("message", (event: MessageEvent) => {
    if (event.data?.type === "storefront-control:config-update") {
      // Dispatch the same CustomEvent that StoreConfigProvider already handles.
      // Wrap in { config: ... } to match the expected detail shape.
      // This is a partial config — provider merges it with existing state.
      window.dispatchEvent(
        new CustomEvent("storefront-config-updated", {
          detail: { config: event.data.payload.config },
        }),
      );
    }

    if (event.data?.type === "storefront-control:navigate") {
      const path = event.data.payload?.path;
      // Only allow relative paths to prevent open redirect attacks
      if (path && typeof path === "string" && path.startsWith("/")) {
        window.location.href = path;
      }
    }

    // Component Designer overlay messages
    if (event.data?.type === "storefront-control:overlay-init") {
      setRegistryLabels(event.data.payload.components);
    }

    if (event.data?.type === "storefront-control:highlight-component") {
      highlightComponent(event.data.payload.configKey);
    }

    if (event.data?.type === "storefront-control:overlay-toggle") {
      setOverlayEnabled(event.data.payload.enabled);
    }

    if (event.data?.type === "storefront-control:override-keys") {
      setOverriddenKeys(event.data.payload.keys);
    }
  });
}
