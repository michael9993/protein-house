export const SupplierErrorCode = {
  AUTH_FAILED: "AUTH_FAILED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  ORDER_FAILED: "ORDER_FAILED",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  TRACKING_NOT_AVAILABLE: "TRACKING_NOT_AVAILABLE",
  RATE_LIMITED: "RATE_LIMITED",
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_REQUEST: "INVALID_REQUEST",
  SUPPLIER_UNAVAILABLE: "SUPPLIER_UNAVAILABLE",
} as const;

export type SupplierErrorCode = (typeof SupplierErrorCode)[keyof typeof SupplierErrorCode];

export interface SupplierErrorContext {
  /** The HTTP status code from the supplier API, if applicable. */
  httpStatus?: number;
  /** The raw response body or message from the supplier API. */
  rawResponse?: unknown;
  /** The API method or endpoint that was called. */
  apiMethod?: string;
  /** The request parameters (sanitized — no secrets). */
  requestParams?: Record<string, unknown>;
  /** How many retry attempts were made before giving up. */
  retryAttempts?: number;
}

export class SupplierError extends Error {
  public readonly code: SupplierErrorCode;
  public readonly supplierId: string;
  public readonly context: SupplierErrorContext;
  public readonly originalCause: unknown;

  constructor(params: {
    code: SupplierErrorCode;
    message: string;
    supplierId: string;
    context?: SupplierErrorContext;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = "SupplierError";
    this.code = params.code;
    this.supplierId = params.supplierId;
    this.context = params.context ?? {};
    this.originalCause = params.cause;
  }

  /** True when the caller should retry (network issues, rate limiting, temporary unavailability). */
  get isRetryable(): boolean {
    return [
      SupplierErrorCode.RATE_LIMITED,
      SupplierErrorCode.NETWORK_ERROR,
      SupplierErrorCode.SUPPLIER_UNAVAILABLE,
    ].includes(this.code);
  }

  /** True when re-authentication is needed. */
  get isAuthRelated(): boolean {
    return [SupplierErrorCode.AUTH_FAILED, SupplierErrorCode.TOKEN_EXPIRED].includes(this.code);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      supplierId: this.supplierId,
      context: this.context,
    };
  }

  // ---- Convenience factory methods ----

  static authFailed(supplierId: string, message: string, context?: SupplierErrorContext): SupplierError {
    return new SupplierError({
      code: SupplierErrorCode.AUTH_FAILED,
      message,
      supplierId,
      context,
    });
  }

  static tokenExpired(supplierId: string, context?: SupplierErrorContext): SupplierError {
    return new SupplierError({
      code: SupplierErrorCode.TOKEN_EXPIRED,
      message: "Access token has expired",
      supplierId,
      context,
    });
  }

  static orderFailed(supplierId: string, message: string, context?: SupplierErrorContext): SupplierError {
    return new SupplierError({
      code: SupplierErrorCode.ORDER_FAILED,
      message,
      supplierId,
      context,
    });
  }

  static orderNotFound(supplierId: string, orderId: string, context?: SupplierErrorContext): SupplierError {
    return new SupplierError({
      code: SupplierErrorCode.ORDER_NOT_FOUND,
      message: `Order ${orderId} not found`,
      supplierId,
      context,
    });
  }

  static trackingNotAvailable(supplierId: string, orderId: string, context?: SupplierErrorContext): SupplierError {
    return new SupplierError({
      code: SupplierErrorCode.TRACKING_NOT_AVAILABLE,
      message: `Tracking information not available for order ${orderId}`,
      supplierId,
      context,
    });
  }

  static rateLimited(supplierId: string, context?: SupplierErrorContext): SupplierError {
    return new SupplierError({
      code: SupplierErrorCode.RATE_LIMITED,
      message: "Rate limit exceeded",
      supplierId,
      context,
    });
  }

  static networkError(supplierId: string, message: string, cause?: unknown, context?: SupplierErrorContext): SupplierError {
    return new SupplierError({
      code: SupplierErrorCode.NETWORK_ERROR,
      message,
      supplierId,
      context,
      cause,
    });
  }

  static invalidRequest(supplierId: string, message: string, context?: SupplierErrorContext): SupplierError {
    return new SupplierError({
      code: SupplierErrorCode.INVALID_REQUEST,
      message,
      supplierId,
      context,
    });
  }

  static supplierUnavailable(supplierId: string, context?: SupplierErrorContext): SupplierError {
    return new SupplierError({
      code: SupplierErrorCode.SUPPLIER_UNAVAILABLE,
      message: `Supplier ${supplierId} is currently unavailable`,
      supplierId,
      context,
    });
  }
}
