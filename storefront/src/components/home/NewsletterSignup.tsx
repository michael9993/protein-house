"use client";

import { useState } from "react";
import { useStoreConfig, useFeature } from "@/providers/StoreConfigProvider";

interface NewsletterSignupProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
}

/**
 * Newsletter Signup Section
 * 
 * Email subscription form with sports/energetic styling.
 * Configurable via store config (features.newsletter)
 */
export function NewsletterSignup({
  title = "Join the Team",
  subtitle = "Subscribe to our newsletter and get 10% off your first order, plus exclusive access to new arrivals and special offers.",
  placeholder = "Enter your email",
  buttonText = "Subscribe",
  successMessage = "Thanks for subscribing! Check your email for your discount code.",
}: NewsletterSignupProps) {
  const { branding, store } = useStoreConfig();
  const isEnabled = useFeature("newsletter");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Don't render if disabled
  if (!isEnabled) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");

    // Simulate API call - replace with actual integration
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section 
      className="relative overflow-hidden py-20"
      style={{ 
        backgroundColor: branding.colors.secondary,
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Decorative Elements */}
      <div 
        className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: branding.colors.primary }}
      />
      <div 
        className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: branding.colors.accent }}
      />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Icon */}
        <div 
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${branding.colors.primary}30` }}
        >
          <svg 
            className="h-8 w-8"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke={branding.colors.primary}
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="heading text-3xl font-bold text-white sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-lg text-white/80">
          {subtitle}
        </p>

        {/* Form */}
        {status === "success" ? (
          <div 
            className="mt-8 inline-flex items-center gap-3 rounded-full px-6 py-4"
            style={{ backgroundColor: `${branding.colors.success}20` }}
          >
            <svg 
              className="h-6 w-6"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke={branding.colors.success}
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span style={{ color: branding.colors.success }} className="font-medium">
              {successMessage}
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <div className="relative flex-1 sm:max-w-md">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder={placeholder}
                  className="w-full rounded-full border-0 bg-white/10 px-6 py-4 text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2"
                  style={{ 
                    boxShadow: status === "error" 
                      ? `0 0 0 2px ${branding.colors.error}` 
                      : undefined,
                  }}
                  disabled={status === "loading"}
                />
                {status === "error" && (
                  <p 
                    className="mt-2 text-left text-sm"
                    style={{ color: branding.colors.error }}
                  >
                    {errorMessage}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 font-bold text-white transition-all hover:scale-105 disabled:opacity-70"
                style={{ 
                  backgroundColor: branding.colors.primary,
                  boxShadow: `0 4px 20px ${branding.colors.primary}60`,
                }}
              >
                {status === "loading" ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Subscribing...
                  </>
                ) : (
                  <>
                    {buttonText}
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Trust Indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>No spam, ever</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Weekly updates</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Exclusive offers</span>
          </div>
        </div>
      </div>
    </section>
  );
}

