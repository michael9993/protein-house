/**
 * Typed response builders for all PayPal Saleor webhook handlers.
 *
 * Each function returns a `Response.json()` with the correct `result` type,
 * default `actions`, and optional fields. These replace the scattered inline
 * `Response.json({ result: "...", ... })` calls throughout the webhook routes,
 * giving a single source of truth for response shapes.
 */

// ---------------------------------------------------------------------------
// CHARGE responses (CAPTURE intent flow)
// ---------------------------------------------------------------------------

/**
 * Payment was captured successfully.
 * Used after `captureOrder()` or `captureAuthorization()` succeeds.
 *
 * Default actions: `["REFUND"]` — a captured payment can be refunded.
 */
export function chargeSuccessResponse(args: {
  pspReference: string;
  amount: number;
  externalUrl?: string;
  message?: string;
}): Response {
  return Response.json({
    result: "CHARGE_SUCCESS" as const,
    pspReference: args.pspReference,
    amount: args.amount,
    externalUrl: args.externalUrl,
    message: args.message ?? "Payment captured successfully",
    actions: ["REFUND"],
  });
}

/**
 * Payment capture failed or could not proceed.
 * Used when `captureOrder()` returns an error, order status is unexpected,
 * or required data (pspReference, order ID) is missing.
 *
 * Default actions: `["CHARGE"]` — allows Saleor to retry the charge.
 * Pass `actions: []` when the failure is non-retryable.
 */
export function chargeFailureResponse(args: {
  pspReference?: string;
  message: string;
  actions?: string[];
}): Response {
  return Response.json({
    result: "CHARGE_FAILURE" as const,
    ...(args.pspReference && { pspReference: args.pspReference }),
    message: args.message,
    actions: args.actions ?? ["CHARGE"],
  });
}

// ---------------------------------------------------------------------------
// AUTHORIZATION responses (AUTHORIZE intent flow)
// ---------------------------------------------------------------------------

/**
 * Payment was authorized successfully (funds placed on hold).
 * Used after `authorizeOrder()` succeeds or when the order is already
 * in COMPLETED status with an AUTHORIZE intent.
 *
 * Default actions: `["CHARGE", "CANCEL"]` — an authorization can be
 * captured (charged) or voided (cancelled).
 */
export function authorizationSuccessResponse(args: {
  pspReference: string;
  amount: number;
  externalUrl?: string;
  message?: string;
}): Response {
  return Response.json({
    result: "AUTHORIZATION_SUCCESS" as const,
    pspReference: args.pspReference,
    amount: args.amount,
    externalUrl: args.externalUrl,
    message: args.message ?? "Payment authorized successfully",
    actions: ["CHARGE", "CANCEL"],
  });
}

/**
 * Authorization failed or could not proceed.
 * Used when `authorizeOrder()` returns an error or order status is unexpected.
 *
 * Default actions: `[]` — a failed authorization has no follow-up actions.
 */
export function authorizationFailureResponse(args: {
  pspReference?: string;
  message: string;
  actions?: string[];
}): Response {
  return Response.json({
    result: "AUTHORIZATION_FAILURE" as const,
    ...(args.pspReference && { pspReference: args.pspReference }),
    message: args.message,
    actions: args.actions ?? [],
  });
}

// ---------------------------------------------------------------------------
// REFUND responses
// ---------------------------------------------------------------------------

/**
 * Refund was processed successfully.
 * Used after PayPal's `captureRefund()` returns a COMPLETED or PENDING status.
 *
 * Default actions: `[]` — a completed refund has no follow-up actions.
 */
export function refundSuccessResponse(args: {
  pspReference: string;
  amount: number;
  externalUrl?: string;
  message?: string;
}): Response {
  return Response.json({
    result: "REFUND_SUCCESS" as const,
    pspReference: args.pspReference,
    amount: args.amount,
    externalUrl: args.externalUrl,
    message: args.message ?? "Refund processed successfully",
    actions: [],
  });
}

/**
 * Refund failed or could not proceed.
 * Used when `captureRefund()` returns an error, the capture ID is missing,
 * or the refund status is not COMPLETED/PENDING.
 *
 * Default actions: `["REFUND"]` — allows Saleor to retry the refund.
 * Pass `actions: []` when the failure is non-retryable.
 */
export function refundFailureResponse(args: {
  pspReference?: string;
  message: string;
  actions?: string[];
}): Response {
  return Response.json({
    result: "REFUND_FAILURE" as const,
    ...(args.pspReference && { pspReference: args.pspReference }),
    message: args.message,
    actions: args.actions ?? ["REFUND"],
  });
}

// ---------------------------------------------------------------------------
// CANCEL responses
// ---------------------------------------------------------------------------

/**
 * Cancellation (void) succeeded.
 * Used when a PayPal order in CREATED, APPROVED, or VOIDED status
 * is acknowledged as cancelled.
 *
 * Default actions: `[]` — a cancelled transaction has no follow-up actions.
 */
export function cancelSuccessResponse(args: {
  pspReference: string;
  message?: string;
}): Response {
  return Response.json({
    result: "CANCEL_SUCCESS" as const,
    pspReference: args.pspReference,
    message: args.message ?? "Cancellation acknowledged",
    actions: [],
  });
}

/**
 * Cancellation failed or could not proceed.
 * Used when the order is in COMPLETED status (already captured) or
 * when required data is missing.
 *
 * Default actions: `[]` — a failed cancellation typically cannot be retried.
 */
export function cancelFailureResponse(args: {
  pspReference?: string;
  message: string;
  actions?: string[];
}): Response {
  return Response.json({
    result: "CANCEL_FAILURE" as const,
    ...(args.pspReference && { pspReference: args.pspReference }),
    message: args.message,
    actions: args.actions ?? [],
  });
}

// ---------------------------------------------------------------------------
// INITIALIZE responses (transaction-initialize-session)
// ---------------------------------------------------------------------------

/**
 * Transaction initialization succeeded — returns PayPal order data to the storefront.
 * Used after `createOrder()` succeeds and returns a client token / order ID.
 *
 * The `data` field carries the PayPal-specific payload (order ID, client ID, etc.)
 * that the storefront needs to render the PayPal buttons or card fields.
 *
 * Default actions: `[]` — the storefront drives the next step (approve → process).
 */
export function initializeActionRequiredResponse(args: {
  pspReference: string;
  data: Record<string, unknown>;
  amount?: number;
  message?: string;
}): Response {
  return Response.json({
    result: "AUTHORIZATION_ACTION_REQUIRED" as const,
    pspReference: args.pspReference,
    ...(args.amount !== undefined && { amount: args.amount }),
    data: args.data,
    message: args.message ?? "PayPal order created",
    actions: [],
  });
}

/**
 * Transaction initialization failed.
 * Used when `createOrder()` fails or required configuration is missing.
 */
export function initializeFailureResponse(args: {
  message: string;
  pspReference?: string;
}): Response {
  return Response.json({
    result: "AUTHORIZATION_FAILURE" as const,
    ...(args.pspReference && { pspReference: args.pspReference }),
    message: args.message,
    actions: [],
  });
}
