import { NextApiHandler, NextApiResponse } from "next";

import { createLogger } from "../../logger";
import { MessageEventTypes } from "../../modules/event-handlers/message-event-types";
import { SendEventMessagesUseCase } from "../../modules/event-handlers/use-case/send-event-messages.use-case";
import { SendEventMessagesUseCaseFactory } from "../../modules/event-handlers/use-case/send-event-messages.use-case.factory";
import { saleorApp } from "../../saleor-app";

const logger = createLogger("SendNewsletterEmailAPI");

interface NewsletterEmailRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  channelSlug: string;
  eventType: "NEWSLETTER_SUBSCRIBE" | "NEWSLETTER_REACTIVATE";
  saleorApiUrl: string;
}

/**
 * Set CORS headers for cross-origin requests from storefront
 */
function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * Public API endpoint to send newsletter welcome/reactivation emails.
 * Uses the same SendEventMessagesUseCase as other SMTP events,
 * which includes branding from storefront-control automatically.
 * 
 * POST /api/send-newsletter-email
 * Body: {
 *   email: string (required)
 *   firstName?: string
 *   lastName?: string
 *   channelSlug: string (required)
 *   eventType: "NEWSLETTER_SUBSCRIBE" | "NEWSLETTER_REACTIVATE" (required)
 *   saleorApiUrl: string (required)
 * }
 */
const handler: NextApiHandler = async (req, res) => {
  // Set CORS headers for all responses
  setCorsHeaders(res);

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { email, firstName, lastName, channelSlug, eventType, saleorApiUrl } = req.body as NewsletterEmailRequest;

  // Validate required fields
  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }
  if (!channelSlug) {
    return res.status(400).json({ success: false, error: "Channel slug is required" });
  }
  if (!eventType || !["NEWSLETTER_SUBSCRIBE", "NEWSLETTER_REACTIVATE"].includes(eventType)) {
    return res.status(400).json({ success: false, error: "Invalid event type" });
  }
  if (!saleorApiUrl) {
    return res.status(400).json({ success: false, error: "Saleor API URL is required" });
  }

  logger.info("Processing newsletter email request", { email, channelSlug, eventType });

  try {
    // Get auth data for this Saleor instance
    const authData = await saleorApp.apl.get(saleorApiUrl);

    if (!authData) {
      logger.error("No auth data found for Saleor API URL");

      return res.status(500).json({ success: false, error: "SMTP app not configured for this Saleor instance" });
    }

    // Create the use case using the factory (same pattern as other event handlers)
    const useCaseFactory = new SendEventMessagesUseCaseFactory();
    const useCase = useCaseFactory.createFromAuthData(authData);

    // Prepare the payload with user info (same structure as other SMTP events)
    const payload = {
      user: {
        email,
        first_name: firstName || "",
        last_name: lastName || "",
      },
      recipient_email: email,
      channel_slug: channelSlug,
      domain: new URL(saleorApiUrl).hostname,
      site_name: "Store", // Will be replaced by branding
      logo_url: "", // Will be populated from branding
    };

    /*
     * Send the email using the same use case as other events.
     * This automatically: fetches branding from storefront-control,
     * processes templates with branding, compiles MJML to HTML, sends via SMTP.
     */
    const result = await useCase.sendEventMessages({
      event: eventType as MessageEventTypes,
      payload,
      recipientEmail: email,
      channelSlug,
      saleorApiUrl,
    });

    if (result.isErr()) {
      const errors = result.error;

      // Check for specific error types
      const isNoOpError = errors.some(
        (e) => e instanceof SendEventMessagesUseCase.NoOpError
      );
      
      if (isNoOpError) {
        // Event is disabled or not configured - this is expected behavior
        logger.info("Newsletter event not active or not configured", {
          eventType,
          channelSlug,
          errors: errors.map((e) => e.message),
        });

        return res.status(200).json({ 
          success: false, 
          skipped: true,
          message: `${eventType} event is not active or not configured`,
        });
      }

      // Other errors are actual failures
      logger.error("Failed to send newsletter email", {
        errors: errors.map((e) => ({
          name: e.name,
          message: e.message,
        })),
        eventType,
      });

      return res.status(500).json({ 
        success: false, 
        error: errors[0]?.message || "Failed to send email",
      });
    }

    logger.info("Newsletter email sent successfully", { eventType, channelSlug });

    return res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error("Unexpected error sending newsletter email", { error: errorMessage });

    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export default handler;
