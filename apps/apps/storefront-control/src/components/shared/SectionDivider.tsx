import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface SectionDividerProps {
  label?: string;
  className?: string;
}

export function SectionDivider({ label, className }: SectionDividerProps) {
  if (!label) {
    return <Separator className={className} />;
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Separator className="flex-1" />
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}
