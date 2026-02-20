import { err, ok, Result } from "neverthrow";

import { createLogger } from "@/logger";

import { SupplierError } from "../errors";
import type {
  AuthToken,
  ShippingOption,
  StockInfo,
  SupplierAdapter,
  SupplierCredentials,
  SupplierOrderRequest,
  SupplierOrderResponse,
  SupplierOrderStatus,
  SupplierProduct,
  TrackingInfo,
} from "../types";
import { del, get, patch, post } from "./api-client";
import { getAccessToken, refreshAccessToken } from "./auth";
import {
  mapAddress,
  mapOrderStatus,
  mapProductInfo,
  mapShippingOptions,
  mapStockInfo,
  mapTrackingInfo,
} from "./mappers";
import type {
  CJFreightResult,
  CJOrderCreateResult,
  CJOrderDetail,
  CJProductInfo,
  CJStockInfo,
  CJTrackingData,
} from "./types";

const logger = createLogger("CJAdapter");

/** Maximum number of parallel getStock calls in getStockBatch. */
const STOCK_BATCH_CONCURRENCY = 5;

export class CJAdapter implements SupplierAdapter {
  public readonly id = "cj" as const;
  public readonly name = "CJ Dropshipping";
  public readonly supportsWebhooks = true;

  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------

  async authenticate(
    credentials: SupplierCredentials,
  ): Promise<Result<AuthToken, SupplierError>> {
    if (credentials.type !== "cj") {
      return err(
        SupplierError.invalidRequest("cj", "Invalid credential type for CJ adapter"),
      );
    }

    return getAccessToken(credentials.apiKey);
  }

  async refreshToken(token: AuthToken): Promise<Result<AuthToken, SupplierError>> {
    if (!token.refreshToken) {
      return err(
        SupplierError.authFailed("cj", "No refresh token available. Re-authentication required."),
      );
    }

    return refreshAccessToken(token.refreshToken);
  }

  isTokenValid(token: AuthToken): boolean {
    // Consider token invalid 1 day before actual expiry to provide buffer
    const bufferMs = 24 * 60 * 60 * 1_000;
    return token.expiresAt.getTime() - bufferMs > Date.now();
  }

  // -------------------------------------------------------------------------
  // Orders
  // -------------------------------------------------------------------------

  async placeOrder(
    request: SupplierOrderRequest,
    token: AuthToken,
  ): Promise<Result<SupplierOrderResponse, SupplierError>> {
    const address = mapAddress(request.shippingAddress);

    const body = {
      orderNumber: request.idempotencyKey,
      ...address,
      logisticName: request.shippingMethod,
      fromCountryCode: "CN", // CJ ships from China by default
      products: [
        {
          vid: request.supplierSku,
          quantity: request.quantity,
        },
      ],
    };

    const result = await post<CJOrderCreateResult>(
      "/shopping/order/createOrderV2",
      token.accessToken,
      body,
    );

    return result.andThen(async (data) => {
      if (!data.orderId) {
        return err(
          SupplierError.orderFailed("cj", "Order creation returned no order ID", {
            apiMethod: "POST /shopping/order/createOrderV2",
            rawResponse: data,
          }),
        );
      }

      logger.info("CJ order created", { orderId: data.orderId });

      // CJ workflow: Create → Confirm → (CJ processes payment from balance)
      // The confirm step transitions the order from CREATED to UNPAID/processing.
      const confirmResult = await patch<{ orderId: string }>(
        "/shopping/order/confirmOrder",
        token.accessToken,
        { orderId: data.orderId },
      );

      if (confirmResult.isErr()) {
        logger.warn("CJ order confirm failed (order was created but not confirmed)", {
          orderId: data.orderId,
          error: confirmResult.error.message,
        });
        // Don't fail the whole operation — the order exists, admin can confirm manually
      } else {
        logger.info("CJ order confirmed", { orderId: data.orderId });
      }

      return ok<SupplierOrderResponse, SupplierError>({
        supplierOrderId: data.orderId,
        cost: {
          amount: 0, // Cost is determined after order confirmation in CJ
          currency: "USD",
        },
      });
    });
  }

  async getOrderStatus(
    supplierOrderId: string,
    token: AuthToken,
  ): Promise<Result<SupplierOrderStatus, SupplierError>> {
    const result = await get<CJOrderDetail>(
      "/shopping/order/getOrderDetail",
      token.accessToken,
      { orderId: supplierOrderId },
    );

    return result.andThen((data) => {
      if (!data.orderStatus) {
        return err(
          SupplierError.orderNotFound("cj", supplierOrderId, {
            apiMethod: "GET /shopping/order/getOrderDetail",
            rawResponse: data,
          }),
        );
      }

      return ok(mapOrderStatus(data.orderStatus));
    });
  }

  async getTrackingInfo(
    supplierOrderId: string,
    token: AuthToken,
  ): Promise<Result<TrackingInfo, SupplierError>> {
    // CJ tracking endpoint uses trackNumber, not orderId.
    // First fetch the order detail to get the trackNumber.
    const orderResult = await get<CJOrderDetail>(
      "/shopping/order/getOrderDetail",
      token.accessToken,
      { orderId: supplierOrderId },
    );

    if (orderResult.isErr()) {
      return err(orderResult.error);
    }

    const trackNumber = orderResult.value.trackNumber;

    if (!trackNumber) {
      return err(
        SupplierError.trackingNotAvailable("cj", supplierOrderId, {
          apiMethod: "GET /shopping/order/getOrderDetail",
          rawResponse: orderResult.value,
        }),
      );
    }

    // Now fetch detailed tracking info using the trackNumber
    const result = await get<CJTrackingData>(
      "/logistic/trackInfo",
      token.accessToken,
      { trackNumber },
    );

    return result.andThen((data) => {
      if (!data.trackNumber) {
        // Fallback: return basic tracking from order detail
        return ok<TrackingInfo, SupplierError>({
          trackingNumber: trackNumber,
          carrier: orderResult.value.logisticName ?? "Unknown",
          status: mapOrderStatus(orderResult.value.orderStatus),
          events: [],
        });
      }

      return ok(mapTrackingInfo(data));
    });
  }

  async cancelOrder(
    supplierOrderId: string,
    token: AuthToken,
  ): Promise<Result<void, SupplierError>> {
    const result = await del<null>(
      "/shopping/order/deleteOrder",
      token.accessToken,
      { orderId: supplierOrderId },
    );

    return result.andThen(() => {
      logger.info("CJ order cancelled", { orderId: supplierOrderId });
      return ok(undefined);
    });
  }

  // -------------------------------------------------------------------------
  // Shipping
  // -------------------------------------------------------------------------

  async getShippingOptions(
    supplierSku: string,
    destinationCountry: string,
    quantity: number,
    token: AuthToken,
  ): Promise<Result<ShippingOption[], SupplierError>> {
    const body = {
      startCountryCode: "CN",
      endCountryCode: destinationCountry,
      products: [
        {
          quantity,
          vid: supplierSku,
        },
      ],
    };

    const result = await post<CJFreightResult[]>(
      "/logistic/freightCalculate",
      token.accessToken,
      body,
    );

    return result.map((data) => mapShippingOptions(data ?? []));
  }

  // -------------------------------------------------------------------------
  // Catalog
  // -------------------------------------------------------------------------

  async getProduct(
    supplierProductId: string,
    token: AuthToken,
  ): Promise<Result<SupplierProduct, SupplierError>> {
    const result = await get<CJProductInfo>(
      "/product/query",
      token.accessToken,
      { pid: supplierProductId },
    );

    return result.andThen((data) => {
      if (!data.pid) {
        return err(
          SupplierError.invalidRequest("cj", `Product ${supplierProductId} not found`, {
            apiMethod: "GET /product/query",
            rawResponse: data,
          }),
        );
      }

      return ok(mapProductInfo(data));
    });
  }

  async getStock(
    supplierSku: string,
    token: AuthToken,
  ): Promise<Result<StockInfo, SupplierError>> {
    const result = await get<CJStockInfo>(
      "/product/stock/queryByVid",
      token.accessToken,
      { vid: supplierSku },
    );

    return result.andThen((data) => {
      if (!data.vid) {
        return err(
          SupplierError.invalidRequest("cj", `Stock data not found for SKU ${supplierSku}`, {
            apiMethod: "GET /product/stock/queryByVid",
            rawResponse: data,
          }),
        );
      }

      return ok(mapStockInfo(data));
    });
  }

  async getStockBatch(
    supplierSkus: string[],
    token: AuthToken,
  ): Promise<Result<StockInfo[], SupplierError>> {
    const results: StockInfo[] = [];
    const errors: SupplierError[] = [];

    // Process in chunks to respect concurrency limit
    for (let i = 0; i < supplierSkus.length; i += STOCK_BATCH_CONCURRENCY) {
      const chunk = supplierSkus.slice(i, i + STOCK_BATCH_CONCURRENCY);

      const chunkResults = await Promise.allSettled(
        chunk.map((sku) => this.getStock(sku, token).then((r) => r)),
      );

      for (const settled of chunkResults) {
        if (settled.status === "fulfilled") {
          const result = settled.value;

          if (result.isOk()) {
            results.push(result.value);
          } else {
            errors.push(result.error);
          }
        } else {
          errors.push(
            SupplierError.networkError(
              "cj",
              settled.reason instanceof Error
                ? settled.reason.message
                : "Unknown error in batch stock check",
              settled.reason,
            ),
          );
        }
      }
    }

    // If we got at least some results, return them (partial success)
    if (results.length > 0) {
      if (errors.length > 0) {
        logger.warn(
          `CJ batch stock check had ${errors.length} failures out of ${supplierSkus.length} SKUs`,
        );
      }

      return ok(results);
    }

    // If ALL failed, return the first error
    if (errors.length > 0) {
      return err(errors[0]);
    }

    // Empty input → empty output
    return ok([]);
  }
}
