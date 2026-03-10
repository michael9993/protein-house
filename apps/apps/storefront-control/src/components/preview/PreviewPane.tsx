import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewPaneProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  isReady: boolean;
  storefrontUrl: string;
  channelSlug: string;
  deviceSize: "desktop" | "tablet" | "mobile";
}

const DEVICE_WIDTHS: Record<PreviewPaneProps["deviceSize"], string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function PreviewPane({ iframeRef, isReady, storefrontUrl, channelSlug, deviceSize }: PreviewPaneProps) {
  // Fallback: show iframe after 3s even if postMessage handshake doesn't complete
  const [showFallback, setShowFallback] = useState(false);
  useEffect(() => {
    if (isReady) return;
    const timer = setTimeout(() => setShowFallback(true), 3000);
    return () => clearTimeout(timer);
  }, [isReady]);

  const showIframe = isReady || showFallback;

  return (
    <div className="flex-1 flex flex-col items-center justify-start bg-neutral-100 overflow-auto p-4">
      <div
        className={cn(
          "bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-lg transition-all duration-300",
          deviceSize !== "desktop" && "mx-auto"
        )}
        style={{
          width: DEVICE_WIDTHS[deviceSize],
          maxWidth: "100%",
          height: deviceSize === "desktop" ? "100%" : "calc(100vh - 200px)",
        }}
      >
        {!showIframe && (
          <div className="flex items-center justify-center h-32 gap-2 text-neutral-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading preview...</span>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={`${storefrontUrl}/${channelSlug}?preview=1`}
          className={cn("w-full h-full border-0", !showIframe && "hidden")}
          title="Storefront Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
