"use client";

import { useRef, useState, useEffect, useCallback } from "react";

/**
 * Tracks whether a DOM element is visible in the viewport using IntersectionObserver.
 * Returns { ref, isInViewport } — attach `ref` to the target element.
 *
 * Initializes `isInViewport` to `true` so the sticky bar stays hidden on first render
 * (avoids a flash before the observer fires).
 */
export function useInViewport() {
  const ref = useRef<HTMLDivElement>(null);
  const [isInViewport, setIsInViewport] = useState(true);

  const handleIntersection = useCallback(
    ([entry]: IntersectionObserverEntry[]) => {
      setIsInViewport(entry.isIntersecting);
    },
    [],
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [handleIntersection]);

  return { ref, isInViewport };
}
