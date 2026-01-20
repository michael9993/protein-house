"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Page Transition Component
 * 
 * Provides smooth entry animations when pages load.
 * Wraps page content and animates it in with a fade and slide effect.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Reset animation when pathname changes
    setIsVisible(false);
    setKey((prev) => prev + 1);

    // Trigger animation after a small delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      key={key}
      className="min-h-full transition-all duration-500 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        willChange: isVisible ? 'auto' : 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
}
