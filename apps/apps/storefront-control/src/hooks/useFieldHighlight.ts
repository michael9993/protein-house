import { useEffect } from "react";
import { useRouter } from "next/router";

const HIGHLIGHT_CLASS = "field-search-highlight";
const HIGHLIGHT_DURATION_MS = 3000;
const SCROLL_DELAY_MS = 400; // Wait for tab content to render

/**
 * Reads the `highlight` query param and scrolls to + highlights the matching field.
 * Call this once in AppShell so it works across all pages.
 */
export function useFieldHighlight(): void {
  const router = useRouter();

  useEffect(() => {
    const highlight = router.query.highlight;
    if (typeof highlight !== "string" || !highlight) return;

    // Clean up the URL param immediately (shallow, no re-render)
    const { highlight: _, ...restQuery } = router.query;
    router.replace(
      { pathname: router.pathname, query: restQuery, hash: window.location.hash },
      undefined,
      { shallow: true },
    );

    // Delay to allow tab content to render after navigation
    const scrollTimer = setTimeout(() => {
      // Try to find the field by name attribute (works with both FormField variants)
      let element: HTMLElement | null = document.querySelector(
        `[name="${highlight}"]`,
      );

      // Fallback: try by id
      if (!element) {
        element = document.getElementById(highlight);
      }

      // Fallback: try CSS-escaped name (for dots in attribute selectors)
      if (!element) {
        try {
          const escaped = CSS.escape(highlight);
          element = document.querySelector(`[name="${escaped}"]`);
        } catch {
          // CSS.escape not available or selector invalid
        }
      }

      if (!element) return;

      // Scroll the field into view
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      // Find the wrapping form field container for better visual highlight
      const container = element.closest("[class*='space-y']") ??
        element.closest("div[style*='marginBottom']") ??
        element.parentElement;

      const highlightTarget = container ?? element;

      // Apply highlight
      highlightTarget.classList.add(HIGHLIGHT_CLASS);

      // Remove highlight after duration
      setTimeout(() => {
        highlightTarget.classList.remove(HIGHLIGHT_CLASS);
      }, HIGHLIGHT_DURATION_MS);
    }, SCROLL_DELAY_MS);

    return () => clearTimeout(scrollTimer);
  }, [router.query.highlight]);
}
