"use client";

/**
 * PromoPopupLoader - Client component that wraps PromoPopup
 * 
 * This component receives pre-fetched sale data from the server
 * and renders the PromoPopup client-side to avoid hydration issues.
 */

import { PromoPopup } from "./PromoPopup";

interface PromoPopupLoaderProps {
  channel: string;
  saleProductCount: number;
  currencyCode?: string;
  maxDiscountPercent?: number;
  /** Description from the "sale" collection */
  description?: string;
  /** Promotion name from collection metadata (key: "Promotion") */
  promotionName?: string;
  /** Background image from the "sale" collection */
  backgroundImage?: { url: string; alt: string } | null;
  /** Sale end date from collection metadata (key: "EndDate") */
  saleEndDate?: string | null;
}

export function PromoPopupLoader({
  channel,
  saleProductCount,
  currencyCode,
  maxDiscountPercent,
  description,
  promotionName,
  backgroundImage,
  saleEndDate,
}: PromoPopupLoaderProps) {
  return (
    <PromoPopup
      channel={channel}
      saleProductCount={saleProductCount}
      currencyCode={currencyCode}
      discountPercent={maxDiscountPercent}
      description={description}
      promotionName={promotionName}
      backgroundImage={backgroundImage}
      saleEndDate={saleEndDate}
    />
  );
}
