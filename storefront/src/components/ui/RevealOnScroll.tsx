"use client";

import React, { useEffect, useRef, useState } from "react";

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}

export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({ children, className = "", delay = 0, style }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // On mobile (< 768px), use a generous rootMargin so sections
    // trigger earlier while scrolling — the element starts observing
    // 80px before it enters the viewport. On desktop, use a small
    // threshold so sections reveal once slightly visible.
    const isMobile = window.innerWidth < 768;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
          observer.disconnect();
        }
      },
      isMobile
        ? { rootMargin: "80px 0px", threshold: 0.01 }
        : { threshold: 0.15 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      style={style}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
};
