/**
 * Newsletter utility functions
 * Centralized logic for newsletter subscriptions and welcome emails
 */

export const NEWSLETTER_STORAGE_KEY = "newsletter_subscribed";
export const NEWSLETTER_EMAIL_KEY = "newsletter_email";
export const NEWSLETTER_STATE_CHANGE_EVENT = "newsletter:state-change";

export type NewsletterStatus = "idle" | "loading" | "success" | "error" | "already_subscribed" | "already_active";

export interface NewsletterState {
  status: NewsletterStatus;
  email: string;
  errorMessage: string;
}

/**
 * Dispatch a custom event to sync newsletter state across components
 */
export function dispatchNewsletterStateChange(state: Partial<NewsletterState>): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NEWSLETTER_STATE_CHANGE_EVENT, { detail: state }));
}

/**
 * Check if user already subscribed (persisted in localStorage)
 */
export function isAlreadySubscribed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(NEWSLETTER_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Get the subscribed email from localStorage
 */
export function getSubscribedEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(NEWSLETTER_EMAIL_KEY) || "";
  } catch {
    return "";
  }
}

/**
 * Mark user as subscribed in localStorage
 */
export function markAsSubscribed(email: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NEWSLETTER_STORAGE_KEY, "true");
    localStorage.setItem(NEWSLETTER_EMAIL_KEY, email);
    // Dispatch event to sync all components
    dispatchNewsletterStateChange({ status: "already_subscribed", email });
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear newsletter subscription status (called on logout)
 */
export function clearNewsletterSubscription(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(NEWSLETTER_STORAGE_KEY);
    localStorage.removeItem(NEWSLETTER_EMAIL_KEY);
    // Dispatch event to sync all components
    dispatchNewsletterStateChange({ status: "idle", email: "" });
  } catch {
    // Ignore storage errors
  }
}

/**
 * Newsletter subscription mutation
 */
export const NEWSLETTER_SUBSCRIBE_MUTATION = `
  mutation NewsletterSubscribe($email: String!, $source: String, $channel: String, $isActive: Boolean) {
    newsletterSubscribe(email: $email, source: $source, channel: $channel, isActive: $isActive) {
      subscribed
      alreadySubscribed
      wasReactivated
      errors {
        field
        message
        code
      }
    }
  }
`;

export interface NewsletterSubscribeResult {
  success: boolean;
  isNewSubscriber: boolean;
  wasReactivated: boolean;
  alreadyActive: boolean;
  error?: string;
}

/**
 * Subscribe to newsletter and send appropriate welcome email
 */
export async function subscribeToNewsletter(
  email: string,
  source: string,
  channel: string | undefined
): Promise<NewsletterSubscribeResult> {
  const normalizedEmail = email.trim().toLowerCase();
  
  // Dispatch loading state
  dispatchNewsletterStateChange({ status: "loading", email: normalizedEmail });
  
  const apiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
  if (!apiUrl) {
    dispatchNewsletterStateChange({ status: "error", errorMessage: "API URL not configured" });
    return { success: false, isNewSubscriber: false, wasReactivated: false, alreadyActive: false, error: "API URL not configured" };
  }

  const graphqlUrl = apiUrl.endsWith('/graphql/') || apiUrl.endsWith('/graphql') 
    ? apiUrl 
    : `${apiUrl.replace(/\/+$/, '')}/graphql/`;

  try {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: NEWSLETTER_SUBSCRIBE_MUTATION,
        variables: { email: normalizedEmail, source, channel: channel || null },
      }),
    });

    if (!response.ok) {
      dispatchNewsletterStateChange({ status: "error", errorMessage: "Failed to subscribe" });
      return { success: false, isNewSubscriber: false, wasReactivated: false, alreadyActive: false, error: "Failed to subscribe" };
    }

    const result = await response.json() as any;
    const data = result?.data?.newsletterSubscribe;

    if (data?.errors && data.errors.length > 0) {
      const errorMsg = data.errors[0].message || "Subscription failed";
      dispatchNewsletterStateChange({ status: "error", errorMessage: errorMsg });
      return { 
        success: false, 
        isNewSubscriber: false, 
        wasReactivated: false, 
        alreadyActive: false,
        error: errorMsg
      };
    }

    if (data?.subscribed) {
      const alreadyActive = data.alreadySubscribed === true;
      const wasReactivated = data.wasReactivated === true;
      const isNewSubscriber = !alreadyActive && !wasReactivated;
      
      // Mark as subscribed in localStorage (this also dispatches the event)
      markAsSubscribed(normalizedEmail);
      
      // Handle the three cases:
      if (alreadyActive) {
        // Case 1: Already active subscriber - show "already active" message, no email
        console.log("[Newsletter] Email already active, no email sent");
        dispatchNewsletterStateChange({ status: "already_active", email: normalizedEmail });
        return { success: true, isNewSubscriber: false, wasReactivated: false, alreadyActive: true };
      } else if (wasReactivated) {
        // Case 2: Reactivated inactive subscriber - send welcome back email
        console.log("[Newsletter] Reactivating subscriber, sending welcome back email");
        dispatchNewsletterStateChange({ status: "success", email: normalizedEmail });
        sendWelcomeEmail(normalizedEmail, channel || "default", apiUrl, "NEWSLETTER_REACTIVATE");
        return { success: true, isNewSubscriber: false, wasReactivated: true, alreadyActive: false };
      } else {
        // Case 3: New subscriber - send welcome email
        console.log("[Newsletter] New subscriber, sending welcome email");
        dispatchNewsletterStateChange({ status: "success", email: normalizedEmail });
        sendWelcomeEmail(normalizedEmail, channel || "default", apiUrl, "NEWSLETTER_SUBSCRIBE");
        return { success: true, isNewSubscriber: true, wasReactivated: false, alreadyActive: false };
      }
    }

    dispatchNewsletterStateChange({ status: "error", errorMessage: "Unexpected response" });
    return { success: false, isNewSubscriber: false, wasReactivated: false, alreadyActive: false, error: "Unexpected response" };
  } catch (error) {
    console.error("[Newsletter] Subscription error:", error);
    dispatchNewsletterStateChange({ status: "error", errorMessage: "Failed to subscribe. Please try again." });
    return { 
      success: false, 
      isNewSubscriber: false, 
      wasReactivated: false, 
      alreadyActive: false,
      error: "Failed to subscribe. Please try again." 
    };
  }
}

/**
 * Send welcome/welcome-back email via SMTP app
 * This is fire-and-forget - we don't wait for the result
 */
async function sendWelcomeEmail(
  email: string, 
  channelSlug: string, 
  saleorApiUrl: string,
  eventType: "NEWSLETTER_SUBSCRIBE" | "NEWSLETTER_REACTIVATE"
): Promise<void> {
  try {
    // Get SMTP app URL from environment
    const smtpAppUrl = process.env.NEXT_PUBLIC_SMTP_APP_URL;
    
    if (!smtpAppUrl) {
      console.log("[Newsletter] SMTP app URL not configured, skipping welcome email");
      return;
    }

    const welcomeUrl = `${smtpAppUrl}/api/send-newsletter-email`;
    
    console.log("[Newsletter] Sending welcome email", { email, channelSlug, eventType });

    // Fire and forget
    fetch(welcomeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        channelSlug,
        saleorApiUrl,
        eventType,
      }),
    }).then(response => {
      if (response.ok) {
        console.log("[Newsletter] Welcome email request sent successfully");
      } else {
        console.warn("[Newsletter] Welcome email request failed", { status: response.status });
      }
    }).catch(error => {
      console.warn("[Newsletter] Welcome email request error", { error });
    });
  } catch (error) {
    console.warn("[Newsletter] Failed to send welcome email", { error });
  }
}
