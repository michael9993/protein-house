import nodemailer from "nodemailer";

import { createLogger } from "../../../logger";

const logger = createLogger("EmailSender");

export interface SmtpConfig {
  host: string;
  port: number;
  encryption: "TLS" | "SSL" | "NONE";
  user?: string;
  password?: string | undefined;
  fromEmail: string;
  fromName?: string;
}

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  smtpConfig: SmtpConfig;
}

/**
 * Send email using SMTP configuration
 */
export async function sendEmail({ to, subject, html, text, smtpConfig }: SendEmailArgs): Promise<void> {
  logger.info("Sending email", { to, subject, hasHtml: !!html });

  let transporter: nodemailer.Transporter;

  // Create transporter based on encryption type
  switch (smtpConfig.encryption) {
    case "TLS":
      transporter = nodemailer.createTransport({
        tls: {
          minVersion: "TLSv1.2",
        },
        secure: false,
        host: smtpConfig.host,
        port: smtpConfig.port,
        auth: smtpConfig.user
          ? {
              user: smtpConfig.user,
              pass: smtpConfig.password,
            }
          : undefined,
      });
      break;

    case "SSL":
      transporter = nodemailer.createTransport({
        secure: true,
        host: smtpConfig.host,
        port: smtpConfig.port,
        auth: smtpConfig.user
          ? {
              user: smtpConfig.user,
              pass: smtpConfig.password,
            }
          : undefined,
      });
      break;

    case "NONE":
      transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: false,
        auth: smtpConfig.user
          ? {
              user: smtpConfig.user,
              pass: smtpConfig.password,
            }
          : undefined,
      });
      break;

    default:
      throw new Error(`Unknown encryption type: ${smtpConfig.encryption}`);
  }

  // Send email
  const mailOptions = {
    from: smtpConfig.fromName
      ? `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`
      : smtpConfig.fromEmail,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text version if not provided
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info("Email sent successfully", { to, subject, messageId: info.messageId });
  } catch (error) {
    logger.error("Failed to send email", { to, subject, error });
    throw error;
  }
}

/**
 * Get default SMTP configuration from environment variables
 * This is a fallback when no SMTP configuration is provided in the campaign
 */
export function getDefaultSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const encryption = process.env.SMTP_ENCRYPTION as "TLS" | "SSL" | "NONE" | undefined;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  const fromName = process.env.SMTP_FROM_NAME;

  if (!host || !port || !fromEmail) {
    logger.warn("SMTP configuration not found in environment variables", {
      hasHost: !!host,
      hasPort: !!port,
      hasFromEmail: !!fromEmail,
    });
    return null;
  }

  return {
    host,
    port: parseInt(port, 10),
    encryption: encryption || "TLS",
    user,
    password,
    fromEmail,
    fromName,
  };
}
