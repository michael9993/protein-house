"use client";

import { useEffect, useContext } from "react";
import { StoreConfigContext } from "@/providers/StoreConfigProvider";
import { storeConfig } from "@/config";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

/**
 * Channel-level error boundary.
 * Lives inside (main)/layout.tsx which mounts StoreConfigProvider,
 * so it gets the correct per-channel config (Hebrew for ILS, English for USD).
 * The root error.tsx is kept as a last-resort fallback for errors outside channel routes.
 */
export default function ChannelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const context = useContext(StoreConfigContext);
  const config = context || storeConfig;

  const primary = config.branding.colors.primary;
  const errorText = config.content?.error || {
    title: "Something went wrong",
    description:
      "We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.",
    errorDetails: "Error details",
    tryAgainButton: "Try Again",
    backToHomeButton: "Back to Home",
    needHelpText: "Need help?",
    contactSupportLink: "Contact our support team",
  };

  const contactUrl =
    (errorText as Record<string, string>).contactSupportUrl || "/contact";
  const errorCode =
    (errorText as Record<string, string>).errorCode || "Error";

  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white px-6 py-20">
      <div className="mx-auto w-full max-w-lg text-center">
        {/* Error code label */}
        <p
          className="text-xs font-bold uppercase tracking-[0.3em]"
          style={{ color: primary }}
        >
          {errorCode}
        </p>

        {/* Title */}
        <h1 className="mt-4 text-3xl font-black uppercase italic tracking-tighter text-neutral-900 sm:text-4xl">
          {errorText.title}
        </h1>

        {/* Description */}
        <p className="mt-4 text-sm leading-relaxed text-neutral-500">
          {errorText.description}
        </p>

        {/* Error Details (development only) */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-start">
            <summary className="cursor-pointer text-xs font-medium text-neutral-400 hover:text-neutral-600">
              {errorText.errorDetails}
            </summary>
            <pre className="mt-2 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs text-red-600">
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        {/* Divider */}
        <div className="mx-auto mt-8 h-px w-12 bg-neutral-200" />

        {/* Action buttons */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {errorText.tryAgainButton}
          </button>
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
            {errorText.backToHomeButton}
          </LinkWithChannel>
        </div>

        {/* Support link — navigates to configurable contact URL */}
        <p className="mt-10 text-xs text-neutral-400">
          {errorText.needHelpText}{" "}
          <LinkWithChannel
            href={contactUrl}
            className="font-semibold underline underline-offset-2 transition-colors hover:text-neutral-600"
            style={{ color: primary }}
          >
            {errorText.contactSupportLink}
          </LinkWithChannel>
        </p>
      </div>
    </div>
  );
}
