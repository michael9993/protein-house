import React from "react";
import type { StoreConfig } from "@/config/store.config";

/**
 * Section background configuration type
 */
export interface SectionBackgroundConfig {
  style: 'none' | 'solid' | 'gradient' | 'radial-gradient' | 'color-mix' | 'pattern' | 'animated-gradient' | 'glass' | 'mesh';
  color?: string | null;
  secondaryColor?: string | null;
  mixPercentage?: number;
  gradientDirection?: 'to-right' | 'to-left' | 'to-bottom' | 'to-top' | 'to-bottom-right' | 'to-top-left' | 'diagonal';
  patternType?: 'grid' | 'dots' | 'lines' | 'waves';
  patternOpacity?: number;
  animationSpeed?: 'slow' | 'normal' | 'fast';
  glassBlur?: number;
  glassOpacity?: number;
  meshOpacity?: number;
  meshGrade?: 'light' | 'medium' | 'deep' | 'cool' | 'warm';
}

/**
 * Generate CSS styles for section background based on config
 */
export function generateSectionBackground(
  config: SectionBackgroundConfig | undefined,
  branding: StoreConfig['branding']
): React.CSSProperties {
  if (!config || config.style === 'none') {
    // Default: use transparent/white to be cleaner and "less orange"
    // The previous default used branding.colors.background which caused the tint issue
    return {
      backgroundColor: 'transparent',
    };
  }

  const styles: React.CSSProperties = {};

  switch (config.style) {
    case 'solid':
      styles.backgroundColor = config.color || branding.colors.surface;
      break;

    case 'gradient':
      const direction = config.gradientDirection || 'to-right';
      const directionMap: Record<string, string> = {
        'to-right': 'to right',
        'to-left': 'to left',
        'to-bottom': 'to bottom',
        'to-top': 'to top',
        'to-bottom-right': 'to bottom right',
        'to-top-left': 'to top left',
        'diagonal': '135deg',
      };
      const gradientDir = directionMap[direction] || 'to right';
      styles.background = `linear-gradient(${gradientDir}, ${config.color || branding.colors.primary}, ${config.secondaryColor || branding.colors.secondary})`;
      break;

    case 'radial-gradient':
      styles.background = `radial-gradient(circle, ${config.color || branding.colors.primary}, ${config.secondaryColor || branding.colors.secondary})`;
      break;

    case 'color-mix':
      const mixPct = config.mixPercentage ?? 4;
      // Use color-mix to blend primary color with background at specified percentage
      // This creates the premium-band effect
      const primaryColor = config.color || branding.colors.primary;
      // Use white for "more towards white" mix target instead of theme background which might be tinted
      const secondaryColor = config.secondaryColor || '#ffffff';
      styles.backgroundColor = `color-mix(in srgb, ${primaryColor} ${mixPct}%, ${secondaryColor})`;
      break;

    case 'pattern':
      // Pattern is handled via overlay div, just set base background
      styles.backgroundColor = config.color || branding.colors.surface;
      break;

    case 'animated-gradient':
      const animSpeed = config.animationSpeed || 'normal';
      const speedMap: Record<string, string> = {
        slow: '8s',
        normal: '5s',
        fast: '3s',
      };
      const duration = speedMap[animSpeed] || '5s';
      styles.background = `linear-gradient(270deg, ${config.color || branding.colors.primary}, ${config.secondaryColor || branding.colors.accent}, ${config.color || branding.colors.primary})`;
      styles.backgroundSize = '200% 200%';
      styles.animation = `gradientShift ${duration} ease infinite`;
      // Add @keyframes if not already in CSS (it should be in globals.css)
      break;

    case 'glass':
      const blur = config.glassBlur ?? 10;
      const opacity = (config.glassOpacity ?? 80) / 100;
      styles.backgroundColor = config.color
        ? `rgba(${hexToRgb(config.color)}, ${opacity})`
        : `rgba(255, 255, 255, ${opacity})`;
      styles.backdropFilter = `blur(${blur}px)`;
      styles.WebkitBackdropFilter = `blur(${blur}px)`;
      break;

    case 'mesh':
      // Aurora/Mesh gradient effect
      // Uses radial gradients to create soft, moving spots of color
      const base = branding.colors.background;
      // Use provided colors, or defaults based on grade, or branding
      let p = config.color || branding.colors.primary;
      let s = config.secondaryColor || branding.colors.secondary;

      // Override colors based on Mesh Grade if no specific color provided
      if (!config.color && config.meshGrade) {
        switch (config.meshGrade) {
          case 'light': p = '#f3f4f6'; s = '#e5e7eb'; break; // grayscale light
          case 'cool': p = '#dbeafe'; s = '#e0f2fe'; break; // blue/sky
          case 'warm': p = '#ffedd5'; s = '#fee2e2'; break; // orange/red
          case 'deep': p = branding.colors.primary; s = branding.colors.secondary; break; // standard brand
          case 'medium': p = branding.colors.secondary; s = branding.colors.accent; break; // secondary brand
        }
      }

      // Convert opacity 0-100 to hex alpha (00-FF)
      const meshOp = config.meshOpacity ?? 15; // default 15
      // Format number to 2-digit hex
      const alpha = Math.round((meshOp / 100) * 255).toString(16).padStart(2, '0');

      styles.backgroundColor = '#ffffff';
      styles.backgroundImage = `
        radial-gradient(at 0% 0%, ${p}${alpha} 0px, transparent 55%),
        radial-gradient(at 100% 0%, ${s}${alpha} 0px, transparent 55%),
        radial-gradient(at 100% 100%, ${p}${alpha} 0px, transparent 55%),
        radial-gradient(at 0% 100%, ${s}${alpha} 0px, transparent 55%)
      `;
      break;

    default:
      styles.backgroundColor = 'transparent';
  }

  return styles;
}

/**
 * Generate pattern overlay configuration
 */
export function generatePatternOverlay(
  config: SectionBackgroundConfig | undefined,
  branding: StoreConfig['branding']
): { patternId: string } | null {
  if (!config || config.style !== 'pattern' || !config.patternType) {
    return null;
  }

  // Generate unique pattern ID based on pattern type
  const patternId = `pattern-${config.patternType}-${Math.random().toString(36).substr(2, 9)}`;

  return { patternId };
}

/**
 * Helper to convert hex color to RGB
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
