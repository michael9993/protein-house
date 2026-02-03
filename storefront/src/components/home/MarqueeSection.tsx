"use client";

import React from "react";
import { useHomepageConfig, useStoreConfig } from "@/providers/StoreConfigProvider";
import { generateSectionBackground, type SectionBackgroundConfig } from "@/lib/section-backgrounds";

export const MarqueeSection = () => {
  const { sections } = useHomepageConfig();
  const { branding } = useStoreConfig();
  const config = sections.marquee;

  if (!config?.enabled) return null;

  // Default values
  const text = config.text || "Free Shipping | Easy Returns";
  const speed = config.speedSeconds || 20;
  const textColor = config.textColor || "inherit";
  
  // Parse text into items
  const items = text.split("|").map(item => item.trim());
  
  // Repeat items enough times to fill width and ensure smooth loop
  const displayItems = [...items, ...items, ...items, ...items];

  // Inline styles for the animation
  const marqueeStyle = {
    "--duration": `${speed}s`,
  } as React.CSSProperties;

  // Generate background styles
  const backgroundConfig = config.background as SectionBackgroundConfig;
  const backgroundStyles = generateSectionBackground(backgroundConfig, branding);

  return (
    <div 
      className="w-full overflow-hidden py-3 border-y border-neutral-200 dark:border-neutral-800"
      style={backgroundStyles}
    >
      <div 
        className="marquee-container flex whitespace-nowrap"
        style={marqueeStyle}
      >
        <div className="animate-marquee flex min-w-full items-center">
          {displayItems.map((item, i) => (
            <span 
              key={i} 
              className="mx-8 text-sm font-medium uppercase tracking-wider"
              style={{ color: textColor || undefined }}
            >
              {item}
            </span>
          ))}
        </div>
        <div className="animate-marquee flex min-w-full items-center" aria-hidden="true">
          {displayItems.map((item, i) => (
            <span 
              key={`clone-${i}`} 
              className="mx-8 text-sm font-medium uppercase tracking-wider"
              style={{ color: textColor || undefined }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .marquee-container {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        .animate-marquee {
          animation: marquee var(--duration) linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};
