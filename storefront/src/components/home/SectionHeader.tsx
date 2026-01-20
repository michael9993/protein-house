"use client";

import { StoreConfigContext } from "@/providers/StoreConfigProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useContext } from "react";
import { storeConfig } from "@/config";

type SectionType = 
  | "hero" 
  | "categories" 
  | "products" 
  | "sale" 
  | "brands" 
  | "testimonials" 
  | "newsletter"
  | "default";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  type?: SectionType;
  viewAllLink?: string;
  viewAllText?: string;
  align?: "left" | "center" | "right";
  showBadge?: boolean;
  badgeText?: string;
  variant?: "light" | "dark"; // For light/dark backgrounds
}

/**
 * Professional Section Header Component
 * 
 * Unified, customizable section headers with type-specific styling
 * for different homepage sections
 */
export function SectionHeader({
  title,
  subtitle,
  type = "default",
  viewAllLink,
  viewAllText,
  align = "left",
  showBadge = false,
  badgeText,
  variant = "light",
}: SectionHeaderProps) {
  // Safely get context with fallback - use context directly to avoid hook errors
  const context = useContext(StoreConfigContext);
  const config = context || storeConfig;
  
  // Get branding from config
  const branding = config.branding;
  
  // Get content config directly from config object (avoid hooks that might throw)
  const contentConfig = config.content || {
    general: { viewAllButton: "View All" },
    product: { saleBadgeText: "Sale" },
  };
  
  const displayViewAllText = viewAllText || contentConfig.general?.viewAllButton || "View All";
  const isCentered = align === "center";
  const isDark = variant === "dark";

  // Type-specific styling
  const getTypeStyles = () => {
    const baseTitleClass = "relative";
    
    switch (type) {
      case "sale":
        return {
          titleClass: "inline-flex items-center gap-3 flex-wrap",
          badgeClass: "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white",
          badgeStyle: {
            backgroundColor: branding.colors.error,
            boxShadow: `0 4px 12px ${branding.colors.error}40`,
          },
          accentLine: false,
          titleSize: "text-3xl sm:text-4xl lg:text-5xl",
        };
      case "categories":
        return {
          titleClass: baseTitleClass,
          accentLine: true,
          accentWidth: "w-20",
          accentHeight: "h-1.5",
          titleSize: "text-3xl sm:text-4xl lg:text-5xl",
        };
      case "products":
        return {
          titleClass: baseTitleClass,
          accentLine: true,
          accentWidth: "w-16",
          accentHeight: "h-1",
          titleSize: "text-3xl sm:text-4xl lg:text-5xl",
        };
      case "brands":
        return {
          titleClass: baseTitleClass,
          accentLine: true,
          accentWidth: "w-16",
          accentHeight: "h-1",
          titleSize: "text-3xl sm:text-4xl lg:text-5xl",
        };
      case "testimonials":
        return {
          titleClass: baseTitleClass,
          accentLine: true,
          accentWidth: "w-20",
          accentHeight: "h-1.5",
          titleSize: "text-3xl sm:text-4xl lg:text-5xl",
        };
      case "newsletter":
        return {
          titleClass: baseTitleClass,
          accentLine: false,
          titleSize: "text-3xl sm:text-4xl lg:text-5xl",
        };
      default:
        return {
          titleClass: baseTitleClass,
          accentLine: false,
          titleSize: "text-3xl sm:text-4xl lg:text-5xl",
        };
    }
  };

  const typeStyles = getTypeStyles();
  const titleColor = isDark ? "white" : branding.colors.text;
  const subtitleColor = isDark ? "rgba(255, 255, 255, 0.9)" : branding.colors.textMuted;
  const accentColor = isDark ? "white" : branding.colors.primary;

  return (
    <div className={isCentered ? "text-center" : "flex items-end justify-between gap-6"}>
      <div className={isCentered ? "mx-auto max-w-3xl" : "flex-1"}>
        {/* Title with optional badge */}
        <div className={typeStyles.titleClass}>
          <h2 
            className={`${typeStyles.titleSize} font-bold tracking-tight leading-tight`}
            style={{ color: titleColor }}
          >
            <span className="inline-block">{title}</span>
            {showBadge && badgeText && type === "sale" && (
              <span 
                className={`${typeStyles.badgeClass} ml-3`}
                style={typeStyles.badgeStyle}
              >
                {badgeText}
              </span>
            )}
          </h2>
          
          {/* Accent line for certain section types */}
          {typeStyles.accentLine && (
            <div 
              className={`mt-4 ${typeStyles.accentHeight || "h-1"} ${typeStyles.accentWidth || "w-16"} rounded-full transition-all duration-300`}
              style={{ 
                backgroundColor: accentColor,
                marginLeft: isCentered ? "auto" : "0",
                marginRight: isCentered ? "auto" : "0",
                boxShadow: isDark ? `0 2px 8px rgba(255, 255, 255, 0.2)` : `0 2px 8px ${accentColor}30`,
              }}
            />
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p 
            className={`mt-5 text-lg leading-relaxed sm:text-xl font-normal ${isCentered ? "mx-auto max-w-2xl" : "max-w-2xl"}`}
            style={{ color: subtitleColor }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* View All Link (desktop, left-aligned only) */}
      {viewAllLink && !isCentered && (
        <LinkWithChannel
          href={viewAllLink}
          className="hidden items-center gap-2 font-semibold transition-all hover:gap-3 sm:inline-flex group"
          style={{ 
            color: isDark ? "white" : branding.colors.primary,
            textDecoration: "none",
          }}
        >
          <span>{displayViewAllText}</span>
          <svg 
            className="h-5 w-5 transition-transform group-hover:translate-x-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </LinkWithChannel>
      )}
    </div>
  );
}
