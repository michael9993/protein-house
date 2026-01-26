"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBranding } from "@/providers/StoreConfigProvider";

/**
 * Unsubscribe page client component
 * 
 * The unsubscribe flow works as follows:
 * 1. User clicks unsubscribe link in email (points to newsletter app API)
 * 2. Newsletter app API processes the unsubscribe request
 * 3. API redirects to this page with ?success=true
 * 4. This page displays the success message
 * 
 * This page may also receive direct visits with a token for backwards compatibility
 * or if the user bookmarked an old link.
 */
export function UnsubscribeClient() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const branding = useBranding();

  useEffect(() => {
    // Check for success flag (redirected from newsletter app API)
    if (success === "true") {
      setStatus("success");
      return;
    }

    // Check for error flag
    if (error) {
      setStatus("error");
      setErrorMessage(decodeURIComponent(error) || "An error occurred while processing your request.");
      return;
    }

    // If no flags, show a generic message
    // This could happen if someone visits the page directly
    setStatus("error");
    setErrorMessage("Invalid unsubscribe link. Please use the link from your email to unsubscribe.");
  }, [success, error]);

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="text-lg">Processing your unsubscribe request...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div
            className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${branding.colors.error}20` }}
          >
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke={branding.colors.error}
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="mb-4 text-2xl font-bold" style={{ color: branding.colors.error }}>
            Unsubscribe Failed
          </h1>
          <p className="mb-6 text-gray-600">{errorMessage}</p>
          <a
            href="/"
            className="inline-block rounded-md px-6 py-3 font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: branding.colors.primary }}
          >
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div
          className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${branding.colors.success}20` }}
        >
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke={branding.colors.success}
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="mb-4 text-2xl font-bold" style={{ color: branding.colors.success }}>
          Successfully Unsubscribed
        </h1>
        <p className="mb-2 text-gray-600">
          You have been successfully unsubscribed from our newsletter.
        </p>
        <p className="mb-6 text-gray-600">
          You will no longer receive promotional emails from us.
        </p>
        <p className="mb-6 text-sm text-gray-500">
          If you change your mind, you can always subscribe again from our website.
        </p>
        <a
          href="/"
          className="inline-block rounded-md px-6 py-3 font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: branding.colors.primary }}
        >
          Return to Homepage
        </a>
      </div>
    </div>
  );
}
