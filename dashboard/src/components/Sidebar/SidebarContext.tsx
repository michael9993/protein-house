import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

type SidebarBreakpoint = "default" | "wide";

interface SidebarContextValue {
  breakpoint: SidebarBreakpoint;
  setBreakpoint: (breakpoint: SidebarBreakpoint) => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const SIDEBAR_COLLAPSED_KEY = "saleor_sidebar_collapsed";

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [breakpoint, setBreakpoint] = useState<SidebarBreakpoint>("default");
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ breakpoint, setBreakpoint, collapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarBreakpointContext = () => {
  const context = useContext(SidebarContext);

  if (context === undefined) {
    throw new Error("useSidebarBreakpoint must be used within a SidebarProvider");
  }

  return context;
};

export const useSidebarCollapsed = () => {
  const { collapsed, toggleCollapsed } = useSidebarBreakpointContext();
  return { collapsed, toggleCollapsed };
};

export const useSidebarCollapseShortcut = () => {
  const { toggleCollapsed } = useSidebarBreakpointContext();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleCollapsed]);
};

/**
 * Hook to set a custom sidebar breakpoint for a page.
 * The breakpoint is automatically reset to "default" when the component unmounts.
 *
 * @param breakpoint - The breakpoint to use ("default" or "wide")
 *
 * @example
 * ```tsx
 * const MyPage = () => {
 *   useCustomSidebarBreakpoint("wide");
 *   return <div>Page content</div>;
 * };
 * ```
 */
export const useCustomSidebarBreakpoint = (breakpoint: SidebarBreakpoint) => {
  const { setBreakpoint } = useSidebarBreakpointContext();

  useEffect(() => {
    setBreakpoint(breakpoint);

    return () => {
      setBreakpoint("default");
    };
  }, [breakpoint, setBreakpoint]);
};
