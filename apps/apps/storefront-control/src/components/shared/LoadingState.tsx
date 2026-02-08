import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
}

export function LoadingState({ className }: LoadingStateProps) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      </div>

      {/* Card skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border p-6 space-y-4">
          <div className="space-y-2">
            <div className="h-5 w-36 animate-pulse rounded bg-muted" />
            <div className="h-3 w-56 animate-pulse rounded bg-muted" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-9 w-full animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-9 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-9 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
