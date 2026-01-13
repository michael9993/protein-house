"use client";

import { useMemo } from "react";

interface PlaceholderImageProps {
  width?: number;
  height?: number;
  text?: string;
  category?: "hero" | "category" | "product" | "brand" | "avatar";
  variant?: number;
  className?: string;
}

// Color schemes for different categories
const colorSchemes = {
  hero: [
    { from: "#1a1a2e", to: "#16213e", accent: "#FF4500" },
    { from: "#0f0f23", to: "#1a1a2e", accent: "#00D4FF" },
    { from: "#1e3a5f", to: "#0d1b2a", accent: "#f72585" },
  ],
  category: [
    { from: "#667eea", to: "#764ba2", accent: "#ffffff" },
    { from: "#f093fb", to: "#f5576c", accent: "#ffffff" },
    { from: "#4facfe", to: "#00f2fe", accent: "#ffffff" },
    { from: "#43e97b", to: "#38f9d7", accent: "#ffffff" },
    { from: "#fa709a", to: "#fee140", accent: "#ffffff" },
    { from: "#a8edea", to: "#fed6e3", accent: "#333333" },
    { from: "#ff9a9e", to: "#fecfef", accent: "#333333" },
    { from: "#ffecd2", to: "#fcb69f", accent: "#333333" },
  ],
  product: [
    { from: "#f5f7fa", to: "#c3cfe2", accent: "#333333" },
    { from: "#e0e5ec", to: "#f5f5f5", accent: "#333333" },
  ],
  brand: [
    { from: "#ffffff", to: "#f0f0f0", accent: "#333333" },
  ],
  avatar: [
    { from: "#667eea", to: "#764ba2", accent: "#ffffff" },
    { from: "#f093fb", to: "#f5576c", accent: "#ffffff" },
    { from: "#4facfe", to: "#00f2fe", accent: "#ffffff" },
    { from: "#43e97b", to: "#38f9d7", accent: "#ffffff" },
  ],
};

/**
 * PlaceholderImage Component
 * 
 * Generates beautiful gradient placeholder images for development.
 * Replace with actual images in production.
 */
export function PlaceholderImage({
  width = 400,
  height = 300,
  text,
  category = "product",
  variant = 0,
  className = "",
}: PlaceholderImageProps) {
  const scheme = useMemo(() => {
    const schemes = colorSchemes[category];
    return schemes[variant % schemes.length];
  }, [category, variant]);

  const gradientId = useMemo(() => `grad-${category}-${variant}`, [category, variant]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={scheme.from} />
          <stop offset="100%" stopColor={scheme.to} />
        </linearGradient>
      </defs>
      
      {/* Background */}
      <rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      
      {/* Decorative circles */}
      <circle 
        cx={width * 0.8} 
        cy={height * 0.3} 
        r={Math.min(width, height) * 0.2} 
        fill={scheme.accent} 
        opacity="0.1" 
      />
      <circle 
        cx={width * 0.2} 
        cy={height * 0.7} 
        r={Math.min(width, height) * 0.15} 
        fill={scheme.accent} 
        opacity="0.1" 
      />
      
      {/* Category icon or text */}
      {text && (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={scheme.accent}
          fontSize={Math.min(width, height) * 0.08}
          fontFamily="system-ui, sans-serif"
          fontWeight="600"
        >
          {text}
        </text>
      )}
    </svg>
  );
}

/**
 * Generate a data URL for placeholder images
 * Useful for Image component src fallbacks
 */
export function generatePlaceholderDataUrl(
  width: number,
  height: number,
  category: "hero" | "category" | "product" | "brand" | "avatar" = "product",
  variant: number = 0
): string {
  const schemes = colorSchemes[category];
  const scheme = schemes[variant % schemes.length];
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${scheme.from}"/>
          <stop offset="100%" stop-color="${scheme.to}"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="${width * 0.8}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.2}" fill="${scheme.accent}" opacity="0.1"/>
    </svg>
  `.trim();
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default PlaceholderImage;

