"use client";

import Link from "next/link";
import { useContext, useMemo } from "react";
import { StoreConfigContext } from "@/providers/StoreConfigProvider";
import { storeConfig, DEFAULT_NOT_FOUND_TEXT } from "@/config";

/**
 * Extract the channel slug from the current URL path.
 * URLs follow the pattern /{channel}/... so the channel is the first segment.
 * Falls back to the default channel env var.
 */
function useChannel(): string {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return process.env.NEXT_PUBLIC_DEFAULT_CHANNEL || "default-channel";
    }
    const segments = window.location.pathname.split("/").filter(Boolean);
    // The first segment is the channel (e.g., "usd", "default-channel")
    return segments[0] || process.env.NEXT_PUBLIC_DEFAULT_CHANNEL || "default-channel";
  }, []);
}

export function NotFoundClient() {
  const contextConfig = useContext(StoreConfigContext);
  const channel = useChannel();
  const primary =
    contextConfig?.branding?.colors?.primary || storeConfig.branding.colors.primary;
  const notFoundText = contextConfig?.content?.notFound || DEFAULT_NOT_FOUND_TEXT;

  // Link labels from config with defaults
  const categoriesLabel =
    (notFoundText as Record<string, string>).categoriesLinkText || "Categories";
  const collectionsLabel =
    (notFoundText as Record<string, string>).collectionsLinkText || "Collections";
  const aboutUsLabel =
    (notFoundText as Record<string, string>).aboutUsLinkText || "About Us";
  const contactLabel =
    (notFoundText as Record<string, string>).contactLinkText || "Contact";

  /** Prefix a relative path with the channel */
  const ch = (path: string) => `/${channel}${path}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="mx-auto w-full max-w-lg text-center">
        {/* Error code */}
        <p
          className="text-8xl font-black tracking-tighter"
          style={{ color: primary }}
        >
          404
        </p>

        {/* Title */}
        <h1 className="mt-6 text-3xl font-black uppercase italic tracking-tighter text-neutral-900 sm:text-4xl">
          {notFoundText.title}
        </h1>

        {/* Description */}
        <p className="mt-4 text-sm leading-relaxed text-neutral-500">
          {notFoundText.description}
        </p>

        {/* Divider */}
        <div className="mx-auto mt-8 h-px w-12 bg-neutral-200" />

        {/* Action buttons */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={ch("/")}
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {notFoundText.backToHomeButton}
          </Link>
          <Link
            href={ch("/products")}
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
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            {notFoundText.browseProductsButton}
          </Link>
        </div>

        {/* Helpful links — all labels from config */}
        <div className="mt-12 border-t border-neutral-200 pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
            {notFoundText.helpfulLinksText}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link
              href={ch("/products")}
              className="text-sm font-medium text-neutral-700 underline-offset-2 hover:underline"
            >
              {categoriesLabel}
            </Link>
            <Link
              href={ch("/products")}
              className="text-sm font-medium text-neutral-700 underline-offset-2 hover:underline"
            >
              {collectionsLabel}
            </Link>
            <Link
              href={ch("/about")}
              className="text-sm font-medium text-neutral-700 underline-offset-2 hover:underline"
            >
              {aboutUsLabel}
            </Link>
            <Link
              href={ch("/contact")}
              className="text-sm font-medium text-neutral-700 underline-offset-2 hover:underline"
            >
              {contactLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
