import { useEffect } from "react";

/**
 * Calls `handler` when a click occurs outside the element(s) referenced by `refs`.
 * Supports `mouseEvent` override (default: "mousedown").
 */
export function useClickOutside(
  refs: React.RefObject<HTMLElement | null>[],
  handler: (event: MouseEvent) => void,
  mouseEvent: "mousedown" | "mouseup" = "mousedown",
): void {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      for (const ref of refs) {
        if (ref.current?.contains(event.target as Node)) return;
      }
      handler(event);
    };
    document.addEventListener(mouseEvent, listener);
    return () => document.removeEventListener(mouseEvent, listener);
  }, [refs, handler, mouseEvent]);
}
