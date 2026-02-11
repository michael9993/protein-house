"use client";

import { useBranding, useMarqueeConfig } from "@/providers/StoreConfigProvider";

interface MarqueeProps {
  items: string[];
}

const DEFAULTS = {
  enabled: true,
  speedSeconds: 30,
  textColor: null as string | null,
};

/**
 * Marquee — Infinite scrolling text strip.
 *
 * Uses the Ryan Mulligan pattern (https://ryanmulligan.dev/blog/css-marquee/).
 * CSS lives in globals.css under .marquee / .marquee__content.
 *
 * Key: each copy independently animates translateX(calc(-100% - gap)).
 * The marquee container is forced to dir="ltr" so the flex layout always
 * puts Copy A on the left and Copy B on the right, regardless of page
 * direction (fixes RTL/Hebrew pages where flex would reverse the order).
 *
 * Speed and colors from Storefront Control via useMarqueeConfig().
 * Items (brand names + categories) passed from HomePage.tsx.
 */
export function Marquee({ items }: MarqueeProps) {
  const { colors } = useBranding();
  const config = useMarqueeConfig();

  const enabled = config?.enabled ?? DEFAULTS.enabled;
  const speed = config?.speedSeconds ?? DEFAULTS.speedSeconds;
  const textColor = config?.textColor ?? null;

  if (!enabled || items.length === 0) return null;

  // Repeat items so each copy overflows any viewport width
  const minRepeats = Math.max(2, Math.ceil(24 / items.length));
  const repeated: string[] = [];
  for (let r = 0; r < minRepeats; r++) {
    repeated.push(...items);
  }

  const renderItems = (list: string[], keyPrefix: string) =>
    list.map((text, i) => (
      <span
        key={`${keyPrefix}-${i}`}
        className="inline-flex shrink-0 items-center gap-4 px-4 text-sm font-bold uppercase tracking-[0.2em]"
        style={{ color: i % 2 === 0 ? (textColor ?? "#ffffff") : colors.accent }}
      >
        {text}
        <span className="h-1 w-1 rounded-full bg-neutral-600" aria-hidden="true" />
      </span>
    ));

  return (
    <section
      className="py-4 border-y border-neutral-800"
      aria-label="Brand marquee"
    >
      {/* .marquee class in globals.css: flex, overflow:hidden, gap, dir:ltr */}
      <div className="marquee" style={{ "--marquee-speed": `${speed}s` } as React.CSSProperties}>
        {/* Copy A */}
        <div className="marquee__content">
          {renderItems(repeated, "a")}
        </div>
        {/* Copy B — identical, seamless loop */}
        <div className="marquee__content" aria-hidden="true">
          {renderItems(repeated, "b")}
        </div>
      </div>
    </section>
  );
}
