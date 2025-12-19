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

// Icon paths for different categories
const categoryIcons: Record<string, string> = {
  "running-shoes": "M13.5 5.5c1 0 3 1.5 3 3.5l-1.5 1.5L13.5 9l-2.5 2.5-1.5-1.5-2.5 2.5-1.5-1.5L7 9.5l-2 2-.5-1.5c0-2 2-3.5 3-3.5L9 8l1.5-1.5L12 8l1.5-2.5z",
  "training-gear": "M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z",
  "sportswear": "M21 3H3v18h18V3zm-9 14H7v-2h5v2zm4-4H7v-2h9v2zm0-4H7V7h9v2z",
  "accessories": "M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14a2 2 0 002 2h8a2 2 0 002-2V2l-1.5 1.5z",
  "basketball": "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
  "soccer": "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
  "tennis": "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
  "swimming": "M22 21c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.08.64-2.19.64-1.11 0-1.73-.37-2.18-.64-.37-.23-.6-.36-1.15-.36s-.78.13-1.15.36c-.46.27-1.08.64-2.19.64v-2c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64 1.11 0 1.73.37 2.18.64.37.22.6.36 1.15.36s.78-.13 1.15-.36c.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36v2z",
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

