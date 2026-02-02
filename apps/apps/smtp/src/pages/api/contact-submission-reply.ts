import { captureException } from "@sentry/nextjs";
import { NextApiRequest, NextApiResponse } from "next";

import { createLogger } from "../../logger";
import { SendEventMessagesUseCase } from "../../modules/event-handlers/use-case/send-event-messages.use-case";
import { SendEventMessagesUseCaseFactory } from "../../modules/event-handlers/use-case/send-event-messages.use-case.factory";
import { saleorApp } from "../../saleor-app";

const logger = createLogger("api/contact-submission-reply");

interface ContactSubmissionReplyPayload {
  submission: {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
    channel_slug: string;
  };
  reply_message: string;
  reply_subject?: string;
}

/**
 * API endpoint to handle contact submission replies.
 * This endpoint is called directly from the Saleor backend.
 * It uses the SMTP app's email sending system with the CONTACT_SUBMISSION_REPLY template.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = req.body as ContactSubmissionReplyPayload & { saleor_url?: string };

    // Validate required fields
    if (!payload.submission || !payload.reply_message) {
      logger.error("Missing required fields in payload");

      return res.status(400).json({ error: "Missing required fields: submission and reply_message" });
    }

    const { submission, reply_message, reply_subject } = payload;

    if (!submission.email || !submission.channel_slug) {
      logger.error("Missing email or channel_slug in submission");

      return res.status(400).json({ error: "Missing email or channel_slug in submission" });
    }

    logger.info("Processing contact submission reply", {
      submissionId: submission.id,
      recipientEmail: submission.email,
      channel: submission.channel_slug,
    });

    // Create use case factory
    const useCaseFactory = new SendEventMessagesUseCaseFactory();
    
    // Get auth data from the app - we need the saleor URL to get the auth data
    let authData = null;
    
    // Try to get auth data - saleor_url should be provided in payload
    const saleorUrl = payload.saleor_url;

    if (saleorUrl) {
      authData = await saleorApp.apl.get(saleorUrl);
    } else {
      // Fallback: try to get from all stored auth data if the APL supports it
      try {
        // Check if getAll method exists (not all APL implementations support it)
        if (typeof saleorApp.apl.getAll === "function") {
          const allAuthData = await saleorApp.apl.getAll();
          // Try to find auth data that matches the channel (some APLs store domain/channel) or use the first one

          type AuthWithDomain = typeof allAuthData[0] & { domain?: string };

          authData = allAuthData.find((auth) => (auth as AuthWithDomain).domain === submission.channel_slug) || allAuthData[0];
        }
      } catch (e) {
        logger.warn("getAll not supported or failed", { error: e });
      }
    }

    if (!authData) {
      logger.error("No auth data found", { channel: submission.channel_slug });

      return res.status(401).json({ 
        error: "App not authenticated. Please provide saleor_url in payload or ensure the app is properly installed." 
      });
    }

    const useCase = useCaseFactory.createFromAuthData(authData);

    // Prepare payload for the email template
    const emailPayload = {
      submission: {
        name: submission.name,
        email: submission.email,
        subject: submission.subject,
        message: submission.message,
        created_at: submission.created_at,
      },
      reply_message: reply_message,
      reply_subject: reply_subject || `Re: ${submission.subject}`,
    };

    const result = await useCase.sendEventMessages({
      channelSlug: submission.channel_slug,
      event: "CONTACT_SUBMISSION_REPLY",
      payload: emailPayload,
      recipientEmail: submission.email,
      saleorApiUrl: authData.saleorApiUrl,
    });

    return result.match(
      (_r) => {
        logger.info("Successfully sent contact submission reply email");

        return res.status(200).json({ message: "Reply email sent successfully" });
      },
      (err) => {
        const errorInstance = err[0];

        if (errorInstance instanceof SendEventMessagesUseCase.ServerError) {
          logger.error("Failed to send email [server error]", { error: err });

          return res.status(500).json({ error: "Failed to send email - server error" });
        } else if (errorInstance instanceof SendEventMessagesUseCase.ClientError) {
          logger.error("Failed to send email [client error]", { error: err });

          return res.status(400).json({ error: "Failed to send email - client error" });
        } else if (errorInstance instanceof SendEventMessagesUseCase.NoOpError) {
          logger.warn("Sending email aborted [no op]", { error: err });

          return res.status(200).json({ message: "Email sending skipped [no op]" });
        }

        logger.error("Failed to send email [unhandled error]", { error: err });
        captureException(new Error("Unhandled useCase error", { cause: err }));

        return res.status(500).json({ error: "Failed to send email - unhandled error" });
      },
    );
  } catch (e) {
    logger.error("Unhandled error in contact submission reply handler", {
      error: e instanceof Error ? e.message : String(e),
    });

    captureException(e);

    return res.status(500).json({ error: "Internal server error" });
  }
}
