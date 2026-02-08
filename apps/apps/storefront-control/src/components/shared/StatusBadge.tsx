import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Status = "enabled" | "disabled" | "warning" | "error";

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

const DOT_COLORS: Record<Status, string> = {
  enabled: "bg-green-500",
  disabled: "bg-muted-foreground",
  warning: "bg-yellow-500",
  error: "bg-destructive",
};

const VARIANT_MAP: Record<Status, "default" | "secondary" | "outline" | "destructive"> = {
  enabled: "default",
  disabled: "secondary",
  warning: "outline",
  error: "destructive",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const displayLabel = label ?? status;

  return (
    <Badge variant={VARIANT_MAP[status]} className="gap-1.5">
      <span className={cn("inline-block h-2 w-2 rounded-full", DOT_COLORS[status])} />
      {displayLabel}
    </Badge>
  );
}
