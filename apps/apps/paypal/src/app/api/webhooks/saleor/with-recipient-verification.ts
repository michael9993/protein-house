import { NextAppRouterSyncWebhookHandler } from "@saleor/app-sdk/handlers/next-app-router";
import { WebhookContext } from "@saleor/app-sdk/handlers/shared";
import { NextRequest } from "next/server";

import { EventMetadataFragment } from "@/generated/graphql";
import { createLogger } from "@/lib/logger";
import { getPostgresClient } from "@/modules/postgres/postgres-client";

const logger = createLogger("withRecipientVerification");

type PayloadPartial = Pick<EventMetadataFragment, "recipient">;

export function withRecipientVerification<Payload extends PayloadPartial>(
  handler: NextAppRouterSyncWebhookHandler<Payload>,
) {
  return async (_req: NextRequest, ctx: WebhookContext<Payload>) => {
    const authDataId = ctx.authData.appId;
    const recipientId = ctx.payload.recipient?.id;
    const saleorApiUrl = ctx.authData.saleorApiUrl;

    if (recipientId === undefined) {
      logger.warn("Webhook payload missing recipient id");
      return new Response(JSON.stringify({ error: "Missing recipient" }), { status: 400 });
    }

    const recipientIdStr: string = recipientId;

    if (authDataId !== recipientIdStr) {
      logger.warn("Recipient ID mismatch - checking Postgres for valid app ID", {
        authDataId,
        recipientId: recipientIdStr,
        saleorApiUrl,
        webhookPath: _req.url,
      });

      try {
        const sql = getPostgresClient();

        // Check if recipient ID exists in Postgres for this saleorApiUrl
        const recipientCheck = await Promise.resolve(
          sql<Array<{ app_id: string }>>`
            SELECT app_id
            FROM auth_data
            WHERE saleor_api_url = ${saleorApiUrl}
              AND app_id = ${recipientIdStr}
            LIMIT 1
          `,
        );

        if (recipientCheck.length > 0) {
          logger.info("Recipient ID found in Postgres - updating auth context", {
            oldAppId: authDataId,
            recipientId: recipientIdStr,
          });
          ctx.authData.appId = recipientIdStr;
          return handler(_req, ctx);
        }

        // Check what app_id is currently stored for this saleorApiUrl
        const currentAppCheck = await Promise.resolve(
          sql<Array<{ app_id: string }>>`
            SELECT app_id
            FROM auth_data
            WHERE saleor_api_url = ${saleorApiUrl}
            LIMIT 1
          `,
        );

        if (currentAppCheck.length > 0) {
          // We have auth data for this saleorApiUrl — accept the webhook.
          // The webhook signature was already verified by the SDK, and Saleor
          // is the source of truth for which app ID should receive the webhook.
          logger.info("Accepting recipient ID — valid auth data exists for saleorApiUrl", {
            recipientId: recipientIdStr,
            authDataId,
            storedAppId: currentAppCheck[0].app_id,
          });
          ctx.authData.appId = recipientIdStr;
          return handler(_req, ctx);
        }

        logger.warn("No auth data found in Postgres for saleorApiUrl", {
          saleorApiUrl,
          recipientId: recipientIdStr,
          authDataId,
        });
      } catch (error) {
        logger.error("Failed to query Postgres for app ID", {
          error: error instanceof Error ? error.message : String(error),
          saleorApiUrl,
          recipientId: recipientIdStr,
          authDataId,
        });
      }

      // Could not resolve mismatch — reject
      return Response.json(
        { message: "Recipient ID does not match auth data ID" },
        { status: 403 },
      );
    }

    return handler(_req, ctx);
  };
}
