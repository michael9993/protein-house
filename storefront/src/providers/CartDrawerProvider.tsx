"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface CartDrawerContextValue {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextValue | undefined>(undefined);

interface CartDrawerProviderProps {
  children: ReactNode;
}

export function CartDrawerProvider({ children }: CartDrawerProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    // Prevent body scroll when drawer is open
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    // Restore body scroll when drawer is closed
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }, []);

  const toggleDrawer = useCallback(() => {
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }, [isOpen, openDrawer, closeDrawer]);

  return (
    <CartDrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer, toggleDrawer }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer(): CartDrawerContextValue {
  const context = useContext(CartDrawerContext);
  if (!context) {
    throw new Error('useCartDrawer must be used within a CartDrawerProvider');
  }
  return context;
}

/**
 * Safe version that returns null if not within provider
 * (useful for components that may render outside the drawer context)
 */
export function useCartDrawerSafe(): CartDrawerContextValue | null {
  return useContext(CartDrawerContext) ?? null;
}
