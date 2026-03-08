import type { HistoryEntry } from "./hooks/useHistory";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  currentIndex: number;
  onJumpTo: (index: number) => void;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 5000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export function HistoryPanel({ entries, currentIndex, onJumpTo }: HistoryPanelProps) {
  if (entries.length === 0) {
    return (
      <div className="p-3 text-center text-xs text-muted-foreground">
        No history yet
      </div>
    );
  }

  return (
    <div className="p-2">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase mb-2 px-1">
        History ({entries.length})
      </h3>
      <div className="space-y-0.5">
        {entries.map((entry, i) => {
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;
          return (
            <button
              key={`${entry.timestamp}-${i}`}
              onClick={() => onJumpTo(i)}
              className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors ${
                isCurrent
                  ? "bg-primary/10 text-primary font-medium"
                  : isFuture
                    ? "text-muted-foreground/50 hover:bg-accent/50"
                    : "text-foreground hover:bg-accent"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate flex items-center gap-1.5">
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                  {entry.label}
                </span>
                <span className="text-[9px] text-muted-foreground shrink-0">
                  {formatRelativeTime(entry.timestamp)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
