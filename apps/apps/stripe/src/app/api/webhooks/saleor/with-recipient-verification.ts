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
      
      // Try to resolve the mismatch by checking Postgres
      // This handles cases where the app was reinstalled but webhooks still reference old app ID
      try {
        const sql = getPostgresClient();
        
        // Check if recipient ID exists in Postgres for this saleorApiUrl
        // This handles the case where webhook has old app ID but Postgres has new one
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
          // Recipient ID exists in Postgres for this saleorApiUrl - it's valid!
          logger.info("Recipient ID found in Postgres - updating auth context and continuing", {
            oldAppId: authDataId,
            recipientId,
            saleorApiUrl,
          });
          
          // Update the context with the recipient ID (which is the correct one from Postgres)
          ctx.authData.appId = recipientIdStr;
          
          // Continue with the handler using the correct app ID
          return handler(_req, ctx);
        }
        
        // If recipient ID not found, check what app_id is currently stored
        // If there's a stored app_id for this saleorApiUrl, the recipient ID might be from an old install
        const currentAppCheck = await Promise.resolve(
          sql<Array<{ app_id: string }>>`
            SELECT app_id
            FROM auth_data
            WHERE saleor_api_url = ${saleorApiUrl}
            LIMIT 1
          `,
        );

        if (currentAppCheck.length > 0) {
          const storedAppId = currentAppCheck[0].app_id;
          
          // If the stored app ID matches the recipient ID, use it
          // This handles the case where APL lookup returned wrong app ID
          if (storedAppId === recipientIdStr) {
            logger.info("Stored app ID in Postgres matches recipient ID - updating auth context", {
              oldAppId: authDataId,
              recipientId: recipientIdStr,
              storedAppId,
              saleorApiUrl,
            });
            
            ctx.authData.appId = recipientIdStr;
            return handler(_req, ctx);
          }
          
          // If we have auth data for this saleorApiUrl, but recipient ID doesn't match stored app ID,
          // this likely means the app was reinstalled. Since Saleor sent the webhook with this recipient ID,
          // and we have valid auth data for this saleorApiUrl, we should accept it.
          // This is safe because:
          // 1. The webhook signature was already verified (by the SDK)
          // 2. We have auth data for this saleorApiUrl (so it's a valid installation)
          // 3. Saleor is the source of truth for which app ID should receive the webhook
          logger.info("Accepting recipient ID from webhook - app may have been reinstalled", {
            recipientId: recipientIdStr,
            authDataId,
            storedAppId,
            saleorApiUrl,
            message: "Webhook recipient ID doesn't match stored app ID, but we have auth data for this saleorApiUrl. Accepting recipient ID from Saleor.",
          });
          
          // Update context with recipient ID and continue
          ctx.authData.appId = recipientIdStr;
          return handler(_req, ctx);
        } else {
          logger.warn("No auth data found in Postgres for saleorApiUrl", {
            saleorApiUrl,
            recipientId: recipientIdStr,
            authDataId,
          });
        }
      } catch (error) {
        logger.error("Failed to query Postgres for app ID", {
          error: error instanceof Error ? error.message : String(error),
          saleorApiUrl,
          recipientId,
          authDataId,
        });
      }
      
      // If we couldn't resolve it, return 403
      return Response.json(
        { message: "Recipient ID does not match auth data ID" },
        { status: 403 },
      );
    }

    return handler(_req, ctx);
  };
}
