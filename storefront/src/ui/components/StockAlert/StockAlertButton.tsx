"use client";

import { useState } from "react";
import { executeGraphQL } from "@/lib/graphql";
import { storeConfig } from "@/config";

interface StockAlertButtonProps {
  variantId: string;
  variantName?: string;
  isOutOfStock: boolean;
  className?: string;
}

export function StockAlertButton({
  variantId,
  variantName,
  isOutOfStock,
  className = "",
}: StockAlertButtonProps) {
  const { branding } = storeConfig;
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Don't show if in stock
  if (!isOutOfStock) {
    return null;
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Dynamic import to handle missing GraphQL types gracefully
      // @ts-ignore - GraphQL types will be generated after backend schema update
      const gqlModule = await import("@/gql/graphql");
      const StockAlertSubscribeDocument = gqlModule.StockAlertSubscribeDocument;
      
      if (!StockAlertSubscribeDocument) {
        setError("Stock alerts are not available yet. Please run 'pnpm run generate' to generate GraphQL types.");
        setIsLoading(false);
        return;
      }
      
      const result = await executeGraphQL(StockAlertSubscribeDocument, {
        variables: {
          input: {
            variantId,
            email: email.trim().toLowerCase(),
          },
        },
        cache: "no-store",
      }) as any;

      if (result?.stockAlertSubscribe?.errors && result.stockAlertSubscribe.errors.length > 0) {
        setError(result.stockAlertSubscribe.errors[0].message || "Failed to subscribe. Please try again.");
      } else if (result?.stockAlertSubscribe?.subscribed) {
        setSuccess(true);
        setIsSubscribed(true);
        setEmail("");
        setShowForm(false);
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Error subscribing to stock alert:", err);
      setError("Failed to subscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!email) {
      setShowForm(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Dynamic import to handle missing GraphQL types gracefully
      // @ts-ignore - GraphQL types will be generated after backend schema update
      const gqlModule = await import("@/gql/graphql");
      const StockAlertUnsubscribeDocument = gqlModule.StockAlertUnsubscribeDocument;
      
      if (!StockAlertUnsubscribeDocument) {
        setError("Stock alerts are not available yet. Please run 'pnpm run generate' to generate GraphQL types.");
        setIsLoading(false);
        return;
      }
      
      const result = await executeGraphQL(StockAlertUnsubscribeDocument, {
        variables: {
          input: {
            variantId,
            email: email.trim().toLowerCase(),
          },
        },
        cache: "no-store",
      }) as any;

      if (result?.stockAlertUnsubscribe?.errors && result.stockAlertUnsubscribe.errors.length > 0) {
        setError(result.stockAlertUnsubscribe.errors[0].message || "Failed to unsubscribe. Please try again.");
      } else if (result?.stockAlertUnsubscribe?.unsubscribed) {
        setIsSubscribed(false);
        setEmail("");
        setShowForm(false);
        setSuccess(true);
        
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Error unsubscribing from stock alert:", err);
      setError("Failed to unsubscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success && isSubscribed) {
    return (
      <div className={`rounded-lg border border-emerald-200 bg-emerald-50 p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-emerald-900">
              You'll be notified when this item is back in stock
            </span>
          </div>
          <button
            onClick={handleUnsubscribe}
            className="text-sm text-emerald-700 hover:text-emerald-900 underline"
            disabled={isLoading}
          >
            Unsubscribe
          </button>
        </div>
      </div>
    );
  }

  if (showForm || !isSubscribed) {
    return (
      <div className={`rounded-lg border border-neutral-200 bg-neutral-50 p-4 ${className}`}>
        <div className="mb-2">
          <h3 className="text-sm font-medium text-neutral-900">
            Notify me when back in stock
          </h3>
          <p className="mt-1 text-xs text-neutral-600">
            {variantName ? `Get notified when ${variantName} is available` : "Get notified when this item is available"}
          </p>
        </div>

        <form onSubmit={handleSubscribe} className="space-y-3">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter your email"
              required
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: branding.colors.primary }}
            >
              {isLoading ? "..." : "Notify Me"}
            </button>
          </div>

          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-neutral-600 hover:text-neutral-900"
            >
              Cancel
            </button>
          )}
        </form>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className={`inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 ${className}`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      Notify me when back in stock
    </button>
  );
}

