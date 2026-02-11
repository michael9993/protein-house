"use client";

import { useContext } from "react";
import { StoreConfigContext } from "@/providers/StoreConfigProvider";
import { storeConfig, DEFAULT_NOT_FOUND_TEXT } from "@/config";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

export default function NotFound() {
  const contextConfig = useContext(StoreConfigContext);
  const primary =
    contextConfig?.branding?.colors?.primary || storeConfig.branding.colors.primary;
  const notFoundText = contextConfig?.content?.notFound || DEFAULT_NOT_FOUND_TEXT;

  const productTitle =
    (notFoundText as Record<string, string>).productNotFoundTitle || "Product Not Found";
  const productDescription =
    (notFoundText as Record<string, string>).productNotFoundDescription ||
    "The product you're looking for doesn't exist or has been removed.";
  const backButton =
    (notFoundText as Record<string, string>).productNotFoundBackButton || "Back to Products";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white px-6 py-20">
      <div className="mx-auto w-full max-w-lg text-center">
        {/* Error code */}
        <p
          className="text-7xl font-black tracking-tighter"
          style={{ color: primary }}
        >
          404
        </p>

        {/* Title */}
        <h1 className="mt-4 text-2xl font-black uppercase italic tracking-tighter text-neutral-900 sm:text-3xl">
          {productTitle}
        </h1>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-neutral-500">
          {productDescription}
        </p>

        {/* Divider */}
        <div className="mx-auto mt-6 h-px w-12 bg-neutral-200" />

        {/* Action buttons */}
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <LinkWithChannel
            href="/products"
            className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            {backButton}
          </LinkWithChannel>
          <LinkWithChannel
            href="/"
            className="inline-flex items-center gap-2 rounded-full border-2 px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors hover:bg-neutral-50"
            style={{ borderColor: primary, color: primary }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {notFoundText.backToHomeButton}
          </LinkWithChannel>
        </div>
      </div>
    </div>
  );
}
