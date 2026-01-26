import { NextApiRequest, NextApiResponse } from "next";
import { gql } from "urql";

import { createLogger } from "../../../../logger";
import { createSimpleGraphQLClient } from "../../../../lib/create-graphql-client";
import { saleorApp } from "../../../../saleor-app";
import { validateUnsubscribeToken } from "../../../../modules/newsletter/campaigns/unsubscribe-url-generator";
import { SALEOR_API_URL_HEADER, SALEOR_AUTHORIZATION_BEARER_HEADER } from "@saleor/app-sdk/headers";

const logger = createLogger("api/newsletter/unsubscribe/[token]");

const UNSUBSCRIBE_MUTATION = gql`
  mutation NewsletterUnsubscribe($email: String!) {
    newsletterUnsubscribe(email: $email) {
      errors {
        field
        message
      }
    }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { token } = req.query;

    if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Token is required" });
    }

    try {
        // Validate token
        const tokenData = validateUnsubscribeToken(token);

        if (!tokenData) {
            return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Invalid Link</title></head>
          <body>
            <h1>Invalid Unsubscribe Link</h1>
            <p>This unsubscribe link is invalid or has expired. Please contact support if you need assistance.</p>
          </body>
        </html>
      `);
        }

        // Get Saleor API URL from token data (primary), or fallback to query/header
        const saleorApiUrl = tokenData.saleorApiUrl || (req.query.saleorApiUrl as string) || req.headers[SALEOR_API_URL_HEADER] as string;

        if (!saleorApiUrl) {
            logger.error("Saleor API URL not found in token or request", { email: tokenData.email });
            return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>Error</h1>
            <p>Unable to process unsubscribe request. Please contact support.</p>
          </body>
        </html>
      `);
        }

        // Get auth data
        const authData = await saleorApp.apl.get(saleorApiUrl);
        if (!authData) {
            return res.status(401).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>Error</h1>
            <p>Unable to authenticate. Please contact support.</p>
          </body>
        </html>
      `);
        }

        // Create GraphQL client
        const apiClient = createSimpleGraphQLClient({
            saleorApiUrl: authData.saleorApiUrl,
            token: authData.token,
        });

        // Call unsubscribe mutation
        const result = await apiClient
            .mutation(UNSUBSCRIBE_MUTATION, {
                email: tokenData.email,
            })
            .toPromise();

        if (result.error) {
            logger.error("Error unsubscribing", { error: result.error, email: tokenData.email });
            return res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>Error</h1>
            <p>An error occurred while processing your unsubscribe request. Please try again or contact support.</p>
          </body>
        </html>
      `);
        }

        if (result.data?.newsletterUnsubscribe?.errors?.length > 0) {
            const errors = result.data.newsletterUnsubscribe.errors;
            logger.error("Unsubscribe mutation errors", { errors, email: tokenData.email });
            return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>Error</h1>
            <p>${errors.map((e: { message: string }) => e.message).join(", ")}</p>
          </body>
        </html>
      `);
        }

        logger.info("Successfully unsubscribed", { email: tokenData.email, campaignId: tokenData.campaignId, channel: tokenData.channelSlug });

        // Redirect to storefront unsubscribe page using the channel from the token
        const storefrontUrl = process.env.STOREFRONT_URL || process.env.STOREFRONT_TUNNEL_URL || process.env.NEXT_PUBLIC_STOREFRONT_URL || "";
        const channel = tokenData.channelSlug || process.env.DEFAULT_CHANNEL_SLUG || "default-channel";

        if (storefrontUrl) {
            return res.redirect(302, `${storefrontUrl}/${channel}/unsubscribe?success=true`);
        }

        // Fallback: Return success page if storefront URL not configured
        return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              text-align: center;
            }
            h1 { color: #2563EB; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>Successfully Unsubscribed</h1>
          <p>You have been successfully unsubscribed from our newsletter.</p>
          <p>You will no longer receive promotional emails from us.</p>
          <p>If you change your mind, you can always subscribe again from our website.</p>
        </body>
      </html>
    `);
    } catch (error) {
        logger.error("Error processing unsubscribe", { error, token });
        return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error</h1>
          <p>An unexpected error occurred. Please contact support.</p>
        </body>
      </html>
    `);
    }
}
