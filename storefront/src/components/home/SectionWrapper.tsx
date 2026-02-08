"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface SectionWrapperProps {
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
}

/**
 * SectionWrapper - Animated reveal wrapper for homepage sections
 * Handles intersection observer for reveal animations with reduced motion support.
 */
export function SectionWrapper({
  children,
  className = "",
  as: Tag = "section",
}: SectionWrapperProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as unknown as React.RefObject<HTMLDivElement>}
      style={{ transitionDuration: 'var(--design-reveal-duration)', transitionTimingFunction: 'var(--design-easing)' }}
      className={`transition-all ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </Tag>
  );
}
