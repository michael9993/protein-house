"use client";

import { useState } from "react";
import type { ProductAttribute } from "./types";
import { ProductAttributes } from "./ProductAttributes";
import { ReviewList, ReviewForm } from "@/ui/components/ProductReviews";

interface Props {
  productId: string;
  description: string | null;
  productAttributes: ProductAttribute[];
  primaryColor: string;
  reviewsEnabled: boolean;
  rating: number;
  reviewCount: number;
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
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-neutral-900">{text.freeStandardShippingTitle}</p>
                <p>{text.freeStandardShippingDescription}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-neutral-900">{text.expressShippingTitle}</p>
                <p>{text.expressShippingDescription.replace("{price}", "$12.99")}</p>
              </div>
            </div>
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
