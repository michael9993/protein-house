"use client";

import { useEffect, useContext } from "react";
import Link from "next/link";
import { StoreConfigContext } from "@/providers/StoreConfigProvider";
import { storeConfig } from "@/config";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Safely get context with fallback - use context directly to avoid hook errors
  const context = useContext(StoreConfigContext);
  const config = context || storeConfig;
  
  const brandingConfig = config.branding;
  const contentConfig = config.content || {
    error: {
      title: "Something went wrong",
      description: "We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.",
      errorDetails: "Error details",
      tryAgainButton: "Try Again",
      backToHomeButton: "Back to Home",
      needHelpText: "Need help?",
      contactSupportLink: "Contact our support team",
    },
  };
  const errorText = contentConfig.error || {
    title: "Something went wrong",
    description: "We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.",
    errorDetails: "Error details",
    tryAgainButton: "Try Again",
    backToHomeButton: "Back to Home",
    needHelpText: "Need help?",
    contactSupportLink: "Contact our support team",
  };

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        {/* Error Illustration */}
        <div className="relative mx-auto mb-8 h-48 w-48">
          <svg
            className="h-full w-full"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Warning triangle */}
            <path
              d="M100 30L175 160H25L100 30Z"
              fill="#FEF3C7"
              stroke="#F59E0B"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <text
              x="100"
              y="125"
              textAnchor="middle"
              fill="#F59E0B"
              fontSize="60"
              fontWeight="bold"
              fontFamily="system-ui"
            >
              !
            </text>
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
          {errorText.title}
        </h1>
        <p className="mt-4 text-neutral-600">
          {errorText.description}
        </p>

        {/* Error Details (in development) */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-700">
              {errorText.errorDetails}
            </summary>
            <pre className="mt-2 max-w-lg overflow-auto rounded-lg bg-neutral-100 p-4 text-xs text-red-600">
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: brandingConfig.colors.primary }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {errorText.tryAgainButton}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border-2 px-8 py-3 text-sm font-semibold transition-colors hover:bg-neutral-50"
            style={{ 
              borderColor: brandingConfig.colors.primary,
              color: brandingConfig.colors.primary,
            }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {errorText.backToHomeButton}
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-12 text-sm text-neutral-500">
          <p>
            {errorText.needHelpText}{" "}
            <Link 
              href="/contact" 
              className="font-medium hover:underline"
              style={{ color: brandingConfig.colors.primary }}
            >
              {errorText.contactSupportLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
