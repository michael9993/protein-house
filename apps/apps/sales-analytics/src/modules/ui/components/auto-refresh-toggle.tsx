import { RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface AutoRefreshToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  lastUpdated?: Date;
}

const STORAGE_KEY = "analytics-auto-refresh";

export function useAutoRefresh() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const toggle = useCallback((value: boolean) => {
    setEnabled(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  const markUpdated = useCallback(() => {
    setLastUpdated(new Date());
  }, []);

  return { enabled, toggle, lastUpdated, markUpdated };
}

export function AutoRefreshToggle({ enabled, onToggle, lastUpdated }: AutoRefreshToggleProps) {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    const update = () => {
      if (!lastUpdated) return;
      const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (seconds < 10) {
        setTimeAgo("just now");
      } else if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes}m ago`);
      }
    };

    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onToggle(!enabled)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
          enabled
            ? "bg-brand/10 text-brand border-brand/30"
            : "bg-white text-text-muted border-border hover:bg-surface"
        }`}
      >
        <RefreshCw size={12} className={enabled ? "animate-spin" : ""} style={enabled ? { animationDuration: "3s" } : undefined} />
        {enabled ? "Auto" : "Auto-refresh"}
      </button>
      {timeAgo && (
        <span className="text-xs text-text-muted">Updated {timeAgo}</span>
      )}
    </div>
  );
}
