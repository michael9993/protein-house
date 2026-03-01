"use client";

import { useState } from "react";
import type { ProductAttribute } from "./types";
import { ProductAttributes } from "./ProductAttributes";
import { ReviewList, ReviewForm } from "@/ui/components/ProductReviews";
import {
  isDropshipProduct,
  getProductShippingEstimate,
  formatEstimate,
  type ShippingEstimate,
} from "@/lib/shipping";

interface Props {
  productId: string;
  description: string | null;
  productAttributes: ProductAttribute[];
  primaryColor: string;
  reviewsEnabled: boolean;
  rating: number;
  reviewCount: number;
  metadata?: Array<{ key: string; value: string }>;
  text: {
    descriptionTab: string;
    specificationsTab?: string;
    shippingTab: string;
    reviewsTab: string;
    noDescriptionAvailable: string;
    noSpecifications?: string;
    freeStandardShippingTitle: string;
    freeStandardShippingDescription: string;
    expressShippingTitle: string;
    expressShippingDescription: string;
    writeReviewButton: string;
    shippingEstimatedDelivery?: string;
    shippingFreeLabel?: string;
    shippingProcessingTime?: string;
    shippingTrackingNotice?: string;
    shippingWarehouseNotice?: string;
    shippingReturnPolicyNote?: string;
    shippingCarrierLabel?: string;
    shippingExtendedReturnNote?: string;
  };
}

type TabId = "description" | "specifications" | "shipping" | "reviews";

export function ProductTabs({
  productId,
  description,
  productAttributes,
  primaryColor,
  reviewsEnabled,
  rating,
  reviewCount,
  metadata,
  text,
}: Props) {
  const hasVisibleAttributes = productAttributes.some(
    (a) => a.attribute.visibleInStorefront
  );

  const tabs: { id: TabId; label: string }[] = [
    { id: "description", label: text.descriptionTab },
    ...(hasVisibleAttributes
      ? [{ id: "specifications" as TabId, label: text.specificationsTab || "Specifications" }]
      : []),
    { id: "shipping", label: text.shippingTab },
    ...(reviewsEnabled ? [{ id: "reviews" as TabId, label: text.reviewsTab }] : []),
  ];

  const [activeTab, setActiveTab] = useState<TabId>("description");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const isDropship = isDropshipProduct(metadata);
  const shippingEstimate = getProductShippingEstimate(metadata);

  return (
    <div className="mt-8 border-t border-neutral-200 pt-8">
      {/* Tab headers */}
      <div className="flex gap-8 border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative pb-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-neutral-900"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span
                className="absolute bottom-0 start-0 h-0.5 w-full transition-all duration-200"
                style={{ backgroundColor: primaryColor }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === "description" && (
          <div className="prose prose-sm max-w-none text-neutral-600">
            {description ? (
              <div dangerouslySetInnerHTML={{ __html: description }} />
            ) : (
              <p>{text.noDescriptionAvailable}</p>
            )}
          </div>
        )}

        {activeTab === "specifications" && (
          <ProductAttributes
            attributes={productAttributes}
            noSpecificationsText={text.noSpecifications}
          />
        )}

        {activeTab === "shipping" && (
          <div className="space-y-4 text-sm text-neutral-600">
            {isDropship ? (
              <DropshipShippingContent estimate={shippingEstimate} text={text} />
            ) : (
              <RegularShippingContent text={text} />
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div>
            {showReviewForm ? (
              <div className="mb-6">
                <ReviewForm
                  productId={productId}
                  onSuccess={() => setShowReviewForm(false)}
                  onCancel={() => setShowReviewForm(false)}
                />
              </div>
            ) : (
              <div className="mb-6 text-end">
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {text.writeReviewButton}
                </button>
              </div>
            )}
            <ReviewList
              productId={productId}
              averageRating={rating}
              reviewCount={reviewCount}
              onReviewSubmit={() => setShowReviewForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Regular shipping content (existing behavior) ─── */

function RegularShippingContent({ text }: { text: Props["text"] }) {
  return (
    <>
      <div className="flex items-start gap-3">
        <CheckIcon />
        <div>
          <p className="font-medium text-neutral-900">{text.freeStandardShippingTitle}</p>
          <p>{text.freeStandardShippingDescription}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <CheckIcon />
        <div>
          <p className="font-medium text-neutral-900">{text.expressShippingTitle}</p>
          <p>{text.expressShippingDescription.replace("{price}", "$12.99")}</p>
        </div>
      </div>
    </>
  );
}

/* ─── Dropship shipping content (metadata-driven) ─── */

function DropshipShippingContent({
  estimate,
  text,
}: {
  estimate: ShippingEstimate | null;
  text: Props["text"];
}) {
  // Fall back to 7-21 days if no per-product metadata
  const effectiveEstimate = estimate ?? { minDays: 7, maxDays: 21 };
  const days = formatEstimate(effectiveEstimate);

  return (
    <>
      {/* Estimated Delivery */}
      <div className="flex items-start gap-3">
        <TruckIcon />
        <div>
          <p className="font-medium text-neutral-900">
            {(text.shippingEstimatedDelivery ?? "Estimated delivery: {days} business days").replace("{days}", days)}
          </p>
        </div>
      </div>

      {/* Free Shipping */}
      <div className="flex items-start gap-3">
        <CheckIcon />
        <div>
          <p className="font-medium text-neutral-900">
            {text.shippingFreeLabel ?? "Free Shipping"}
          </p>
        </div>
      </div>

      {/* Processing Time */}
      <div className="flex items-start gap-3">
        <ClockIcon />
        <div>
          <p className="text-neutral-700">
            {text.shippingProcessingTime ?? "Processing time: 1-3 business days"}
          </p>
        </div>
      </div>

      {/* Tracking Notification */}
      <div className="flex items-start gap-3">
        <BellIcon />
        <div>
          <p className="text-neutral-700">
            {text.shippingTrackingNotice ?? "You'll receive tracking information via email once your order ships"}
          </p>
        </div>
      </div>

      {/* Carrier (if available) */}
      {effectiveEstimate.carrier && (
        <div className="flex items-start gap-3">
          <PackageIcon />
          <div>
            <p className="text-neutral-700">
              {(text.shippingCarrierLabel ?? "Carrier: {carrier}").replace("{carrier}", effectiveEstimate.carrier!)}
            </p>
          </div>
        </div>
      )}

      {/* International Warehouse Notice */}
      <div className="mt-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
        <div className="flex items-start gap-3">
          <GlobeIcon />
          <p className="text-xs text-neutral-500">
            {text.shippingWarehouseNotice ?? "This item ships from our international fulfillment center"}
          </p>
        </div>
      </div>

      {/* Return Policy */}
      <div className="mt-2 space-y-1 border-t border-neutral-100 pt-4">
        <p className="text-neutral-700">
          {text.shippingReturnPolicyNote ?? "Returns accepted within 30 days of delivery"}
        </p>
        <p className="text-xs text-neutral-500">
          {text.shippingExtendedReturnNote ?? "Please note: return shipping for international items may take additional time"}
        </p>
      </div>
    </>
  );
}

/* ─── SVG Icon helpers ─── */

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
      <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
      <circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
