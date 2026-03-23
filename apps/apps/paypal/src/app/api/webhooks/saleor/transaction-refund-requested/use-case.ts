
import { UnhandledErrorResponse } from "@/app/api/webhooks/saleor/saleor-webhook-responses";
import { appContextContainer } from "@/lib/app-context";
import { BaseError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import {
  captureException,
  setObservabilityPayPalContext,
  setObservabilitySaleorApiUrl,
  setObservabilitySourceObjectId,
} from "@/lib/observability";
import { AppConfigRepo } from "@/modules/app-config/repositories/app-config-repo";
import { createSaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { PayPalApiClient } from "@/modules/paypal/paypal-api-client";
import { createPayPalOrderId } from "@/modules/paypal/paypal-order-id";
import { createPayPalMoney, parsePayPalAmount } from "@/modules/paypal/paypal-money";
import { generatePayPalOrderUrl } from "@/modules/paypal/generate-paypal-dashboard-urls";
import { transactionRecorder } from "@/modules/transactions-recording";
import { TransactionRefundRequestedEventFragment } from "@/generated/graphql";

export class TransactionRefundRequestedUseCase {
  constructor(
    private deps: {
      configRepo: AppConfigRepo;
      logger: ReturnType<typeof createLogger>;
    },
  ) {}

  async execute(
    payload: TransactionRefundRequestedEventFragment,
    authData: { saleorApiUrl: string; appId: string },
  ): Promise<Response> {
    const { configRepo, logger } = this.deps;

    try {
      // TransactionRefundRequested has no sourceObject; extract from transaction
      const sourceCheckout = payload.transaction?.checkout;
      const sourceOrder = payload.transaction?.order;
      if (sourceCheckout) {
        setObservabilitySourceObjectId({ __typename: "Checkout", id: sourceCheckout.id });
      } else if (sourceOrder) {
        setObservabilitySourceObjectId({ __typename: "Order", id: sourceOrder.id });
      }

      logger.info("Refund webhook received", {
        payload: JSON.stringify(payload).slice(0, 500),
      });

      const saleorApiUrlResult = createSaleorApiUrl(authData.saleorApiUrl);
      if (saleorApiUrlResult.isErr()) {
        captureException(saleorApiUrlResult.error);
        logger.error("Malformed saleorApiUrl");
        return Response.json({ result: "REFUND_FAILURE", message: "Malformed request" });
      }

      setObservabilitySaleorApiUrl(saleorApiUrlResult.value);

      const event = payload;
      const channelId = event.transaction?.checkout?.channel?.id ?? event.transaction?.order?.channel?.id;
      const pspReference = event.transaction?.pspReference;

      logger.info("Refund context", { channelId, pspReference });

      if (!channelId || !pspReference) {
        return Response.json({ result: "REFUND_FAILURE", message: "Missing channel or pspReference" });
      }

      const configResult = await configRepo.getPayPalConfig({
        saleorApiUrl: saleorApiUrlResult.value,
        appId: authData.appId,
        channelId,
      });

      if (configResult.isErr() || !configResult.value) {
        return Response.json({ result: "REFUND_FAILURE", message: "Config not found" });
      }

      const config = configResult.value;
      const orderIdResult = createPayPalOrderId(pspReference);
      if (orderIdResult.isErr()) {
        return Response.json({ result: "REFUND_FAILURE", message: "Invalid PayPal order ID" });
      }

      const client = new PayPalApiClient({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        environment: config.environment,
      });

      const isSandbox = config.environment === "SANDBOX";
      const externalUrl = generatePayPalOrderUrl(pspReference, isSandbox);

      setObservabilityPayPalContext({
        paypalOrderId: pspReference,
        paypalEnvironment: config.environment,
        pspReference,
      });

      // Get order to find capture ID
      const orderResult = await client.getOrder(orderIdResult.value);
      if (orderResult.isErr()) {
        return Response.json({
          result: "REFUND_FAILURE",
          pspReference,
          message: `Failed to get order: ${orderResult.error.publicMessage}`,
        });
      }

      const capture = orderResult.value.purchase_units?.[0]?.payments?.captures?.[0];
      if (!capture) {
        return Response.json({
          result: "REFUND_FAILURE",
          pspReference,
          message: "No capture found for this order",
        });
      }

      // Refund — partial if amount provided, full otherwise
      const refundAmount = event.action.amount;
      const refundCurrency = event.action.currency ?? capture.amount?.currency_code ?? "USD";

      const paypalRefundAmount = refundAmount
        ? createPayPalMoney(refundAmount, refundCurrency)
        : undefined;

      const refundResult = await client.refundCapture(capture.id, paypalRefundAmount);

      if (refundResult.isErr()) {
        return Response.json({
          result: "REFUND_FAILURE",
          pspReference,
          message: `Refund failed: ${refundResult.error.publicMessage}`,
          actions: ["REFUND"],
        });
      }

      const refund = refundResult.value;
      const refundedAmount = refund.amount?.value ? parsePayPalAmount(refund.amount.value) : event.action.amount;

      logger.info("Refund processed", {
        refundId: refund.id,
        refundStatus: refund.status,
        amount: refundedAmount,
      });

      if (refund.status === "COMPLETED") {
        // Fire-and-forget: record completed refund
        transactionRecorder.record({
          saleorTransactionId: event.transaction?.id ?? pspReference,
          paypalOrderId: pspReference,
          paypalCaptureId: capture.id,
          paypalRefundId: refund.id,
          type: "REFUND",
          status: "SUCCESS",
          amount: refundedAmount ?? 0,
          currency: refundCurrency,
          environment: config.environment,
        }).catch((e) => logger.error("Failed to record transaction", { error: e }));

        return Response.json({
          result: "REFUND_SUCCESS",
          pspReference: refund.id,
          amount: refundedAmount,
          externalUrl,
          message: "Refund processed successfully",
        });
      }

      // Pending refund — Saleor only supports REFUND_SUCCESS/REFUND_FAILURE,
      // so record it as success (PayPal will complete asynchronously)
      // Fire-and-forget: record pending refund
      transactionRecorder.record({
        saleorTransactionId: event.transaction?.id ?? pspReference,
        paypalOrderId: pspReference,
        paypalCaptureId: capture.id,
        paypalRefundId: refund.id,
        type: "REFUND",
        status: "PENDING",
        amount: refundedAmount ?? 0,
        currency: refundCurrency,
        environment: config.environment,
      }).catch((e) => logger.error("Failed to record transaction", { error: e }));

      return Response.json({
        result: "REFUND_SUCCESS",
        pspReference: refund.id,
        amount: refundedAmount,
        externalUrl,
        message: "Refund pending — PayPal will complete asynchronously",
      });
    } catch (error) {
      captureException(error);
      logger.error("Unhandled error", { error });
      return Response.json({
        result: "REFUND_FAILURE",
        pspReference: payload?.transaction?.pspReference ?? "unknown",
        message: error instanceof Error ? error.message : "Internal error",
      });
    }
  }
}
