"use client";

import { type ReactNode } from "react";
import { generateSectionBackground, type SectionBackgroundConfig } from "@/lib/section-backgrounds";
import { useBranding } from "@/providers/StoreConfigProvider";

interface BackgroundSectionProps {
  children: ReactNode;
  /** Background configuration from section config */
  background?: SectionBackgroundConfig | null;
  /** Additional className for the section */
  className?: string;
  /** Section aria-label for accessibility */
  ariaLabel?: string;
  /** HTML tag to use (section or div) */
  as?: "section" | "div";
}

/**
 * BackgroundSection - Wrapper that applies configurable background styling
 *
 * Uses the background config from Storefront Control to apply:
 * - Solid colors
 * - Gradients (linear, radial)
 * - Color-mix (subtle brand tint)
 * - Patterns (grid, dots, lines, waves)
 * - Animated gradients
 * - Glass morphism
 * - Mesh gradients
 */
export function BackgroundSection({
  children,
  background,
  className = "",
  ariaLabel,
  as: Tag = "section",
}: BackgroundSectionProps) {
  const branding = useBranding();

  // Handle both string and object logo formats
  const logoUrl = typeof branding.logo === 'string'
    ? branding.logo
    : (branding.logo as { url?: string } | undefined)?.url || "";

  // Generate background styles from config
  const backgroundStyles = generateSectionBackground(background ?? undefined, {
    colors: branding.colors,
    logo: logoUrl,
    logoAlt: branding.logoAlt || "",
    favicon: "",
    typography: {
      fontHeading: "",
      fontBody: "",
      fontMono: "",
    },
    style: {
      borderRadius: "md",
      buttonStyle: "solid",
      cardShadow: "md",
    },
  });

  // Pattern overlay for pattern backgrounds
  const showPattern = background?.style === "pattern" && background.patternType;
  const patternOpacity = (background?.patternOpacity ?? 10) / 100;

  return (
    <Tag
      className={`relative ${className}`}
      style={backgroundStyles}
      aria-label={ariaLabel}
    >
      {/* Pattern overlay */}
      {showPattern && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: patternOpacity,
            backgroundImage: getPatternBackground(background.patternType!, branding.colors.primary),
          }}
          aria-hidden="true"
        />
      )}
      {/* Content */}
      <div className="relative">{children}</div>
    </Tag>
  );
}

/**
 * Generate SVG pattern background
 */
function getPatternBackground(type: string, color: string): string {
  const safeColor = encodeURIComponent(color);

  switch (type) {
    case "grid":
      return `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${safeColor}' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`;
    case "dots":
      return `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='${safeColor}'/%3E%3C/svg%3E")`;
    case "lines":
      return `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20h40' stroke='${safeColor}' stroke-width='1' fill='none'/%3E%3C/svg%3E")`;
    case "waves":
      return `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10c25-10 25 10 50 0s25-10 50 0' stroke='${safeColor}' stroke-width='1' fill='none'/%3E%3C/svg%3E")`;
    default:
      return "";
  }
}

export default BackgroundSection;
