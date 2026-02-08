import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FieldGroupProps {
  columns?: 1 | 2 | 3 | 4;
  children: ReactNode;
  className?: string;
}

const COLUMN_CLASSES: Record<1 | 2 | 3 | 4, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function FieldGroup({ columns = 2, children, className }: FieldGroupProps) {
  return (
    <div className={cn("grid gap-4", COLUMN_CLASSES[columns], className)}>
      {children}
    </div>
  );
}
