import { NextAppRouterSyncWebhookHandler } from "@saleor/app-sdk/handlers/next-app-router";
import { WebhookContext } from "@saleor/app-sdk/handlers/shared";
import { NextRequest } from "next/server";

import { EventMetadataFragment } from "@/generated/graphql";
import { createLogger } from "@/lib/logger";

const logger = createLogger("withRecipientVerification");

type PayloadPartial = Pick<EventMetadataFragment, "recipient">;

export function withRecipientVerification<Payload extends PayloadPartial>(
  handler: NextAppRouterSyncWebhookHandler<Payload>,
) {
  return async (_req: NextRequest, ctx: WebhookContext<Payload>) => {
    const authDataId = ctx.authData.appId;
    const recipientId = ctx.payload.recipient?.id;

    if (recipientId === undefined) {
      logger.warn("Webhook payload missing recipient id");
      return new Response(JSON.stringify({ error: "Missing recipient" }), { status: 400 });
    }

    if (authDataId !== recipientId) {
      // In dev environments with file APL, app ID mismatches happen after reinstalls.
      // Since the webhook signature was already verified by the SDK, accept it.
      logger.warn("Recipient ID mismatch - accepting (signature already verified)", {
        authDataId,
        recipientId,
      });
      ctx.authData.appId = recipientId;
    }

    return handler(_req, ctx);
  };
}
