import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ComponentBlockProps {
  /** Block icon */
  icon: LucideIcon;
  /** Block title */
  title: string;
  /** Short description */
  description: string;
  /** Whether the block is enabled (shows toggle if provided) */
  enabled?: boolean;
  /** Callback when toggle changes */
  onToggle?: (enabled: boolean) => void;
  /** Whether to show the enable/disable toggle */
  showToggle?: boolean;
  /** Start expanded */
  defaultExpanded?: boolean;
  /** Status badge text */
  statusText?: string;
  /** Status badge variant */
  statusVariant?: "default" | "secondary" | "outline";
  /** Block content (form fields) */
  children: ReactNode;
}

export function ComponentBlock({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
  showToggle = false,
  defaultExpanded = false,
  statusText,
  statusVariant = "secondary",
  children,
}: ComponentBlockProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  return (
    <Card className={cn("transition-all", enabled === false && "opacity-60")}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-0">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Icon */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Title + Description */}
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex flex-1 items-center gap-2 text-left min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold truncate">{title}</h3>
                    {statusText && (
                      <Badge variant={statusVariant} className="text-[10px] px-1.5 py-0">
                        {statusText}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {description}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
            </CollapsibleTrigger>

            {/* Toggle */}
            {showToggle && (
              <div className="shrink-0 ps-2 border-s border-border">
                <Switch
                  checked={enabled ?? false}
                  onCheckedChange={onToggle}
                  aria-label={`Toggle ${title}`}
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0 border-t">
            <div className="pt-4">{children}</div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
