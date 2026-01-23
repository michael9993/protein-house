"use client";

import React, { useState, useEffect } from "react";
import { useStoreConfig, useFeature, useContentConfig } from "@/providers/StoreConfigProvider";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { SectionHeader } from "./SectionHeader";

interface NewsletterSignupProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
}

const NEWSLETTER_STORAGE_KEY = "newsletter_subscribed";

/**
 * Check if user already subscribed (persisted in localStorage)
 */
function isAlreadySubscribed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(NEWSLETTER_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Mark user as subscribed in localStorage
 */
function markAsSubscribed(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NEWSLETTER_STORAGE_KEY, "true");
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear newsletter subscription status (called on logout)
 */
function clearNewsletterSubscription(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(NEWSLETTER_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Newsletter Signup Section
 * 
 * Email subscription form with sports/energetic styling.
 * Configurable via store config (features.newsletter)
 * 
 * Features:
 * - Email validation
 * - Double-submit prevention
 * - Persistent subscribed state (localStorage)
 * - Loading/success/error states
 */
export function NewsletterSignup({
  title,
  subtitle,
  placeholder,
  buttonText,
  successMessage,
}: NewsletterSignupProps) {
  const { branding, store: _store } = useStoreConfig();
  const content = useContentConfig();
  const isEnabled = useFeature("newsletter");
  
  // Use props or fall back to config values
  const displayTitle = title ?? content.general.newsletterTitle;
  const displaySubtitle = subtitle ?? content.general.newsletterDescription;
  const displayPlaceholder = placeholder ?? content.homepage.newsletterEmailPlaceholder;
  const displayButtonText = buttonText ?? content.general.newsletterButton;
  const displaySuccessMessage = successMessage ?? content.general.newsletterSuccess;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "already_subscribed">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  // Check localStorage for previous subscription on mount
  // Note: We clear this on logout, but also check on every mount to handle edge cases
  useEffect(() => {
    setMounted(true);
    const subscribed = isAlreadySubscribed();
    if (subscribed) {
      setStatus("already_subscribed");
    } else {
      setStatus("idle");
    }
  }, []);

  // Listen for logout events to clear newsletter subscription status
  useEffect(() => {
    const handleLogout = () => {
      console.log("[NewsletterSignup] Clearing newsletter subscription on logout");
      clearNewsletterSubscription();
      setStatus("idle");
      setEmail("");
      setMounted(false); // Reset mounted state to re-check subscription
      // Force re-check after a brief delay to ensure state is cleared
      setTimeout(() => {
        setMounted(true);
      }, 100);
    };

    // Listen for wishlist:logout event (fired during logout)
    window.addEventListener("wishlist:logout", handleLogout);
    
    // Also listen for storage events in case localStorage is cleared elsewhere
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === NEWSLETTER_STORAGE_KEY && !e.newValue) {
        console.log("[NewsletterSignup] Newsletter subscription cleared from storage");
        setStatus("idle");
        setEmail("");
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("wishlist:logout", handleLogout);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Call all hooks before any conditional returns
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.1, rootMargin: "0px 0px -80px 0px" });

  // Don't render if disabled
  if (!isEnabled) {
    return null;
  }

  // Show subscribed state if already subscribed
  if (mounted && status === "already_subscribed") {
    return (
      <section 
        className="relative overflow-hidden py-12"
        style={{ backgroundColor: branding.colors.secondary }}
      >
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div 
            className="inline-flex items-center gap-3 rounded-full px-6 py-4"
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
              {content.general.newsletterAlreadySubscribed}
            </span>
          </div>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      console.warn("[NewsletterSignup] Invalid email format:", email);
      setStatus("error");
      setErrorMessage("Please enter a valid email address");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log("[NewsletterSignup] Starting subscription", {
      email: normalizedEmail,
      source: "homepage",
    });

    setStatus("loading");
    setErrorMessage("");

      try {
        // Client-side GraphQL fetch (no auth needed for newsletter subscription)
        const apiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
        if (!apiUrl) {
          console.error("[NewsletterSignup] API URL not configured");
          setStatus("error");
          setErrorMessage("API URL not configured.");
          return;
        }
        
        const graphqlUrl = apiUrl.endsWith('/graphql/') || apiUrl.endsWith('/graphql') 
          ? apiUrl 
          : `${apiUrl.replace(/\/+$/, '')}/graphql/`;
        
        console.log("[NewsletterSignup] Sending request", {
          graphqlUrl,
          email: normalizedEmail,
          source: "homepage",
        });
        
        const NEWSLETTER_SUBSCRIBE_MUTATION = `
          mutation NewsletterSubscribe($email: String!, $source: String) {
            newsletterSubscribe(email: $email, source: $source) {
              subscribed
              alreadySubscribed
              errors {
                field
                message
                code
              }
            }
          }
        `;
        
        const response = await fetch(graphqlUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: NEWSLETTER_SUBSCRIBE_MUTATION,
            variables: {
              email: normalizedEmail,
              source: "homepage",
            },
          }),
        });
        
        console.log("[NewsletterSignup] Response status:", response.status, response.statusText);
        
        if (!response.ok) {
          console.error("[NewsletterSignup] HTTP error:", response.status, response.statusText);
          setStatus("error");
          setErrorMessage("Failed to subscribe. Please try again.");
          return;
        }
        
        const result = await response.json() as any;
        console.log("[NewsletterSignup] Response data:", {
          subscribed: result?.data?.newsletterSubscribe?.subscribed,
          alreadySubscribed: result?.data?.newsletterSubscribe?.alreadySubscribed,
          errors: result?.data?.newsletterSubscribe?.errors,
          hasErrors: !!(result?.data?.newsletterSubscribe?.errors && result.data.newsletterSubscribe.errors.length > 0),
        });

        if (result?.data?.newsletterSubscribe?.errors && result.data.newsletterSubscribe.errors.length > 0) {
          const error = result.data.newsletterSubscribe.errors[0];
          console.error("[NewsletterSignup] Subscription error:", error);
          setStatus("error");
          setErrorMessage(error.message || "Failed to subscribe. Please try again.");
        } else if (result?.data?.newsletterSubscribe?.subscribed || result?.data?.newsletterSubscribe?.alreadySubscribed) {
          console.log("[NewsletterSignup] Subscription successful", {
            subscribed: result.data.newsletterSubscribe.subscribed,
            alreadySubscribed: result.data.newsletterSubscribe.alreadySubscribed,
            email: normalizedEmail,
          });
          setStatus("success");
          setEmail("");
          markAsSubscribed(); // Persist subscribed state
          
          // Show success for longer, then show subscribed state
          setTimeout(() => {
            setStatus("already_subscribed");
          }, 5000);
        } else {
          console.error("[NewsletterSignup] Unexpected response format:", result);
          setStatus("error");
          setErrorMessage("Something went wrong. Please try again.");
        }
    } catch (error) {
      console.error("[NewsletterSignup] Exception during subscription:", error);
      setStatus("error");
      setErrorMessage("Failed to subscribe. Please try again.");
    }
  };

  return (
    <section 
      ref={elementRef}
      className={`relative overflow-hidden py-20 transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: branding.colors.secondary }}
    >
      {/* Decorative Elements */}
      <div 
        className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: branding.colors.primary }}
      />
      <div 
        className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: branding.colors.accent }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
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
        <div className="mx-auto max-w-3xl">
          <SectionHeader
            title={displayTitle}
            subtitle={displaySubtitle}
            type="newsletter"
            align="center"
            variant="dark"
          />
        </div>

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
              {displaySuccessMessage}
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
                  placeholder={displayPlaceholder}
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
                    {displayButtonText}
                    <svg className="h-5 w-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <span>{content.general.newsletterNoSpam}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{content.general.newsletterWeeklyUpdates}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{content.general.newsletterExclusiveOffers}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

