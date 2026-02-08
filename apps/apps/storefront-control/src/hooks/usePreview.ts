import { useCallback, useEffect, useRef, useState } from "react";
import type { StorefrontConfig } from "@/modules/config/schema";

interface UsePreviewOptions {
  storefrontUrl?: string;
  channelSlug: string;
}

interface UsePreviewReturn {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  isReady: boolean;
  sendConfig: (config: Partial<StorefrontConfig>) => void;
  navigate: (path: string) => void;
  refresh: () => void;
}

export function usePreview({ storefrontUrl, channelSlug }: UsePreviewOptions): UsePreviewReturn {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Listen for ready signal from storefront
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "storefront-control:preview-ready") {
        setIsReady(true);
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

  return { iframeRef, isReady, sendConfig, navigate, refresh };
}
