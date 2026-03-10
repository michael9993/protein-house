import { useCallback, useEffect, useRef, useState } from "react";
import type { StorefrontConfig } from "@/modules/config/schema";
import { getSerializableRegistry } from "@/lib/component-registry";

interface UsePreviewOptions {
  storefrontUrl?: string;
  channelSlug: string;
  /** Called every time a component is clicked in the preview overlay (fires even for re-clicks on the same component) */
  onComponentSelected?: (configKey: string) => void;
}

interface UsePreviewReturn {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  isReady: boolean;
  sendConfig: (config: Partial<StorefrontConfig>) => void;
  navigate: (path: string) => void;
  refresh: () => void;
  selectedFromPreview: string | null;
  highlightComponent: (key: string) => void;
  initOverlay: () => void;
  overlayEnabled: boolean;
  setOverlayEnabled: (enabled: boolean) => void;
  sendOverrideKeys: (keys: string[]) => void;
  onSectionsReordered: string[] | null;
}

export function usePreview({ storefrontUrl, channelSlug, onComponentSelected }: UsePreviewOptions): UsePreviewReturn {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [readyCount, setReadyCount] = useState(0);
  const [selectedFromPreview, setSelectedFromPreview] = useState<string | null>(null);
  const [overlayEnabled, setOverlayEnabledState] = useState(false);
  const overlayEnabledRef = useRef(false);
  const [onSectionsReordered, setOnSectionsReordered] = useState<string[] | null>(null);

  // Keep callback ref current without re-subscribing message listener
  const onComponentSelectedRef = useRef(onComponentSelected);
  onComponentSelectedRef.current = onComponentSelected;

  // Listen for messages from storefront
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const type = event.data?.type;
      if (type === "storefront-control:preview-ready") {
        setIsReady(true);
        setReadyCount((c) => c + 1);
        // Re-send overlay state after iframe navigation (overlay reinitializes disabled)
        setTimeout(() => {
          const iframe = iframeRef.current?.contentWindow;
          if (!iframe) return;
          iframe.postMessage(
            { type: "storefront-control:overlay-init", payload: { components: getSerializableRegistry() } },
            "*"
          );
          iframe.postMessage(
            { type: "storefront-control:overlay-toggle", payload: { enabled: overlayEnabledRef.current } },
            "*"
          );
        }, 100);
      } else if (type === "storefront-control:component-selected") {
        const configKey = event.data.payload.configKey;
        setSelectedFromPreview(configKey);
        // Fire callback on every click (bypasses React state dedup for re-clicks on same component)
        onComponentSelectedRef.current?.(configKey);
      } else if (type === "storefront-control:sections-reordered") {
        setOnSectionsReordered(event.data.payload.sectionOrder);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const sendConfig = useCallback((config: Partial<StorefrontConfig>) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "storefront-control:config-update", payload: { config } },
      "*"
    );
  }, []);

  const navigate = useCallback((path: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "storefront-control:navigate", payload: { path } },
      "*"
    );
  }, []);

  const refresh = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      setIsReady(false);
    }
  }, []);

  const highlightComponent = useCallback((key: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "storefront-control:highlight-component", payload: { configKey: key } },
      "*"
    );
  }, []);

  const initOverlay = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "storefront-control:overlay-init", payload: { components: getSerializableRegistry() } },
      "*"
    );
  }, []);

  const setOverlayEnabled = useCallback((enabled: boolean) => {
    setOverlayEnabledState(enabled);
    overlayEnabledRef.current = enabled;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "storefront-control:overlay-toggle", payload: { enabled } },
      "*"
    );
  }, []);

  const sendOverrideKeys = useCallback((keys: string[]) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "storefront-control:override-keys", payload: { keys } },
      "*"
    );
  }, []);

  return {
    iframeRef, isReady, sendConfig, navigate, refresh,
    selectedFromPreview, highlightComponent, initOverlay,
    overlayEnabled, setOverlayEnabled, sendOverrideKeys, onSectionsReordered,
  };
}
