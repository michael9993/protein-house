"use client";

import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { useBranding, useContentConfig } from "@/providers/StoreConfigProvider";

interface SaleButtonProps {
  channel: string;
}

export function SaleButton({ channel }: SaleButtonProps) {
  const branding = useBranding();
  const content = useContentConfig();
  const saleText = content.navbar?.saleButton || content.homepage?.onSaleTitle || "Sale";

  return (
    <LinkWithChannel
      href="/products?onSale=true"
      className="group relative flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200"
      style={{
        backgroundColor: "transparent",
        color: branding.colors.error,
        textDecoration: "none",
        border: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.transform = "scale(1.02)";
        e.currentTarget.style.boxShadow = `0 2px 8px ${branding.colors.error}25, 0 0 0 1px ${branding.colors.error}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <span className="relative inline-block font-semibold tracking-wide">
        {saleText}
      </span>
    </LinkWithChannel>
  );
}
