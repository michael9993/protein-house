"use client";

import React from 'react';
import { useCartDisplayMode } from '@/providers/StoreConfigProvider';
import { CartDrawerProvider } from '@/providers/CartDrawerProvider';
import { CartDrawer } from '@/ui/components/CartDrawer';

interface CartDrawerWrapperProps {
  children: React.ReactNode;
  checkoutData: {
    id: string;
    lines: Array<{
      id: string;
      quantity: number;
      totalPrice: {
        gross: {
          amount: number;
          currency: string;
        };
      };
      variant: {
        id: string;
        name: string;
        product: {
          id: string;
          name: string;
          slug: string;
          thumbnail?: {
            url: string;
            alt?: string;
          };
        };
        pricing?: {
          price?: {
            gross: {
              amount: number;
              currency: string;
            };
          };
        };
      };
    }>;
    totalPrice: {
      gross: {
        amount: number;
        currency: string;
      };
    };
  } | null;
  channel: string;
}

/**
 * Wrapper component that conditionally provides the CartDrawer functionality
 * based on the storefront.cart.displayMode setting.
 * 
 * When displayMode is 'drawer', this wraps children with CartDrawerProvider
 * and renders the CartDrawer component.
 * 
 * When displayMode is 'page', this just renders children as-is.
 */
export function CartDrawerWrapper({ children, checkoutData, channel }: CartDrawerWrapperProps) {
  const displayMode = useCartDisplayMode();

  // If displayMode is 'page', just render children without the drawer
  if (displayMode === 'page') {
    return <>{children}</>;
  }

  // If displayMode is 'drawer', wrap with provider and render drawer
  return (
    <CartDrawerProvider>
      {children}
      <CartDrawer 
        checkoutData={checkoutData} 
        channel={channel}
        // Actions will be passed from parent when implementing cart mutations
      />
    </CartDrawerProvider>
  );
}

export default CartDrawerWrapper;
