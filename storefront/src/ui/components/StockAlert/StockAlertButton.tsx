"use client";

import { useState } from "react";
import { useBranding, useProductDetailText } from "@/providers/StoreConfigProvider";

interface StockAlertButtonProps {
  variantId: string;
  variantName?: string;
  isOutOfStock: boolean;
  enabled?: boolean;
  onSubscribe: (
    variantId: string,
    email: string
  ) => Promise<{ success: boolean; alreadySubscribed?: boolean; error?: string }>;
  onUnsubscribe: (
    variantId: string,
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  className?: string;
}

type AlertState = "idle" | "form" | "loading" | "subscribed";

export function StockAlertButton({
  variantId,
  variantName,
  isOutOfStock,
  enabled = true,
  onSubscribe,
  onUnsubscribe,
  className = "",
}: StockAlertButtonProps) {
  const branding = useBranding();
  const text = useProductDetailText();

  const [state, setState] = useState<AlertState>("idle");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);
  const [wasAlreadySubscribed, setWasAlreadySubscribed] = useState(false);

  if (!isOutOfStock || !enabled) {
    return null;
  }

  const t = {
    button: text.notifyMeButton || "Notify me when back in stock",
    title: text.notifyMeTitle || "Notify me when back in stock",
    description: text.notifyMeDescription || "Get notified when {variant} is available",
    descriptionGeneric: text.notifyMeDescriptionGeneric || "Get notified when this item is available",
    emailPlaceholder: text.notifyMeEmailPlaceholder || "Enter your email",
    submitButton: text.notifyMeSubmitButton || "Notify Me",
    submitting: text.notifyMeSubmitting || "Subscribing...",
    success: text.notifyMeSuccess || "You'll be notified when this item is back in stock",
    alreadySubscribed: text.notifyMeAlreadySubscribed || "You're already subscribed for this item",
    unsubscribe: text.notifyMeUnsubscribe || "Unsubscribe",
    invalidEmail: text.notifyMeInvalidEmail || "Please enter a valid email address",
    errorText: text.notifyMeError || "Failed to subscribe. Please try again.",
    cancel: text.notifyMeCancel || "Cancel",
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setError(t.invalidEmail);
      return;
    }

    setState("loading");
    setError(null);

    const result = await onSubscribe(variantId, email);

    if (result.success) {
      setSubscribedEmail(email);
      setWasAlreadySubscribed(!!result.alreadySubscribed);
      setState("subscribed");
      setEmail("");
    } else {
      setError(result.error || t.errorText);
      setState("form");
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscribedEmail) return;

    setState("loading");
    setError(null);

    const result = await onUnsubscribe(variantId, subscribedEmail);

    if (result.success) {
      setSubscribedEmail(null);
      setState("idle");
    } else {
      setError(result.error || t.errorText);
      setState("subscribed");
    }
  };

  // Subscribed confirmation
  if (state === "subscribed") {
    return (
      <div className={`rounded-lg border border-success-200 bg-success-50 p-3 ${className}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="h-5 w-5 shrink-0 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-success-900">
              {wasAlreadySubscribed ? t.alreadySubscribed : t.success}
            </span>
          </div>
          <button
            onClick={handleUnsubscribe}
            className="shrink-0 text-sm text-success-700 hover:text-success-900 underline"
          >
            {t.unsubscribe}
          </button>
        </div>
        {error && (
          <div className="mt-2 rounded border border-error-200 bg-error-50 p-2 text-xs text-error-800">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Email form
  if (state === "form" || state === "loading") {
    const description = variantName
      ? t.description.replace("{variant}", variantName)
      : t.descriptionGeneric;

    return (
      <div className={`rounded-lg border border-neutral-200 bg-neutral-50 p-4 ${className}`}>
        <div className="mb-2">
          <h3 className="text-sm font-medium text-neutral-900">
            {t.title}
          </h3>
          <p className="mt-1 text-xs text-neutral-600">
            {description}
          </p>
        </div>

        <form onSubmit={handleSubscribe} className="space-y-3">
          {error && (
            <div className="rounded border border-error-200 bg-error-50 p-2 text-xs text-error-800">
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
              placeholder={t.emailPlaceholder}
              required
              className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              disabled={state === "loading"}
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: branding.colors.primary }}
            >
              {state === "loading" ? t.submitting : t.submitButton}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setState("idle");
              setError(null);
            }}
            className="text-xs text-neutral-600 hover:text-neutral-900"
          >
            {t.cancel}
          </button>
        </form>
      </div>
    );
  }

  // Idle state — show bell button
  return (
    <button
      onClick={() => setState("form")}
      className={`inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 ${className}`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {t.button}
    </button>
  );
}
