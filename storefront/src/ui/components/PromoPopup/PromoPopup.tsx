"use client";

/**
 * PromoPopup Component
 * 
 * Displays promotional popups based on:
 * 1. Storefront Control config (promoPopup settings)
 * 2. Active Saleor discounts (when autoDetectSales is true)
 * 
 * Features:
 * - Config-driven content (title, body, images, CTA)
 * - Auto-detect from "sale" collection (optional)
 * - Frequency control via localStorage
 * - Channel-aware (per-channel popup state)
 * - Doesn't show during checkout/cart
 * - Analytics event hooks
 */

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { usePromoPopupConfig, useBranding } from "@/providers/StoreConfigProvider";

interface PromoPopupProps {
  channel: string;
  /** Number of products currently on sale (for auto-detect mode) */
  saleProductCount: number;
  /** Currency code for the channel */
  currencyCode?: string;
  /** Optional discount percentage from auto-detect */
  discountPercent?: number;
  /** Description from the "sale" collection (for auto-detect mode) */
  description?: string;
  /** Promotion name from collection metadata (for auto-detect mode) */
  promotionName?: string;
  /** Background image from the "sale" collection (for auto-detect mode) */
  backgroundImage?: { url: string; alt: string } | null;
}

// Simple analytics helper - can be expanded to integrate with real analytics
function trackPromoEvent(event: "shown" | "dismissed" | "cta_clicked", channel: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log(`[PromoPopup] ${event}`, { channel, ...data });
  }
  // TODO: Integrate with real analytics (GA4, Segment, etc.)
}

function getStorageKey(channel: string): string {
  return `promo_popup_${channel}`;
}

function shouldShowPopup(channel: string, ttlHours: number): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const stored = localStorage.getItem(getStorageKey(channel));
    if (!stored) return true;
    
    const parsed = JSON.parse(stored) as { timestamp?: number; dismissed?: boolean };
    const { timestamp, dismissed } = parsed;
    if (!timestamp) return true; // If no timestamp, show it
    
    const ttlMs = ttlHours * 60 * 60 * 1000;
    const now = Date.now();
    
    // If dismissed and within TTL, don't show
    if (dismissed && now - timestamp < ttlMs) {
      return false;
    }
    
    // If shown (not dismissed) and within shorter TTL (1/6 of full TTL), don't show
    if (!dismissed && now - timestamp < ttlMs / 6) {
      return false;
    }
    
    return true;
  } catch {
    return true;
  }
}

function markPopupShown(channel: string, dismissed: boolean): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(getStorageKey(channel), JSON.stringify({
      timestamp: Date.now(),
      dismissed,
    }));
  } catch {
    // Ignore storage errors
  }
}

export function PromoPopup({
  channel,
  saleProductCount,
  currencyCode: _currencyCode = "USD",
  discountPercent,
  description,
  promotionName,
  backgroundImage,
}: PromoPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  // Get config from context
  const popupConfig = usePromoPopupConfig();
  const branding = useBranding();

  // Determine if we should use auto-detect or config values
  const useAutoDetect = popupConfig.autoDetectSales && saleProductCount > 0;
  
  // Resolve content - use config values or auto-detected values
  const title = useAutoDetect && promotionName ? promotionName : popupConfig.title;
  const body = useAutoDetect && description ? parseDescription(description) : popupConfig.body;
  const badge = discountPercent ? `Up to ${discountPercent}% Off` : (popupConfig.badge || "Special Offer");
  const bgImage = useAutoDetect && backgroundImage ? backgroundImage : 
    (popupConfig.backgroundImageUrl ? { url: popupConfig.backgroundImageUrl, alt: "Promotion" } : null);
  const ctaText = popupConfig.ctaText;
  const ctaLink = popupConfig.ctaLink;

  // Check if we should show the popup
  useEffect(() => {
    setMounted(true);
    
    // Don't show if feature is disabled
    if (!popupConfig.enabled) return;
    
    // If autoDetectSales is on but no sale products, don't show
    if (popupConfig.autoDetectSales && saleProductCount === 0) return;
    
    // Check page exclusions
    if (popupConfig.excludeCheckout && pathname?.includes("/checkout")) return;
    if (popupConfig.excludeCart && pathname?.includes("/cart")) return;
    
    // Check TTL
    if (!shouldShowPopup(channel, popupConfig.ttlHours)) return;
    
    // Show popup after delay
    const timer = setTimeout(() => {
      setIsOpen(true);
      markPopupShown(channel, false);
      trackPromoEvent("shown", channel, { saleProductCount, discountPercent });
    }, popupConfig.delaySeconds * 1000);
    
    return () => clearTimeout(timer);
  }, [channel, saleProductCount, discountPercent, pathname, popupConfig]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    markPopupShown(channel, true);
    trackPromoEvent("dismissed", channel);
  }, [channel]);

  const handleCtaClick = useCallback(() => {
    trackPromoEvent("cta_clicked", channel, { destination: ctaLink });
    setIsOpen(false);
    markPopupShown(channel, true);
  }, [channel, ctaLink]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  // Don't render on server or if not open
  if (!mounted || !isOpen) return null;

  return (
    <>
      {/* Backdrop with fade-in */}
      <div
        className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-500"
        style={{
          animation: "fadeIn 0.4s ease-out forwards",
        }}
        onClick={handleClose}
        role="presentation"
      />
      
      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-title"
      >
        <div
          className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden pointer-events-auto"
          style={{
            animation: "popupSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background Image Layer */}
          {bgImage && (
            <div 
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: `url(${bgImage.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              {/* Gradient overlay for better text readability */}
              <div 
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${branding.colors.primary}CC 0%, ${branding.colors.primary}DD 50%, ${branding.colors.accent || branding.colors.primary}DD 100%)`,
                }}
              />
            </div>
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 z-20 rounded-full bg-white/90 backdrop-blur-sm p-1.5 text-neutral-500 transition-colors hover:bg-white hover:text-neutral-800 shadow-lg"
            aria-label="Close promotion popup"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header with gradient or image background */}
          <div 
            className="relative px-6 py-8 text-center z-10"
            style={
              bgImage
                ? {} // Background handled by image layer above
                : {
                    background: `linear-gradient(135deg, ${branding.colors.primary} 0%, ${branding.colors.accent || branding.colors.primary} 100%)`,
                  }
            }
          >
            {/* Title */}
            <h2 
              id="promo-title"
              className="text-3xl font-bold text-white mb-3"
              style={{ animation: "fadeInUp 0.5s ease-out 0.2s both" }}
            >
              {title}
            </h2>
            
            {/* Badge */}
            <div 
              className="mb-3"
              style={{ animation: "fadeInUp 0.5s ease-out 0.3s both" }}
            >
              <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                🎉 {badge}
              </span>
            </div>
            
            {/* Item count (only if auto-detect mode with products) */}
            {useAutoDetect && saleProductCount > 0 && (
              <p 
                className="text-white/90"
                style={{ animation: "fadeInUp 0.5s ease-out 0.4s both" }}
              >
                {saleProductCount} {saleProductCount === 1 ? "item" : "items"} on sale
              </p>
            )}
          </div>

          {/* Body */}
          <div className="relative px-6 py-6 text-center z-10 bg-white/95 backdrop-blur-sm">
            <p 
              className="text-neutral-700 mb-6 whitespace-pre-line font-medium"
              style={{ animation: "fadeInUp 0.5s ease-out 0.5s both" }}
            >
              {body}
            </p>
            
            {/* CTA Button */}
            <a
              href={`/${channel}${ctaLink.startsWith('/') ? ctaLink : '/' + ctaLink}`}
              onClick={handleCtaClick}
              className="inline-block w-full rounded-xl px-6 py-4 text-center font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] shadow-lg"
              style={{ 
                backgroundColor: branding.colors.primary,
                animation: "fadeInUp 0.5s ease-out 0.6s both",
              }}
            >
              {ctaText} →
            </a>
            
            {/* Secondary action */}
            <button
              onClick={handleClose}
              className="mt-3 text-sm text-neutral-600 hover:text-neutral-800 transition-colors font-medium"
              style={{ animation: "fadeInUp 0.5s ease-out 0.7s both" }}
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes popupSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

// Helper function to parse EditorJS JSON description
function parseDescription(desc: string | undefined): string {
  if (!desc || desc.trim().length === 0) {
    return "Don't miss out on our biggest sale of the season! Shop now and save on your favorite items.";
  }
  
  // Try to parse as EditorJS JSON format
  try {
    const parsed = JSON.parse(desc) as {
      blocks?: Array<{ type: string; data: { text: string } }>;
    };
    if (parsed.blocks && Array.isArray(parsed.blocks)) {
      // Extract text from all paragraph blocks
      const texts = parsed.blocks
        .filter((block) => block.type === "paragraph")
        .map((block) => {
          // Clean HTML tags and entities
          return block.data.text
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]*>/g, "")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&nbsp;/g, " ");
        });
      return texts.join("\n") || desc;
    }
  } catch {
    // Not JSON, use as plain text
  }
  
  return desc;
}
