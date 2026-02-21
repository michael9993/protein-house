import { type ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, children, actions, className = "" }: ChartCardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

interface ChartCardSkeletonProps {
  height?: string;
}

export function ChartCardSkeleton({ height = "h-48" }: ChartCardSkeletonProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm animate-pulse">
      <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
      <div className={`${height} bg-gray-100 rounded`} />
    </div>
  );
}
