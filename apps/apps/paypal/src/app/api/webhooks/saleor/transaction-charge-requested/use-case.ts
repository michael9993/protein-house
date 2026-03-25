
import {
  AppIsNotConfiguredResponse,
  BrokenAppResponse,
  MalformedRequestResponse,
  UnhandledErrorResponse,
} from "@/app/api/webhooks/saleor/saleor-webhook-responses";
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
import { parsePayPalAmount } from "@/modules/paypal/paypal-money";
import { generatePayPalOrderUrl } from "@/modules/paypal/generate-paypal-dashboard-urls";
import { transactionRecorder } from "@/modules/transactions-recording";
import { TransactionChargeRequestedEventFragment } from "@/generated/graphql";

export class TransactionChargeRequestedUseCase {
  constructor(
    private deps: {
      configRepo: AppConfigRepo;
      logger: ReturnType<typeof createLogger>;
    },
  ) {}

  async execute(
    payload: TransactionChargeRequestedEventFragment,
    authData: { saleorApiUrl: string; appId: string },
  ): Promise<Response> {
    const { configRepo, logger } = this.deps;

    try {
      // TransactionChargeRequested has no sourceObject; extract from transaction
      const sourceCheckout = payload.transaction?.checkout;
      const sourceOrder = payload.transaction?.order;
      if (sourceCheckout) {
        setObservabilitySourceObjectId({ __typename: "Checkout", id: sourceCheckout.id });
      } else if (sourceOrder) {
        setObservabilitySourceObjectId({ __typename: "Order", id: sourceOrder.id });
      }

      const saleorApiUrlResult = createSaleorApiUrl(authData.saleorApiUrl);
      if (saleorApiUrlResult.isErr()) {
        captureException(saleorApiUrlResult.error);
        return new MalformedRequestResponse(appContextContainer.getContextValue(), saleorApiUrlResult.error).getResponse();
      }

      setObservabilitySaleorApiUrl(saleorApiUrlResult.value);

      const event = payload;
      const channelId = event.transaction?.checkout?.channel?.id ?? event.transaction?.order?.channel?.id;

      if (!channelId) {
        return new AppIsNotConfiguredResponse(appContextContainer.getContextValue()).getResponse();
      }

      const configResult = await configRepo.getPayPalConfig({
        saleorApiUrl: saleorApiUrlResult.value,
        appId: authData.appId,
        channelId,
      });

      if (configResult.isErr()) {
        return new BrokenAppResponse(appContextContainer.getContextValue(), configResult.error).getResponse();
      }

      const config = configResult.value;
      if (!config) {
        return new AppIsNotConfiguredResponse(appContextContainer.getContextValue()).getResponse();
      }

      const pspReference = event.transaction?.pspReference;
      if (!pspReference) {
        return Response.json({ result: "CHARGE_FAILURE", message: "Missing pspReference" });
      }

      const orderIdResult = createPayPalOrderId(pspReference);
      if (orderIdResult.isErr()) {
        return Response.json({ result: "CHARGE_FAILURE", message: "Invalid PayPal order ID" });
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

      // Get the order to determine intent (AUTHORIZE vs CAPTURE)
      const orderResult = await client.getOrder(orderIdResult.value);
      if (orderResult.isErr()) {
        return Response.json({
          result: "CHARGE_FAILURE",
          pspReference,
          message: `Failed to get order: ${orderResult.error.publicMessage}`,
          actions: ["CHARGE"],
        });
      }

      const order = orderResult.value;

      if (order.intent === "AUTHORIZE") {
        // AUTHORIZE flow: capture the authorization (not the order)
        const auth = order.purchase_units?.[0]?.payments?.authorizations?.[0];
        if (!auth?.id) {
          return Response.json({
            result: "CHARGE_FAILURE",
            pspReference,
            message: "No authorization found on this order",
            actions: ["CHARGE"],
          });
        }

        const captureAmount = event.action.amount
          ? { value: String(event.action.amount), currency_code: event.action.currency ?? auth.amount.currency_code }
          : undefined;

        const captureResult = await client.captureAuthorization(auth.id, captureAmount);
        if (captureResult.isErr()) {
          return Response.json({
            result: "CHARGE_FAILURE",
            pspReference,
            message: `Capture authorization failed: ${captureResult.error.publicMessage}`,
            actions: ["CHARGE"],
          });
        }

        const capturedAuth = captureResult.value;
        const capture = capturedAuth.purchase_units?.[0]?.payments?.captures?.[0];
        const amount = capture ? parsePayPalAmount(capture.amount.value) : event.action.amount;

        logger.info("Authorization captured successfully", { pspReference, authId: auth.id, amount });

        // Fire-and-forget: record charge (authorization capture)
        transactionRecorder.record({
          saleorTransactionId: event.transaction?.id ?? pspReference,
          saleorOrderId: event.transaction?.order?.id ?? event.transaction?.checkout?.id,
          paypalOrderId: pspReference,
          paypalCaptureId: capture?.id ?? undefined,
          type: "CHARGE",
          status: "SUCCESS",
          amount: amount ?? 0,
          currency: event.action.currency ?? "USD",
          environment: config.environment,
          metadata: { authorizationId: auth.id, flow: "authorization-capture" },
        }).catch((e) => logger.error("Failed to record transaction", { error: e }));

        return Response.json({
          result: "CHARGE_SUCCESS",
          pspReference,
          amount,
          externalUrl,
          message: "Authorization captured successfully",
          actions: ["REFUND"],
        });
      }

      // CAPTURE flow: capture the order directly
      const captureResult = await client.captureOrder(orderIdResult.value);

      if (captureResult.isErr()) {
        return Response.json({
          result: "CHARGE_FAILURE",
          pspReference,
          message: captureResult.error.publicMessage,
          actions: ["CHARGE"],
        });
      }

      const capture = captureResult.value.purchase_units?.[0]?.payments?.captures?.[0];
      const amount = capture ? parsePayPalAmount(capture.amount.value) : event.action.amount;

      // Fire-and-forget: record charge (direct capture)
      transactionRecorder.record({
        saleorTransactionId: event.transaction?.id ?? pspReference,
        saleorOrderId: event.transaction?.order?.id ?? event.transaction?.checkout?.id,
        paypalOrderId: pspReference,
        paypalCaptureId: capture?.id ?? undefined,
        type: "CHARGE",
        status: "SUCCESS",
        amount: amount ?? 0,
        currency: event.action.currency ?? "USD",
        environment: config.environment,
        metadata: { flow: "direct-capture" },
      }).catch((e) => logger.error("Failed to record transaction", { error: e }));

      return Response.json({
        result: "CHARGE_SUCCESS",
        pspReference,
        amount,
        externalUrl,
        message: "Payment captured successfully",
        actions: ["REFUND"],
      });
    } catch (error) {
      captureException(error);
      logger.error("Unhandled error", { error });
      return new UnhandledErrorResponse(appContextContainer.getContextValue(), BaseError.normalize(error)).getResponse();
    }
  }
}
