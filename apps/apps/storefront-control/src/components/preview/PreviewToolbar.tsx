import { Monitor, Smartphone, Tablet, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewToolbarProps {
  deviceSize: "desktop" | "tablet" | "mobile";
  onDeviceSizeChange: (size: "desktop" | "tablet" | "mobile") => void;
  onRefresh: () => void;
  isReady: boolean;
  storefrontUrl?: string;
}

const DEVICE_OPTIONS = [
  { value: "desktop" as const, icon: Monitor, label: "Desktop" },
  { value: "tablet" as const, icon: Tablet, label: "Tablet" },
  { value: "mobile" as const, icon: Smartphone, label: "Mobile" },
];

export function PreviewToolbar({
  deviceSize,
  onDeviceSizeChange,
  onRefresh,
  isReady,
  storefrontUrl,
}: PreviewToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
      <div className="flex items-center gap-1">
        {DEVICE_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.value}
              variant={deviceSize === option.value ? "default" : "ghost"}
              size="sm"
              onClick={() => onDeviceSizeChange(option.value)}
              title={option.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        {!isReady && (
          <span className="text-xs text-muted-foreground animate-pulse">Connecting...</span>
        )}
        <Button variant="ghost" size="sm" onClick={onRefresh} title="Refresh preview">
          <RefreshCw className="h-4 w-4" />
        </Button>
        {storefrontUrl && (
          <Button variant="ghost" size="sm" asChild>
            <a
              href={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
