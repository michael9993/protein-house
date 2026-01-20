"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hook for scroll-triggered animations using Intersection Observer
 * Perfect for ecommerce homepage sections
 */
export function useScrollAnimation(options?: {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const hasAnimated = useRef(false);

  const {
    threshold = 0.1,
    rootMargin = "0px 0px -100px 0px",
    triggerOnce = true,
  } = options || {};

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // If already animated and triggerOnce is true, don't observe again
    if (hasAnimated.current && triggerOnce) return;

    // Use requestIdleCallback for better performance (fallback to setTimeout)
    const scheduleObserver = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 200 });
      } else {
        setTimeout(callback, 1);
      }
    };

    scheduleObserver(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Use requestAnimationFrame for smooth state updates
              requestAnimationFrame(() => {
                setIsVisible(true);
              });
              if (triggerOnce) {
                hasAnimated.current = true;
                observer.unobserve(element);
              }
            } else if (!triggerOnce) {
              requestAnimationFrame(() => {
                setIsVisible(false);
              });
            }
          });
        },
        {
          threshold,
          rootMargin,
        }
      );

      observer.observe(element);

      return () => {
        observer.unobserve(element);
      };
    });
  }, [threshold, rootMargin, triggerOnce]);

  return { elementRef, isVisible };
}
