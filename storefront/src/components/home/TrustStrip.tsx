"use client";

import { Truck, RotateCcw, ShieldCheck, Headphones } from "lucide-react";
import { useBranding, useEcommerceSettings, useTrustStripConfig, useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { formatMoney } from "@/lib/utils";

/**
 * TrustStrip - Display trust indicators (shipping, returns, security, support)
 * Configurable via Storefront Control.
 */
export function TrustStrip() {
  const { colors } = useBranding();
  const ecommerce = useEcommerceSettings();
  const config = useTrustStripConfig();
  const cdStyle = useComponentStyle("homepage.trustStrip");
  const cdClasses = useComponentClasses("homepage.trustStrip");

  // Use config values with fallback chain
  const enabled = config?.enabled ?? true;

  // Hide if explicitly disabled
  if (!enabled) return null;

  const threshold = ecommerce.shipping?.freeShippingThreshold;
  const currency = ecommerce.currency?.default ?? "USD";

  // Generate shipping text: config override > dynamic threshold > generic fallback
  const defaultShippingText = threshold
    ? `Free shipping over ${formatMoney(threshold, currency)}`
    : "Free shipping available";

  const freeShippingText = config?.freeShippingText ?? defaultShippingText;
  const easyReturnsText = config?.easyReturnsText ?? "Easy returns";
  const secureCheckoutText = config?.secureCheckoutText ?? "Secure checkout";
  const supportText = config?.supportText ?? "24/7 support";

  const items = [
    { icon: Truck, text: freeShippingText },
    { icon: RotateCcw, text: easyReturnsText },
    { icon: ShieldCheck, text: secureCheckoutText },
    { icon: Headphones, text: supportText },
  ];

  return (
    <section
      data-cd="homepage-trustStrip"
      className={`border-b border-neutral-100 ${cdClasses}`}
      aria-label="Trust indicators"
      style={{
        ...(cdStyle?.backgroundColor && { background: `var(--cd-homepage-trustStrip-bg)` }),
        ...(cdStyle?.textColor && { color: `var(--cd-homepage-trustStrip-text)` }),
      }}
    >
      <div className="mx-auto max-w-[var(--design-container-max)] px-6 py-5 lg:px-12">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 md:justify-between">
          {items.map((item) => (
            <div key={item.text} className="flex items-center gap-2.5 text-sm font-medium text-neutral-700">
              <item.icon size={16} strokeWidth={2} style={{ color: colors.primary }} aria-hidden="true" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
