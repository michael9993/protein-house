import { Eye, EyeOff, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title: string;
  onSearchOpen?: () => void;
  showPreviewToggle?: boolean;
  previewActive?: boolean;
  onPreviewToggle?: () => void;
}

export function TopBar({
  title,
  onSearchOpen,
  showPreviewToggle,
  previewActive,
  onPreviewToggle,
}: TopBarProps) {
  return (
    <header className="h-14 border-b border-border px-6 flex items-center justify-between bg-background shrink-0">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-2">
        {onSearchOpen && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={onSearchOpen}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search settings...</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </Button>
        )}

        {showPreviewToggle && onPreviewToggle && (
          <Button
            variant={previewActive ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={onPreviewToggle}
          >
            {previewActive ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Preview</span>
          </Button>
        )}
      </div>
    </header>
  );
}
