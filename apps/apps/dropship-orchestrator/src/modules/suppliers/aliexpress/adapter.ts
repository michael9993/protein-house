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
import { callApi, type AliExpressClientConfig } from "./api-client";
import { exchangeCodeForToken } from "./auth";
import {
  mapAddress,
  mapOrderStatus,
  mapProductInfo,
  mapShippingOptions,
  mapStockInfo,
  mapTrackingInfo,
} from "./mappers";
import type {
  AliExpressFreightResult,
  AliExpressOrderCreateResult,
  AliExpressOrderGetResult,
  AliExpressProductInfo,
  AliExpressTrackingResult,
} from "./types";

const logger = createLogger("AliExpressAdapter");

/** Maximum number of parallel getStock calls in getStockBatch. */
const STOCK_BATCH_CONCURRENCY = 5;

export class AliExpressAdapter implements SupplierAdapter {
  public readonly id = "aliexpress" as const;
  public readonly name = "AliExpress";
  public readonly supportsWebhooks = false;

  private config: AliExpressClientConfig | null = null;

  /** Set the AliExpress app credentials. Must be called before API methods. */
  configure(appKey: string, appSecret: string): void {
    this.config = { appKey, appSecret };
  }

  private getConfig(): AliExpressClientConfig {
    if (!this.config) {
      throw new Error(
        "AliExpressAdapter has not been configured. Call configure(appKey, appSecret) first.",
      );
    }

    return this.config;
  }

  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------

  async authenticate(
    credentials: SupplierCredentials,
  ): Promise<Result<AuthToken, SupplierError>> {
    if (credentials.type !== "aliexpress") {
      return err(
        SupplierError.invalidRequest("aliexpress", "Invalid credential type for AliExpress adapter"),
      );
    }

    // For AliExpress, "authenticate" means exchanging an OAuth code.
    // The code should be passed in via appSecret temporarily — in practice the
    // OAuth flow is handled by the auth module and exchangeCodeForToken is
    // called directly. Here we just configure the adapter and return an error
    // indicating the caller should use the OAuth flow.
    this.configure(credentials.appKey, credentials.appSecret);

    return err(
      SupplierError.authFailed(
        "aliexpress",
        "AliExpress requires OAuth flow. Use getAuthorizationUrl() and exchangeCodeForToken() from the auth module.",
      ),
    );
  }

  async refreshToken(token: AuthToken): Promise<Result<AuthToken, SupplierError>> {
    // AliExpress refresh tokens are unreliable. Best practice is to re-auth.
    logger.warn(
      "AliExpress refresh tokens are unreliable — recommend re-authorization instead",
    );

    if (!token.refreshToken) {
      return err(
        SupplierError.authFailed("aliexpress", "No refresh token available. Re-authorization required."),
      );
    }

    const config = this.getConfig();

    return exchangeCodeForToken(
      token.refreshToken,
      config.appKey,
      config.appSecret,
      "", // redirectUri not needed for refresh
    );
  }

  isTokenValid(token: AuthToken): boolean {
    // Consider token invalid 30 minutes before actual expiry to provide buffer
    const bufferMs = 30 * 60 * 1_000;
    return token.expiresAt.getTime() - bufferMs > Date.now();
  }

  // -------------------------------------------------------------------------
  // Orders
  // -------------------------------------------------------------------------

  async placeOrder(
    request: SupplierOrderRequest,
    token: AuthToken,
  ): Promise<Result<SupplierOrderResponse, SupplierError>> {
    const config = this.getConfig();

    const logisticsAddress = mapAddress(request.shippingAddress);

    const productItem: Record<string, unknown> = {
      product_id: Number(request.supplierSku),
      product_count: request.quantity,
      logistics_service_name: request.shippingMethod,
    };

    // sku_attr is REQUIRED for AliExpress variant selection (e.g. "14:350853#Black;5:361386#M")
    if (request.supplierSkuAttr) {
      productItem.sku_attr = request.supplierSkuAttr;
    }

    const params: Record<string, string> = {
      param_place_order_request4_open_api_d_t_o: JSON.stringify({
        logistics_address: logisticsAddress,
        product_items: [productItem],
      }),
    };

    const result = await callApi<AliExpressOrderCreateResult>(
      "aliexpress.ds.order.create",
      params,
      token.accessToken,
      config,
    );

    return result.andThen((data) => {
      if (!data.is_success || !data.order_list?.number?.length) {
        return err(
          SupplierError.orderFailed(
            "aliexpress",
            data.error_msg ?? "Order creation failed",
            {
              apiMethod: "aliexpress.ds.order.create",
              rawResponse: data,
            },
          ),
        );
      }

      const orderId = String(data.order_list.number[0]);

      logger.info("AliExpress order placed successfully", { orderId });

      return ok<SupplierOrderResponse, SupplierError>({
        supplierOrderId: orderId,
        cost: {
          amount: 0, // Cost is not returned in the create response — must be fetched separately
          currency: "USD",
        },
      });
    });
  }

  async getOrderStatus(
    supplierOrderId: string,
    token: AuthToken,
  ): Promise<Result<SupplierOrderStatus, SupplierError>> {
    const config = this.getConfig();

    const params: Record<string, string> = {
      param_aeop_order_query: JSON.stringify({
        order_id: Number(supplierOrderId),
      }),
    };

    const result = await callApi<AliExpressOrderGetResult>(
      "aliexpress.ds.order.get",
      params,
      token.accessToken,
      config,
    );

    return result.map((data) => mapOrderStatus(data.order_status));
  }

  async getTrackingInfo(
    supplierOrderId: string,
    token: AuthToken,
  ): Promise<Result<TrackingInfo, SupplierError>> {
    const config = this.getConfig();

    const params: Record<string, string> = {
      param_aeop_freight_query_for_buyer_d_t_o: JSON.stringify({
        order_id: Number(supplierOrderId),
      }),
    };

    const result = await callApi<AliExpressTrackingResult>(
      "aliexpress.logistics.ds.trackinginfo.query",
      params,
      token.accessToken,
      config,
    );

    return result.andThen((data) => {
      if (!data.result_success) {
        return err(
          SupplierError.trackingNotAvailable("aliexpress", supplierOrderId, {
            apiMethod: "aliexpress.logistics.ds.trackinginfo.query",
            rawResponse: data,
          }),
        );
      }

      return ok(mapTrackingInfo(data));
    });
  }

  async cancelOrder(
    supplierOrderId: string,
    _token: AuthToken,
  ): Promise<Result<void, SupplierError>> {
    // AliExpress DS API does not support direct order cancellation.
    // Users must cancel through the AliExpress platform UI.
    logger.warn("Cancel order not supported via AliExpress DS API", {
      orderId: supplierOrderId,
    });

    return err(
      SupplierError.invalidRequest(
        "aliexpress",
        "AliExpress does not support order cancellation via API. Please cancel through the AliExpress platform directly.",
        { apiMethod: "cancelOrder", requestParams: { orderId: supplierOrderId } },
      ),
    );
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
    const config = this.getConfig();

    const params: Record<string, string> = {
      param_aeop_freight_calculate_for_buyer_d_t_o: JSON.stringify({
        product_id: Number(supplierSku),
        product_num: quantity,
        country_code: destinationCountry,
      }),
    };

    const result = await callApi<AliExpressFreightResult>(
      "aliexpress.ds.freight.query",
      params,
      token.accessToken,
      config,
    );

    return result.map((data) => {
      const options =
        data.freight_calculate_result_list?.ae_freight_calculate_result ?? [];

      return mapShippingOptions(options);
    });
  }

  // -------------------------------------------------------------------------
  // Catalog
  // -------------------------------------------------------------------------

  async getProduct(
    supplierProductId: string,
    token: AuthToken,
  ): Promise<Result<SupplierProduct, SupplierError>> {
    const config = this.getConfig();

    const params: Record<string, string> = {
      product_id: supplierProductId,
      target_currency: "USD",
      target_language: "en",
    };

    const result = await callApi<AliExpressProductInfo>(
      "aliexpress.ds.product.get",
      params,
      token.accessToken,
      config,
    );

    return result.map(mapProductInfo);
  }

  async getStock(
    supplierSku: string,
    token: AuthToken,
  ): Promise<Result<StockInfo, SupplierError>> {
    // Stock is extracted from product data — we fetch the product and find the matching SKU
    const productResult = await this.getProduct(supplierSku, token);

    return productResult.andThen((product) => {
      // If the supplierSku matches a variant SKU, return that variant's stock
      const variant = product.variants.find((v) => v.sku === supplierSku);

      if (variant) {
        return ok<StockInfo, SupplierError>({
          supplierSku,
          available: true, // If variant exists in the response, it's available
          quantity: 999, // AliExpress doesn't expose exact stock counts via product API
          updatedAt: new Date(),
        });
      }

      // Fallback: If product was found, return stock for the product ID itself
      // This fetches from the raw API to get SKU-level stock
      const config = this.getConfig();

      // Re-fetch with raw API to get stock data
      return ok<StockInfo, SupplierError>({
        supplierSku,
        available: product.variants.length > 0,
        quantity: product.variants.length > 0 ? 999 : 0,
        updatedAt: new Date(),
      });
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
              "aliexpress",
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
        logger.warn(`Batch stock check had ${errors.length} failures out of ${supplierSkus.length} SKUs`);
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
