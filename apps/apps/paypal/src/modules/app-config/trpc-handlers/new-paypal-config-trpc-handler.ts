import { TRPCError } from "@trpc/server";

import { env } from "@/lib/env";
import { RandomId } from "@/lib/random-id";
import { PayPalConfig } from "@/modules/app-config/domain/paypal-config";
import { newPayPalConfigInputSchema } from "@/modules/app-config/trpc-handlers/new-paypal-config-input-schema";
import { createSaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { createPayPalClientId } from "@/modules/paypal/paypal-client-id";
import { createPayPalClientSecret } from "@/modules/paypal/paypal-client-secret";
import { PayPalApiClient } from "@/modules/paypal/paypal-api-client";
import { createPayPalWebhook } from "@/modules/paypal/paypal-webhook-manager";
import { protectedClientProcedure } from "@/modules/trpc/protected-client-procedure";

export class NewPayPalConfigTrpcHandler {
  baseProcedure = protectedClientProcedure;

  getTrpcProcedure() {
    return this.baseProcedure.input(newPayPalConfigInputSchema).mutation(async ({ input, ctx }) => {
      const saleorApiUrl = createSaleorApiUrl(ctx.saleorApiUrl);

      if (saleorApiUrl.isErr()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Malformed request" });
      }

      const clientIdResult = createPayPalClientId(input.clientId);
      const clientSecretResult = createPayPalClientSecret(input.clientSecret);

      if (clientIdResult.isErr()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid Client ID" });
      }

      if (clientSecretResult.isErr()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid Client Secret" });
      }

      // Validate credentials by trying to get an access token from both environments
      const sandboxClient = new PayPalApiClient({
        clientId: clientIdResult.value,
        clientSecret: clientSecretResult.value,
        environment: "SANDBOX",
      });

      const liveClient = new PayPalApiClient({
        clientId: clientIdResult.value,
        clientSecret: clientSecretResult.value,
        environment: "LIVE",
      });

      const sandboxResult = await sandboxClient.validateCredentials();
      const liveResult = await liveClient.validateCredentials();

      if (sandboxResult.isErr() && liveResult.isErr()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message:
            "Failed to validate PayPal credentials. Please check your Client ID and Client Secret.",
        });
      }

      // Auto-detect environment: sandbox takes priority (dev-first), fall back to live
      const detectedEnvironment = sandboxResult.isOk() ? "SANDBOX" as const : "LIVE" as const;

      const configId = new RandomId().generate();

      // Auto-register PayPal webhook for async event notifications (refund status, etc.)
      // PayPal requires a public HTTPS URL — use PAYPAL_WEBHOOK_BASE_URL (tunnel) for PayPal webhooks,
      // separate from APP_API_BASE_URL (Docker internal) used for Saleor webhooks
      let webhookId: string | undefined;
      const webhookBaseUrl = process.env.PAYPAL_WEBHOOK_BASE_URL ?? env.APP_API_BASE_URL;
      const isPublicUrl = webhookBaseUrl?.startsWith("https://");
      if (webhookBaseUrl && isPublicUrl) {
        const activeClient = detectedEnvironment === "SANDBOX" ? sandboxClient : liveClient;
        const webhookResult = await createPayPalWebhook(activeClient, webhookBaseUrl, {
          saleorApiUrl: ctx.saleorApiUrl,
          configurationId: configId,
          appId: ctx.appId,
        });
        if (webhookResult.isOk()) {
          webhookId = webhookResult.value.webhookId;
        } else {
          // Non-fatal — webhook can be registered later when a public URL is available
          console.warn("Failed to auto-register PayPal webhook:", webhookResult.error.message);
        }
      } else if (webhookBaseUrl && !isPublicUrl) {
        console.info("Skipping PayPal webhook registration — no public HTTPS URL. Set PAYPAL_WEBHOOK_BASE_URL to a public tunnel URL (e.g., https://ext1.yourdomain.com) in .env to enable webhook auto-registration.");
      }

      const configResult = PayPalConfig.create({
        name: input.name,
        id: configId,
        clientId: clientIdResult.value,
        clientSecret: clientSecretResult.value,
        environment: detectedEnvironment,
        webhookId,
      });

      if (configResult.isErr()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to create PayPal configuration: ${configResult.error.message}`,
        });
      }

      const saveResult = await ctx.configRepo.savePayPalConfig({
        config: configResult.value,
        saleorApiUrl: saleorApiUrl.value,
        appId: ctx.appId,
      });

      if (saveResult.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save PayPal configuration.",
        });
      }
    });
  }
}
