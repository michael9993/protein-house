"use client";

import { useState, useEffect, useCallback } from "react";
import {
  NewsletterStatus,
  NewsletterState,
  NEWSLETTER_STATE_CHANGE_EVENT,
  NEWSLETTER_STORAGE_KEY,
  isAlreadySubscribed,
  getSubscribedEmail,
  clearNewsletterSubscription,
  subscribeToNewsletter,
} from "@/lib/newsletter";

interface UseNewsletterStateReturn {
  email: string;
  setEmail: (email: string) => void;
  status: NewsletterStatus;
  errorMessage: string;
  mounted: boolean;
  handleSubmit: (e: React.FormEvent, source: string, channel?: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Shared hook for newsletter subscription state
 * Keeps all newsletter components in sync via custom events
 */
export function useNewsletterState(): UseNewsletterStateReturn {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<NewsletterStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  // Initialize state from localStorage on mount
  useEffect(() => {
    setMounted(true);
    if (isAlreadySubscribed()) {
      setStatus("already_subscribed");
      setEmail(getSubscribedEmail());
    } else {
      setStatus("idle");
    }
  }, []);

  // Listen for state changes from other components
  useEffect(() => {
    const handleStateChange = (event: CustomEvent<Partial<NewsletterState>>) => {
      const { status: newStatus, email: newEmail, errorMessage: newError } = event.detail;
      
      if (newStatus !== undefined) {
        setStatus(newStatus);
      }
      if (newEmail !== undefined) {
        setEmail(newEmail);
      }
      if (newError !== undefined) {
        setErrorMessage(newError);
      }
    };

    window.addEventListener(
      NEWSLETTER_STATE_CHANGE_EVENT,
      handleStateChange as EventListener
    );

    return () => {
      window.removeEventListener(
        NEWSLETTER_STATE_CHANGE_EVENT,
        handleStateChange as EventListener
      );
    };
  }, []);

  // Listen for storage changes (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === NEWSLETTER_STORAGE_KEY) {
        if (e.newValue === "true") {
          setStatus("already_subscribed");
        } else if (!e.newValue) {
          setStatus("idle");
          setEmail("");
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Listen for logout events
  useEffect(() => {
    const handleLogout = () => {
      console.log("[useNewsletterState] Clearing newsletter subscription on logout");
      clearNewsletterSubscription();
      setStatus("idle");
      setEmail("");
    };

    window.addEventListener("wishlist:logout", handleLogout);
    return () => window.removeEventListener("wishlist:logout", handleLogout);
  }, []);

  const clearError = useCallback(() => {
    if (status === "error") {
      setStatus("idle");
      setErrorMessage("");
    }
  }, [status]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent, source: string, channel?: string) => {
      e.preventDefault();

      if (!email || !email.includes("@")) {
        setStatus("error");
        setErrorMessage("Please enter a valid email address");
        return;
      }

      const result = await subscribeToNewsletter(email, source, channel);

      if (result.success) {
        if (result.alreadyActive) {
          // For already active users, show "already_active" message then transition to "already_subscribed"
          setTimeout(() => setStatus("already_subscribed"), 3000);
        } else {
          // For new/reactivated users, show success then transition to "already_subscribed"
          setTimeout(() => setStatus("already_subscribed"), 3000);
        }
      } else {
        // Error state is dispatched by subscribeToNewsletter
        setErrorMessage(result.error || "Failed to subscribe. Please try again.");
      }
    },
    [email]
  );

  return {
    email,
    setEmail,
    status,
    errorMessage,
    mounted,
    handleSubmit,
    clearError,
  };
}
