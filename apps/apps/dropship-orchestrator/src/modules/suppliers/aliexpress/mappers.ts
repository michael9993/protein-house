import type {
  Address,
  ShippingOption,
  StockInfo,
  SupplierOrderStatus,
  SupplierProduct,
  SupplierProductVariant,
  TrackingEvent,
  TrackingInfo,
} from "../types";
import { SupplierOrderStatusEnum } from "../types";
import type {
  AliExpressFreightOption,
  AliExpressLogisticsAddress,
  AliExpressProductInfo,
  AliExpressSkuInfo,
  AliExpressTrackingEvent,
  AliExpressTrackingResult,
} from "./types";
import { AliExpressOrderStatus } from "./types";

// ---------------------------------------------------------------------------
// Order Status Mapping
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, SupplierOrderStatus> = {
  [AliExpressOrderStatus.PLACE_ORDER_SUCCESS]: SupplierOrderStatusEnum.PENDING,
  [AliExpressOrderStatus.IN_CANCEL]: SupplierOrderStatusEnum.CANCELLED,
  [AliExpressOrderStatus.WAIT_SELLER_SEND_GOODS]: SupplierOrderStatusEnum.PROCESSING,
  [AliExpressOrderStatus.SELLER_PART_SEND_GOODS]: SupplierOrderStatusEnum.PROCESSING,
  [AliExpressOrderStatus.WAIT_BUYER_ACCEPT_GOODS]: SupplierOrderStatusEnum.SHIPPED,
  [AliExpressOrderStatus.FUND_PROCESSING]: SupplierOrderStatusEnum.PROCESSING,
  [AliExpressOrderStatus.IN_ISSUE]: SupplierOrderStatusEnum.PROCESSING,
  [AliExpressOrderStatus.IN_FROZEN]: SupplierOrderStatusEnum.PROCESSING,
  [AliExpressOrderStatus.RISK_CONTROL]: SupplierOrderStatusEnum.PENDING,
  [AliExpressOrderStatus.FINISH]: SupplierOrderStatusEnum.DELIVERED,
};

export function mapOrderStatus(aeStatus: string): SupplierOrderStatus {
  return STATUS_MAP[aeStatus] ?? SupplierOrderStatusEnum.PENDING;
}

// ---------------------------------------------------------------------------
// Tracking Info Mapping
// ---------------------------------------------------------------------------

export function mapTrackingInfo(result: AliExpressTrackingResult): TrackingInfo {
  const events: TrackingEvent[] = (result.details?.details ?? []).map(
    (evt: AliExpressTrackingEvent) => ({
      timestamp: new Date(evt.event_date),
      description: evt.event_desc,
      location: evt.address || undefined,
    }),
  );

  // Sort events newest-first
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Infer a status from the latest event
  let status: SupplierOrderStatus = SupplierOrderStatusEnum.SHIPPED;

  if (events.length > 0) {
    const latestDesc = events[0].description.toLowerCase();

    if (latestDesc.includes("delivered") || latestDesc.includes("signed")) {
      status = SupplierOrderStatusEnum.DELIVERED;
    } else if (latestDesc.includes("customs") || latestDesc.includes("transit")) {
      status = SupplierOrderStatusEnum.SHIPPED;
    }
  }

  return {
    trackingNumber: result.tracking_number ?? "",
    carrier: result.logistics_company ?? "Unknown",
    trackingUrl: result.official_website || undefined,
    status,
    events,
  };
}

// ---------------------------------------------------------------------------
// Product Info Mapping
// ---------------------------------------------------------------------------

function mapVariant(sku: AliExpressSkuInfo): SupplierProductVariant {
  // Parse sku_attr like "200000182:193;200007763:201336100" into human-readable attrs
  const attributes: Record<string, string> = {};

  if (sku.sku_attr) {
    const pairs = sku.sku_attr.split(";");

    for (const pair of pairs) {
      const [key, value] = pair.split(":");

      if (key && value) {
        attributes[key] = value;
      }
    }
  }

  // Use the s_k_u_val as the human-readable value label when available
  if (sku.s_k_u_val) {
    attributes["label"] = sku.s_k_u_val;
  }

  const price = parseFloat(sku.offer_sale_price ?? sku.sku_price ?? "0");

  return {
    sku: sku.sku_id ?? sku.id,
    name: sku.s_k_u_val ?? sku.sku_attr ?? sku.sku_id,
    price: {
      amount: price,
      currency: "USD",
    },
    attributes,
    imageUrl: undefined,
  };
}

export function mapProductInfo(aeProduct: AliExpressProductInfo): SupplierProduct {
  const images: string[] = [];

  if (aeProduct.product_main_image_url) {
    images.push(aeProduct.product_main_image_url);
  }

  if (aeProduct.product_small_image_urls?.string) {
    for (const url of aeProduct.product_small_image_urls.string) {
      if (!images.includes(url)) {
        images.push(url);
      }
    }
  }

  const variants: SupplierProductVariant[] =
    aeProduct.sku_info_list?.ae_sku_info?.map(mapVariant) ?? [];

  // If no variants from SKU list, create a single "default" variant from the product price
  if (variants.length === 0) {
    variants.push({
      sku: String(aeProduct.product_id),
      name: "Default",
      price: {
        amount: parseFloat(aeProduct.target_sale_price || "0"),
        currency: aeProduct.target_sale_price_currency || "USD",
      },
      attributes: {},
    });
  }

  return {
    supplierId: "aliexpress",
    supplierProductId: String(aeProduct.product_id),
    title: aeProduct.product_title,
    description: "",
    images,
    variants,
    category: aeProduct.first_level_category_id
      ? String(aeProduct.first_level_category_id)
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Stock Info — extracted from product SKU data
// ---------------------------------------------------------------------------

export function mapStockInfo(sku: AliExpressSkuInfo): StockInfo {
  const quantity = sku.ipm_sku_stock ?? (sku.sku_stock ? 999 : 0);

  return {
    supplierSku: sku.sku_id ?? sku.id,
    available: quantity > 0,
    quantity,
    updatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Address Mapping — Our format → AliExpress logistics address
// ---------------------------------------------------------------------------

export function mapAddress(address: Address): AliExpressLogisticsAddress {
  return {
    contact_person: address.name,
    address: address.street,
    city: address.city,
    zip: address.postalCode,
    country: address.country,
    phone_country: "",
    mobile_no: address.phone,
  };
}

// ---------------------------------------------------------------------------
// Freight / Shipping Options Mapping
// ---------------------------------------------------------------------------

export function mapShippingOptions(options: AliExpressFreightOption[]): ShippingOption[] {
  return options.map((opt) => {
    const amount = parseFloat(opt.freight.amount ?? "0");

    // Parse estimated delivery time (format: "15-30") into min/max days
    let minDays = 15;
    let maxDays = 45;

    if (opt.estimated_delivery_time) {
      const match = opt.estimated_delivery_time.match(/(\d+)\s*[-–]\s*(\d+)/);

      if (match) {
        minDays = parseInt(match[1], 10);
        maxDays = parseInt(match[2], 10);
      } else {
        const single = parseInt(opt.estimated_delivery_time, 10);

        if (!isNaN(single)) {
          minDays = single;
          maxDays = single;
        }
      }
    }

    return {
      name: opt.service_name,
      cost: {
        amount,
        currency: opt.freight.currency_code || "USD",
      },
      estimatedDays: { min: minDays, max: maxDays },
      trackingAvailable: opt.tracking,
    };
  });
}
