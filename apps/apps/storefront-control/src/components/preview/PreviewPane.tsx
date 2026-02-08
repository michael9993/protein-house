import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewPaneProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  isReady: boolean;
  storefrontUrl: string;
  deviceSize: "desktop" | "tablet" | "mobile";
}

const DEVICE_WIDTHS: Record<PreviewPaneProps["deviceSize"], string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function PreviewPane({ iframeRef, isReady, storefrontUrl, deviceSize }: PreviewPaneProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-start bg-muted/30 overflow-auto p-4">
      <div
        className={cn(
          "bg-background border border-border rounded-lg overflow-hidden shadow-lg transition-all duration-300",
          deviceSize !== "desktop" && "mx-auto"
        )}
        style={{
          width: DEVICE_WIDTHS[deviceSize],
          maxWidth: "100%",
          height: deviceSize === "desktop" ? "100%" : "calc(100vh - 200px)",
        }}
      >
        {!isReady && (
          <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading preview...</span>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={`${storefrontUrl}?preview=1`}
          className={cn("w-full h-full border-0", !isReady && "hidden")}
          title="Storefront Preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </div>
  );
}
