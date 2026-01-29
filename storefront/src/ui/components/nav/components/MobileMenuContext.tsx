"use client";

import { createContext, useContext } from "react";

const MobileMenuContext = createContext<boolean>(false);

export function MobileMenuProvider({
  children,
  inMobileMenu,
}: {
  children: React.ReactNode;
  inMobileMenu: boolean;
}) {
  return (
    <MobileMenuContext.Provider value={inMobileMenu}>
      {children}
    </MobileMenuContext.Provider>
  );
}

export function useInMobileMenu(): boolean {
  return useContext(MobileMenuContext);
}
