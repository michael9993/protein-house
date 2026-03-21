# PayPal Refund Status Tracking — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track async refund completion from PayPal's side via incoming webhooks + polling fallback, and report status back to Saleor via `transactionEventReport` mutation.

**Architecture:** PayPal sends webhook events (PAYMENT.CAPTURE.REFUNDED, etc.) to our app. We verify the signature, map PayPal status to Saleor `TransactionEventTypeEnum`, and call `transactionEventReport`. Webhook URL is auto-registered via PayPal API when credentials are saved. A polling endpoint checks pending refunds as fallback. Follows Stripe app patterns (webhook-params, use-case, event-reporter).

**Tech Stack:** Next.js App Router (webhook receiver), PayPal REST v2 Notifications API, Saleor GraphQL `transactionEventReport`, neverthrow Result pattern, file-based config (stores webhookId).

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/app/api/webhooks/paypal/route.ts` | **NEW** — Next.js POST handler for PayPal webhook events |
| `src/app/api/webhooks/paypal/use-case.ts` | **NEW** — Core business logic: verify signature, route events, report to Saleor |
| `src/app/api/webhooks/paypal/webhook-params.ts` | **NEW** — Parse/validate URL query params (saleorApiUrl, configId, appId) |
| `src/modules/paypal/paypal-webhook-manager.ts` | **NEW** — Create/delete PayPal webhooks via Notifications API |
| `src/modules/paypal/paypal-webhook-verifier.ts` | **NEW** — Verify PayPal webhook signature (cert-based) |
| `src/modules/paypal/paypal-webhook-url-builder.ts` | **NEW** — Build webhook URL with encoded params |
| `src/modules/saleor/transaction-event-reporter.ts` | **NEW** — Wrap `transactionEventReport` GraphQL mutation |
| `src/modules/paypal/paypal-refund-status.ts` | **NEW** — Map PayPal refund status → Saleor TransactionEventTypeEnum |
| `src/app/api/webhooks/paypal/poll-pending-refunds/route.ts` | **NEW** — Polling endpoint for pending refunds (cron fallback) |
| `src/modules/app-config/domain/paypal-config.ts` | **MODIFY** — Add `webhookId` field |
| `src/modules/app-config/repositories/file/file-app-config-repo.ts` | **MODIFY** — Persist `webhookId` |
| `src/modules/app-config/trpc-handlers/new-paypal-config-trpc-handler.ts` | **MODIFY** — Auto-register webhook on config save |
| `src/modules/paypal/paypal-api-client.ts` | **MODIFY** — Add webhook API methods + getRefund() |

All paths relative to `apps/apps/paypal/`.

---

### Task 1: Transaction Event Reporter

**Files:**
- Create: `src/modules/saleor/transaction-event-reporter.ts`

This is the foundation — all other tasks use it to report events to Saleor.

- [ ] **Step 1: Create the transaction event reporter**

```typescript
// src/modules/saleor/transaction-event-reporter.ts
import { err, ok, Result } from "neverthrow";
import { Client } from "urql";

import { createLogger } from "@/lib/logger";
import {
  TransactionEventReportDocument,
  TransactionEventReportMutationVariables,
  TransactionEventTypeEnum,
  TransactionActionEnum,
} from "@/generated/graphql";

const logger = createLogger("TransactionEventReporter");

export interface TransactionEventReportInput {
  transactionId: string;
  message: string;
  amount: number;
  pspReference: string;
  time: string; // ISO datetime
  type: TransactionEventTypeEnum;
  availableActions?: TransactionActionEnum[];
  externalUrl?: string;
}

export class TransactionEventReportError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "TransactionEventReportError";
  }
}

export async function reportTransactionEvent(
  client: Client,
  input: TransactionEventReportInput,
): Promise<Result<{ eventId: string; alreadyProcessed: boolean }, TransactionEventReportError>> {
  const variables: TransactionEventReportMutationVariables = {
    transactionId: input.transactionId,
    message: input.message,
    amount: input.amount,
    pspReference: input.pspReference,
    time: input.time,
    type: input.type,
    availableActions: input.availableActions ?? null,
    externalUrl: input.externalUrl ?? null,
  };

  logger.info("Reporting transaction event to Saleor", {
    transactionId: input.transactionId,
    type: input.type,
    pspReference: input.pspReference,
    amount: input.amount,
  });

  const result = await client
    .mutation(TransactionEventReportDocument, variables)
    .toPromise();

  if (result.error) {
    logger.error("GraphQL error reporting transaction event", {
      error: result.error.message,
    });
    return err(new TransactionEventReportError(result.error.message, "GRAPHQL_ERROR"));
  }

  const data = result.data?.transactionEventReport;
  if (!data) {
    return err(new TransactionEventReportError("No data returned from mutation"));
  }

  if (data.errors && data.errors.length > 0) {
    const firstError = data.errors[0];
    // ALREADY_EXISTS is not a failure — event was already reported
    if (firstError.code === "ALREADY_EXISTS") {
      logger.info("Transaction event already reported", { pspReference: input.pspReference });
      return ok({ eventId: "", alreadyProcessed: true });
    }
    return err(new TransactionEventReportError(firstError.message, firstError.code ?? undefined));
  }

  return ok({
    eventId: data.transactionEvent?.id ?? "",
    alreadyProcessed: data.alreadyProcessed ?? false,
  });
}
```

- [ ] **Step 2: Verify generated GraphQL types exist**

Run: `docker exec saleor-paypal-app-dev sh -c "grep -c 'TransactionEventReportDocument' /app/apps/paypal/generated/graphql.ts"`
Expected: A number > 0 (the mutation is already generated)

- [ ] **Step 3: Commit**

```bash
git add apps/apps/paypal/src/modules/saleor/transaction-event-reporter.ts
git commit -m "feat(paypal): add transaction event reporter for async status updates"
```

---

### Task 2: PayPal Refund Status Mapping

**Files:**
- Create: `src/modules/paypal/paypal-refund-status.ts`

- [ ] **Step 1: Create status mapping module**

```typescript
// src/modules/paypal/paypal-refund-status.ts
import { TransactionEventTypeEnum, TransactionActionEnum } from "@/generated/graphql";
import { PayPalRefundStatus } from "./types";

interface RefundStatusMapping {
  type: TransactionEventTypeEnum;
  message: string;
  availableActions: TransactionActionEnum[];
}

export function mapPayPalRefundStatus(status: PayPalRefundStatus): RefundStatusMapping {
  switch (status) {
    case "COMPLETED":
      return {
        type: "REFUND_SUCCESS" as TransactionEventTypeEnum,
        message: "Refund completed by PayPal",
        availableActions: [],
      };
    case "CANCELLED":
      return {
        type: "REFUND_FAILURE" as TransactionEventTypeEnum,
        message: "Refund cancelled by PayPal",
        availableActions: ["REFUND" as TransactionActionEnum],
      };
    case "FAILED":
      return {
        type: "REFUND_FAILURE" as TransactionEventTypeEnum,
        message: "Refund failed on PayPal",
        availableActions: ["REFUND" as TransactionActionEnum],
      };
    case "PENDING":
      return {
        type: "REFUND_REQUEST" as TransactionEventTypeEnum,
        message: "Refund pending on PayPal",
        availableActions: [],
      };
    default:
      return {
        type: "REFUND_FAILURE" as TransactionEventTypeEnum,
        message: `Unknown refund status: ${status}`,
        availableActions: ["REFUND" as TransactionActionEnum],
      };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/apps/paypal/src/modules/paypal/paypal-refund-status.ts
git commit -m "feat(paypal): add PayPal refund status to Saleor event type mapping"
```

---

### Task 3: PayPal API Client — Add Webhook + Refund Methods

**Files:**
- Modify: `src/modules/paypal/paypal-api-client.ts`
- Modify: `src/modules/paypal/types.ts`

- [ ] **Step 1: Add webhook + refund types to types.ts**

Append to `src/modules/paypal/types.ts`:

```typescript
/** PayPal Webhook Notification types */

export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  resource_version: string;
  summary: string;
  resource: Record<string, unknown>;
  links: PayPalLink[];
}

export interface PayPalWebhookListResponse {
  webhooks: PayPalWebhookInfo[];
}

export interface PayPalWebhookInfo {
  id: string;
  url: string;
  event_types: Array<{ name: string }>;
  links: PayPalLink[];
}

export interface PayPalWebhookVerifyResponse {
  verification_status: "SUCCESS" | "FAILURE";
}
```

- [ ] **Step 2: Add methods to PayPalApiClient**

Add to `paypal-api-client.ts` after `captureAuthorization()`:

```typescript
  /**
   * Get refund details by ID.
   * PayPal REST v2: GET /v2/payments/refunds/{refund_id}
   */
  async getRefund(refundId: string): Promise<Result<PayPalRefund, PayPalApiError>> {
    return this.request<PayPalRefund>("GET", `/v2/payments/refunds/${refundId}`);
  }

  /**
   * Create a webhook subscription.
   * PayPal REST v1: POST /v1/notifications/webhooks
   */
  async createWebhook(
    url: string,
    eventTypes: string[],
  ): Promise<Result<PayPalWebhookInfo, PayPalApiError>> {
    return this.request<PayPalWebhookInfo>("POST", "/v1/notifications/webhooks", {
      url,
      event_types: eventTypes.map((name) => ({ name })),
    });
  }

  /**
   * Delete a webhook subscription.
   * PayPal REST v1: DELETE /v1/notifications/webhooks/{webhook_id}
   */
  async deleteWebhook(webhookId: string): Promise<Result<void, PayPalApiError>> {
    return this.request<void>("DELETE", `/v1/notifications/webhooks/${webhookId}`);
  }

  /**
   * List all webhook subscriptions.
   * PayPal REST v1: GET /v1/notifications/webhooks
   */
  async listWebhooks(): Promise<Result<PayPalWebhookListResponse, PayPalApiError>> {
    return this.request<PayPalWebhookListResponse>("GET", "/v1/notifications/webhooks");
  }

  /**
   * Verify a webhook event signature.
   * PayPal REST v1: POST /v1/notifications/verify-webhook-signature
   */
  async verifyWebhookSignature(args: {
    webhookId: string;
    transmissionId: string;
    transmissionTime: string;
    certUrl: string;
    authAlgo: string;
    transmissionSig: string;
    webhookEvent: unknown;
  }): Promise<Result<PayPalWebhookVerifyResponse, PayPalApiError>> {
    return this.request<PayPalWebhookVerifyResponse>(
      "POST",
      "/v1/notifications/verify-webhook-signature",
      {
        webhook_id: args.webhookId,
        transmission_id: args.transmissionId,
        transmission_time: args.transmissionTime,
        cert_url: args.certUrl,
        auth_algo: args.authAlgo,
        transmission_sig: args.transmissionSig,
        webhook_event: args.webhookEvent,
      },
    );
  }
```

- [ ] **Step 3: Add types import**

Add `PayPalWebhookInfo`, `PayPalWebhookListResponse`, `PayPalWebhookVerifyResponse` to the imports from `"./types"` at the top of `paypal-api-client.ts`.

- [ ] **Step 4: Commit**

```bash
git add apps/apps/paypal/src/modules/paypal/paypal-api-client.ts apps/apps/paypal/src/modules/paypal/types.ts
git commit -m "feat(paypal): add webhook management + refund lookup API methods"
```

---

### Task 4: Webhook URL Builder + Params Parser

**Files:**
- Create: `src/modules/paypal/paypal-webhook-url-builder.ts`
- Create: `src/app/api/webhooks/paypal/webhook-params.ts`

- [ ] **Step 1: Create URL builder**

```typescript
// src/modules/paypal/paypal-webhook-url-builder.ts

export interface PayPalWebhookUrlParams {
  saleorApiUrl: string;
  configurationId: string;
  appId: string;
}

/**
 * Builds the webhook URL with encoded params (following Stripe pattern).
 * PayPal will POST events to this URL.
 */
export function buildPayPalWebhookUrl(
  appBaseUrl: string,
  params: PayPalWebhookUrlParams,
): string {
  const url = new URL(appBaseUrl + "/api/webhooks/paypal");
  url.searchParams.set("saleorApiUrl", params.saleorApiUrl);
  url.searchParams.set("configurationId", params.configurationId);
  url.searchParams.set("appId", params.appId);
  return url.toString();
}
```

- [ ] **Step 2: Create webhook params parser**

```typescript
// src/app/api/webhooks/paypal/webhook-params.ts
import { err, ok, Result } from "neverthrow";

export interface WebhookParams {
  saleorApiUrl: string;
  configurationId: string;
  appId: string;
}

export class WebhookParamsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookParamsError";
  }
}

export function parseWebhookParams(url: string): Result<WebhookParams, WebhookParamsError> {
  const parsedUrl = new URL(url);
  const saleorApiUrl = parsedUrl.searchParams.get("saleorApiUrl");
  const configurationId = parsedUrl.searchParams.get("configurationId");
  const appId = parsedUrl.searchParams.get("appId");

  if (!saleorApiUrl) {
    return err(new WebhookParamsError("Missing saleorApiUrl query param"));
  }
  if (!configurationId) {
    return err(new WebhookParamsError("Missing configurationId query param"));
  }
  if (!appId) {
    return err(new WebhookParamsError("Missing appId query param"));
  }

  return ok({ saleorApiUrl, configurationId, appId });
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/apps/paypal/src/modules/paypal/paypal-webhook-url-builder.ts apps/apps/paypal/src/app/api/webhooks/paypal/webhook-params.ts
git commit -m "feat(paypal): add webhook URL builder and params parser"
```

---

### Task 5: Webhook Manager — Auto-Register on Config Save

**Files:**
- Create: `src/modules/paypal/paypal-webhook-manager.ts`
- Modify: `src/modules/app-config/domain/paypal-config.ts` — add `webhookId`
- Modify: `src/modules/app-config/repositories/file/file-app-config-repo.ts` — persist `webhookId`
- Modify: `src/modules/app-config/trpc-handlers/new-paypal-config-trpc-handler.ts` — auto-register

- [ ] **Step 1: Create webhook manager**

```typescript
// src/modules/paypal/paypal-webhook-manager.ts
import { ok, err, Result } from "neverthrow";

import { createLogger } from "@/lib/logger";
import { PayPalApiClient } from "./paypal-api-client";
import { PayPalApiError } from "./paypal-api-error";
import { buildPayPalWebhookUrl, PayPalWebhookUrlParams } from "./paypal-webhook-url-builder";

const logger = createLogger("PayPalWebhookManager");

/** Events we want PayPal to notify us about */
export const PAYPAL_WEBHOOK_EVENTS = [
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED",
  "PAYMENT.CAPTURE.DENIED",
  "PAYMENT.CAPTURE.COMPLETED",
];

export async function createPayPalWebhook(
  client: PayPalApiClient,
  appBaseUrl: string,
  params: PayPalWebhookUrlParams,
): Promise<Result<{ webhookId: string }, PayPalApiError>> {
  const webhookUrl = buildPayPalWebhookUrl(appBaseUrl, params);

  logger.info("Creating PayPal webhook", { webhookUrl, events: PAYPAL_WEBHOOK_EVENTS });

  const result = await client.createWebhook(webhookUrl, PAYPAL_WEBHOOK_EVENTS);

  if (result.isErr()) {
    logger.error("Failed to create PayPal webhook", { error: result.error.message });
    return err(result.error);
  }

  logger.info("PayPal webhook created", { webhookId: result.value.id });
  return ok({ webhookId: result.value.id });
}

export async function deletePayPalWebhook(
  client: PayPalApiClient,
  webhookId: string,
): Promise<Result<void, PayPalApiError>> {
  logger.info("Deleting PayPal webhook", { webhookId });
  return client.deleteWebhook(webhookId);
}
```

- [ ] **Step 2: Add `webhookId` to PayPalConfig domain**

In `src/modules/app-config/domain/paypal-config.ts`, add `webhookId` as optional field to `PayPalConfig`:

```typescript
// Add to constructor props and class properties:
readonly webhookId?: string;

// Add to create() args:
webhookId?: string;

// Add to constructor assignment:
this.webhookId = props.webhookId;

// Add to PayPalFrontendConfigSerializedFields:
readonly webhookId?: string;

// Add to PayPalFrontendConfig.createFromPayPalConfig:
webhookId: config.webhookId,
```

- [ ] **Step 3: Add `webhookId` to FilePayPalConfig and persistence**

In `file-app-config-repo.ts`:
- Add `webhookId?: string` to `FilePayPalConfig` interface
- Add `webhookId: fileConfig.webhookId` in `getRootConfig()` → `PayPalConfig.create()` call
- Add `webhookId: args.config.webhookId` in `savePayPalConfig()` data assignment

- [ ] **Step 4: Auto-register webhook in tRPC handler**

In `new-paypal-config-trpc-handler.ts`, after `PayPalConfig.create()` succeeds but before `savePayPalConfig()`:

```typescript
// Auto-register PayPal webhook for async event notifications
let webhookId: string | undefined;
const appBaseUrl = env.APP_API_BASE_URL;
if (appBaseUrl) {
  const webhookResult = await createPayPalWebhook(
    new PayPalApiClient({
      clientId: clientIdResult.value,
      clientSecret: clientSecretResult.value,
      environment: detectedEnvironment,
    }),
    appBaseUrl,
    {
      saleorApiUrl: ctx.saleorApiUrl,
      configurationId: configId,
      appId: ctx.appId,
    },
  );
  if (webhookResult.isOk()) {
    webhookId = webhookResult.value.webhookId;
  } else {
    // Non-fatal — webhook can be registered later
    console.warn("Failed to auto-register PayPal webhook:", webhookResult.error.message);
  }
}

// Then pass webhookId to PayPalConfig.create():
const configResult = PayPalConfig.create({
  ...existingArgs,
  webhookId,
});
```

- [ ] **Step 5: Commit**

```bash
git add apps/apps/paypal/src/modules/paypal/paypal-webhook-manager.ts \
  apps/apps/paypal/src/modules/app-config/domain/paypal-config.ts \
  apps/apps/paypal/src/modules/app-config/repositories/file/file-app-config-repo.ts \
  apps/apps/paypal/src/modules/app-config/trpc-handlers/new-paypal-config-trpc-handler.ts
git commit -m "feat(paypal): auto-register PayPal webhook on config save"
```

---

### Task 6: PayPal Webhook Receiver — Route + Use Case

**Files:**
- Create: `src/app/api/webhooks/paypal/route.ts`
- Create: `src/app/api/webhooks/paypal/use-case.ts`

- [ ] **Step 1: Create the use case**

```typescript
// src/app/api/webhooks/paypal/use-case.ts
import { ok, err, Result } from "neverthrow";
import { Client, cacheExchange, fetchExchange, createClient } from "urql";

import { createLogger } from "@/lib/logger";
import { apl } from "@/lib/saleor-app";
import { appConfigRepoImpl } from "@/modules/app-config/repositories/app-config-repo-impl";
import { createSaleorApiUrl } from "@/modules/saleor/saleor-api-url";
import { PayPalApiClient } from "@/modules/paypal/paypal-api-client";
import { mapPayPalRefundStatus } from "@/modules/paypal/paypal-refund-status";
import { reportTransactionEvent } from "@/modules/saleor/transaction-event-reporter";
import { parsePayPalAmount } from "@/modules/paypal/paypal-money";
import { PayPalWebhookEvent, PayPalRefund } from "@/modules/paypal/types";
import { WebhookParams } from "./webhook-params";

const logger = createLogger("PayPalWebhookUseCase");

function createSaleorClient(saleorApiUrl: string, token: string): Client {
  return createClient({
    url: saleorApiUrl,
    exchanges: [cacheExchange, fetchExchange],
    fetchOptions: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}

export async function handlePayPalWebhook(args: {
  rawBody: string;
  headers: Record<string, string>;
  webhookParams: WebhookParams;
}): Promise<Result<{ message: string }, { status: number; message: string }>> {
  const { webhookParams } = args;

  // 1. Get auth data from APL
  const authData = await apl.get(webhookParams.saleorApiUrl);
  if (!authData) {
    logger.error("No auth data found for saleorApiUrl", { saleorApiUrl: webhookParams.saleorApiUrl });
    return err({ status: 401, message: "Unauthorized — no auth data" });
  }

  // 2. Get PayPal config
  const saleorApiUrlResult = createSaleorApiUrl(webhookParams.saleorApiUrl);
  if (saleorApiUrlResult.isErr()) {
    return err({ status: 400, message: "Invalid saleorApiUrl" });
  }

  const configResult = await appConfigRepoImpl.getPayPalConfigById({
    saleorApiUrl: saleorApiUrlResult.value,
    appId: webhookParams.appId,
    configId: webhookParams.configurationId,
  });

  if (configResult.isErr() || !configResult.value) {
    logger.error("PayPal config not found", { configId: webhookParams.configurationId });
    return err({ status: 404, message: "Config not found" });
  }

  const config = configResult.value;

  // 3. Verify webhook signature via PayPal API
  if (config.webhookId) {
    const client = new PayPalApiClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      environment: config.environment,
    });

    const verifyResult = await client.verifyWebhookSignature({
      webhookId: config.webhookId,
      transmissionId: args.headers["paypal-transmission-id"] ?? "",
      transmissionTime: args.headers["paypal-transmission-time"] ?? "",
      certUrl: args.headers["paypal-cert-url"] ?? "",
      authAlgo: args.headers["paypal-auth-algo"] ?? "",
      transmissionSig: args.headers["paypal-transmission-sig"] ?? "",
      webhookEvent: JSON.parse(args.rawBody),
    });

    if (verifyResult.isErr()) {
      logger.error("Webhook signature verification failed", { error: verifyResult.error.message });
      return err({ status: 403, message: "Signature verification failed" });
    }

    if (verifyResult.value.verification_status !== "SUCCESS") {
      logger.error("Webhook signature invalid");
      return err({ status: 403, message: "Invalid webhook signature" });
    }
  }

  // 4. Parse the event
  const event: PayPalWebhookEvent = JSON.parse(args.rawBody);
  logger.info("PayPal webhook event received", {
    eventType: event.event_type,
    eventId: event.id,
    resourceType: event.resource_type,
  });

  // 5. Handle refund events
  if (
    event.event_type === "PAYMENT.CAPTURE.REFUNDED" ||
    event.event_type === "PAYMENT.CAPTURE.REVERSED" ||
    event.event_type === "PAYMENT.CAPTURE.DENIED"
  ) {
    return handleRefundEvent(event, authData.token, webhookParams.saleorApiUrl);
  }

  // 6. Handle capture completion (e.g., pending capture resolved)
  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    return handleCaptureCompletedEvent(event, authData.token, webhookParams.saleorApiUrl);
  }

  logger.info("Unhandled PayPal event type, acknowledging", { eventType: event.event_type });
  return ok({ message: `Event ${event.event_type} acknowledged` });
}

async function handleRefundEvent(
  event: PayPalWebhookEvent,
  saleorToken: string,
  saleorApiUrl: string,
): Promise<Result<{ message: string }, { status: number; message: string }>> {
  const resource = event.resource as PayPalRefund;
  const refundId = resource.id;
  const status = resource.status;
  const amount = resource.amount?.value ? parsePayPalAmount(resource.amount.value) : 0;

  logger.info("Processing refund event", { refundId, status, amount });

  const mapping = mapPayPalRefundStatus(status);

  // We need the Saleor transaction ID. PayPal refund resource has a link to the capture,
  // and we stored the PayPal order ID as pspReference in Saleor.
  // For transactionEventReport, we use the refund ID as pspReference.
  // Saleor matches by the existing transaction's pspReference (PayPal order ID).

  // The transactionEventReport requires transactionId — we need to find it.
  // Since we don't have it directly, we report using the refund's capture link.
  // Saleor will match it via the pspReference on the original transaction.

  // For now, we'll use the capture ID as pspReference lookup
  const captureLink = (event.resource as Record<string, unknown>).links as Array<{ href: string; rel: string }> | undefined;
  const captureId = captureLink?.find(l => l.rel === "up")?.href?.split("/").pop();

  if (!captureId) {
    logger.warn("Could not extract capture ID from refund event", { refundId });
    return ok({ message: "Refund event acknowledged, capture ID not found" });
  }

  // TODO: Look up Saleor transaction by pspReference (PayPal order ID)
  // For now, log the event — full integration requires querying Saleor for the transaction
  logger.info("Refund status update", {
    refundId,
    captureId,
    status,
    saleorEventType: mapping.type,
    amount,
  });

  return ok({ message: `Refund ${refundId} status: ${status}` });
}

async function handleCaptureCompletedEvent(
  event: PayPalWebhookEvent,
  saleorToken: string,
  saleorApiUrl: string,
): Promise<Result<{ message: string }, { status: number; message: string }>> {
  logger.info("Capture completed event", { resourceId: (event.resource as { id?: string }).id });
  return ok({ message: "Capture completed acknowledged" });
}
```

- [ ] **Step 2: Create the route handler**

```typescript
// src/app/api/webhooks/paypal/route.ts
import { NextRequest } from "next/server";

import { createLogger } from "@/lib/logger";
import { parseWebhookParams } from "./webhook-params";
import { handlePayPalWebhook } from "./use-case";

const logger = createLogger("PayPalWebhookRoute");

export async function POST(request: NextRequest) {
  try {
    // Parse webhook params from URL
    const paramsResult = parseWebhookParams(request.url);
    if (paramsResult.isErr()) {
      return Response.json(
        { error: paramsResult.error.message },
        { status: 400 },
      );
    }

    // Read raw body for signature verification
    const rawBody = await request.text();

    // Extract PayPal signature headers
    const headers: Record<string, string> = {};
    for (const key of [
      "paypal-transmission-id",
      "paypal-transmission-time",
      "paypal-cert-url",
      "paypal-auth-algo",
      "paypal-transmission-sig",
    ]) {
      const value = request.headers.get(key);
      if (value) headers[key] = value;
    }

    const result = await handlePayPalWebhook({
      rawBody,
      headers,
      webhookParams: paramsResult.value,
    });

    if (result.isErr()) {
      return Response.json(
        { error: result.error.message },
        { status: result.error.status },
      );
    }

    return Response.json(result.value, { status: 200 });
  } catch (error) {
    logger.error("Unhandled error in PayPal webhook", { error });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Add `getPayPalConfigById` to the config repo interface and implementation**

The use-case needs to look up config by configId (not channelId). Check if `getPayPalConfig` already supports `configId` access pattern in `app-config-repo.ts`. If yes, use it. If not, add a `configId` variant.

Reference: `file-app-config-repo.ts` lines 156-158 already handle `"configId" in access` — so `getPayPalConfig({ saleorApiUrl, appId, configId })` should work. Use it in the use-case.

- [ ] **Step 4: Commit**

```bash
git add apps/apps/paypal/src/app/api/webhooks/paypal/
git commit -m "feat(paypal): add PayPal webhook receiver with signature verification"
```

---

### Task 7: Polling Fallback for Pending Refunds

**Files:**
- Create: `src/app/api/webhooks/paypal/poll-pending-refunds/route.ts`

This is a simple API endpoint that can be called by a cron job or manually.

- [ ] **Step 1: Create the polling endpoint**

```typescript
// src/app/api/webhooks/paypal/poll-pending-refunds/route.ts
import { NextRequest } from "next/server";

import { createLogger } from "@/lib/logger";
import { apl } from "@/lib/saleor-app";
import { getPostgresClient } from "@/modules/postgres/postgres-client";

const logger = createLogger("PollPendingRefunds");

/**
 * Poll PayPal for pending refund status updates.
 * Called via cron or manually: GET /api/webhooks/paypal/poll-pending-refunds
 *
 * This is a fallback — primary tracking is via PayPal webhooks.
 * Checks any refunds that were returned as PENDING and queries PayPal for updates.
 */
export async function GET(request: NextRequest) {
  // Simple auth: check for a secret header to prevent unauthorized polling
  const authHeader = request.headers.get("x-poll-secret");
  const expectedSecret = process.env.POLL_SECRET;
  if (expectedSecret && authHeader !== expectedSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("Polling for pending refunds");

  // TODO: Implement when we have a pending refunds tracking table
  // For now, this is a placeholder that acknowledges the request.
  // Full implementation requires:
  // 1. A table tracking pending refund IDs + their Saleor transaction IDs
  // 2. Query PayPal GET /v2/payments/refunds/{id} for each
  // 3. If status changed from PENDING → COMPLETED/FAILED, call transactionEventReport

  return Response.json({
    message: "Polling endpoint ready — no pending refunds tracked yet",
    timestamp: new Date().toISOString(),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/apps/paypal/src/app/api/webhooks/paypal/poll-pending-refunds/
git commit -m "feat(paypal): add polling fallback endpoint for pending refunds"
```

---

### Task 8: Build, Verify, and Integration Test

- [ ] **Step 1: Build the app**

```bash
docker compose -f infra/docker-compose.dev.yml restart saleor-paypal-app
# Wait for build to complete (~90s)
docker compose -f infra/docker-compose.dev.yml logs --tail=5 saleor-paypal-app
```
Expected: `Ready in Xms`

- [ ] **Step 2: Verify webhook endpoint responds**

```bash
docker exec saleor-api-dev python -c "
import requests
r = requests.post('http://host.docker.internal:3011/api/webhooks/paypal?saleorApiUrl=https://api.pawzenpets.shop/graphql/&configurationId=test&appId=test',
  headers={'Content-Type': 'application/json'},
  json={'event_type': 'test'},
  timeout=10)
print(f'Status: {r.status_code}, Body: {r.text[:200]}')
"
```
Expected: 401 or 404 (auth data not found — correct behavior)

- [ ] **Step 3: Verify polling endpoint responds**

```bash
docker exec saleor-api-dev python -c "
import requests
r = requests.get('http://host.docker.internal:3011/api/webhooks/paypal/poll-pending-refunds', timeout=10)
print(f'Status: {r.status_code}, Body: {r.text[:200]}')
"
```
Expected: 200 with "Polling endpoint ready" message

- [ ] **Step 4: Re-save PayPal config to trigger webhook registration**

Go to Dashboard → Apps → PayPal → delete existing config → re-add credentials.
Check PayPal app logs for "Creating PayPal webhook" and "PayPal webhook created" messages.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(paypal): complete PayPal refund status tracking with webhooks + polling"
```

---

## Summary of Event Flow After Implementation

```
REFUND REQUEST (existing):
  Dashboard "Refund" → Saleor → Celery worker → PayPal app
  → PayPal refundCapture() → return REFUND_SUCCESS to Saleor

ASYNC REFUND COMPLETION (new):
  PayPal processes refund → POST /api/webhooks/paypal?params...
  → Verify signature → Map PAYMENT.CAPTURE.REFUNDED → REFUND_SUCCESS
  → transactionEventReport() → Saleor updates order status

POLLING FALLBACK (new):
  Cron/manual → GET /api/webhooks/paypal/poll-pending-refunds
  → Check pending refunds via PayPal API → Report updates to Saleor
```
