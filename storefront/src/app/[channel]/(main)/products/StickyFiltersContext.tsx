"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

interface StickyFiltersContextType {
  showStickyFilters: boolean;
  setShowStickyFilters: (show: boolean) => void;
}

const StickyFiltersContext = createContext<StickyFiltersContextType | undefined>(undefined);

export function StickyFiltersProvider({ children }: { children: ReactNode }) {
  const [showStickyFilters, setShowStickyFilters] = useState(false);
  const quickFiltersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateHeaderHeight = () => {
      const header = document.querySelector('header');
      const height = header ? header.getBoundingClientRect().height : 64;
      return height;
    };

    const handleScroll = () => {
      if (!quickFiltersRef.current) return;
      const rect = quickFiltersRef.current.getBoundingClientRect();
      const currentHeaderHeight = calculateHeaderHeight();
      const isOutOfView = rect.top <= currentHeaderHeight;
      setShowStickyFilters(isOutOfView);
    };

    calculateHeaderHeight();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <StickyFiltersContext.Provider value={{ showStickyFilters, setShowStickyFilters }}>
      {children}
      {/* Hidden ref element to track scroll position */}
      <div ref={quickFiltersRef} className="hidden" />
    </StickyFiltersContext.Provider>
  );
}

export function useStickyFilters() {
  const context = useContext(StickyFiltersContext);
  if (context === undefined) {
    throw new Error("useStickyFilters must be used within StickyFiltersProvider");
  }
  return context;
}

