import type {
  Address,
  ShippingOption,
  StockInfo,
  SupplierOrderRequest,
  SupplierOrderStatus,
  SupplierProduct,
  SupplierProductVariant,
  TrackingEvent,
  TrackingInfo,
} from "../types";
import { SupplierOrderStatusEnum } from "../types";
import type {
  CJFreightResult,
  CJProductInfo,
  CJStockInfo,
  CJTrackingData,
  CJTrackingEvent,
  CJVariantInfo,
} from "./types";
import { CJOrderStatus } from "./types";

// ---------------------------------------------------------------------------
// Order Status Mapping
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, SupplierOrderStatus> = {
  [CJOrderStatus.CREATED]: SupplierOrderStatusEnum.PENDING,
  [CJOrderStatus.IN_CART]: SupplierOrderStatusEnum.PENDING,
  [CJOrderStatus.UNPAID]: SupplierOrderStatusEnum.PENDING,
  [CJOrderStatus.UNSHIPPED]: SupplierOrderStatusEnum.PROCESSING,
  [CJOrderStatus.SHIPPED]: SupplierOrderStatusEnum.SHIPPED,
  [CJOrderStatus.DELIVERED]: SupplierOrderStatusEnum.DELIVERED,
  [CJOrderStatus.CANCELLED]: SupplierOrderStatusEnum.CANCELLED,
  [CJOrderStatus.OTHER]: SupplierOrderStatusEnum.PENDING,
};

export function mapOrderStatus(cjStatus: string): SupplierOrderStatus {
  return STATUS_MAP[cjStatus] ?? SupplierOrderStatusEnum.PENDING;
}

// ---------------------------------------------------------------------------
// Tracking Info Mapping
// ---------------------------------------------------------------------------

export function mapTrackingInfo(data: CJTrackingData): TrackingInfo {
  const events: TrackingEvent[] = (data.trackInfoList ?? []).map(
    (evt: CJTrackingEvent) => ({
      timestamp: new Date(evt.date),
      description: evt.info,
      location: evt.location || undefined,
    }),
  );

  // Sort events newest-first
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Infer status from latest event
  let status: SupplierOrderStatus = SupplierOrderStatusEnum.SHIPPED;

  if (events.length > 0) {
    const latestDesc = events[0].description.toLowerCase();

    if (latestDesc.includes("delivered") || latestDesc.includes("signed") || latestDesc.includes("picked up")) {
      status = SupplierOrderStatusEnum.DELIVERED;
    } else if (latestDesc.includes("arrived") || latestDesc.includes("customs")) {
      status = SupplierOrderStatusEnum.SHIPPED;
    }
  }

  const rawTrackNumber = data.trackNumber ?? "";
  const isCjNumber = /^CJ/i.test(rawTrackNumber);

  return {
    // Primary tracking number: prefer last-mile for customer-facing use
    trackingNumber: rawTrackNumber,
    carrier: data.logisticName ?? "Unknown",
    trackingUrl: data.logisticUrl || undefined,
    status,
    events,
    // Classify the tracking number
    cjTrackingNumber: isCjNumber ? rawTrackNumber : undefined,
    lastMileTrackingNumber: isCjNumber ? undefined : rawTrackNumber || undefined,
  };
}

// ---------------------------------------------------------------------------
// Product Info Mapping
// ---------------------------------------------------------------------------

function mapVariant(variant: CJVariantInfo): SupplierProductVariant {
  const attributes: Record<string, string> = {};

  if (variant.variantProperty) {
    // CJ variant property is like "Color:Red;Size:M"
    const pairs = variant.variantProperty.split(";");

    for (const pair of pairs) {
      const [key, value] = pair.split(":");

      if (key && value) {
        attributes[key.trim()] = value.trim();
      }
    }
  }

  if (variant.variantKey) {
    attributes["key"] = variant.variantKey;
  }

  return {
    sku: variant.vid,
    name: variant.variantNameEn || variant.vid,
    price: {
      amount: variant.variantSellPrice,
      currency: "USD",
    },
    attributes,
    imageUrl: variant.variantImage || undefined,
  };
}

export function mapProductInfo(cjProduct: CJProductInfo): SupplierProduct {
  const images: string[] = [];

  if (cjProduct.productImage) {
    images.push(cjProduct.productImage);
  }

  if (cjProduct.productImageSet) {
    for (const url of cjProduct.productImageSet) {
      if (!images.includes(url)) {
        images.push(url);
      }
    }
  }

  const variants: SupplierProductVariant[] =
    cjProduct.variants?.map(mapVariant) ?? [];

  // If no variants, create a default one from product-level data
  if (variants.length === 0) {
    variants.push({
      sku: cjProduct.pid,
      name: "Default",
      price: {
        amount: cjProduct.sellPrice,
        currency: "USD",
      },
      attributes: {},
      imageUrl: cjProduct.productImage || undefined,
    });
  }

  return {
    supplierId: "cj",
    supplierProductId: cjProduct.pid,
    title: cjProduct.productNameEn,
    description: cjProduct.description || "",
    images,
    variants,
    category: cjProduct.categoryName || cjProduct.categoryId || undefined,
  };
}

// ---------------------------------------------------------------------------
// Stock Info Mapping
// ---------------------------------------------------------------------------

export function mapStockInfo(stockData: CJStockInfo): StockInfo {
  return {
    supplierSku: stockData.vid,
    available: stockData.stock > 0,
    quantity: stockData.stock,
    updatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Address Mapping — Our unified format → CJ shipping address fields
// ---------------------------------------------------------------------------

export interface CJShippingAddress {
  shippingCountryCode: string;
  shippingCountry: string;
  shippingCustomerName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingZip: string;
  shippingPhone: string;
}

export function mapAddress(address: Address, countryName?: string): CJShippingAddress {
  return {
    shippingCountryCode: address.country,
    shippingCountry: countryName ?? address.country,
    shippingCustomerName: address.name,
    shippingAddress: address.street,
    shippingCity: address.city,
    shippingProvince: address.province ?? "",
    shippingZip: address.postalCode,
    shippingPhone: address.phone,
  };
}

// ---------------------------------------------------------------------------
// Freight / Shipping Options Mapping
// ---------------------------------------------------------------------------

export function mapShippingOptions(options: CJFreightResult[]): ShippingOption[] {
  return options.map((opt) => {
    // Parse logisticAging (e.g., "7-15 days", "10~20 Working Days")
    let minDays = 7;
    let maxDays = 30;

    if (opt.logisticAging) {
      const match = opt.logisticAging.match(/(\d+)\s*[-~]\s*(\d+)/);

      if (match) {
        minDays = parseInt(match[1], 10);
        maxDays = parseInt(match[2], 10);
      } else {
        const single = parseInt(opt.logisticAging, 10);

        if (!isNaN(single)) {
          minDays = single;
          maxDays = single;
        }
      }
    }

    return {
      name: opt.logisticName,
      cost: {
        amount: opt.logisticPrice,
        currency: opt.logisticPriceUnit || "USD",
      },
      estimatedDays: { min: minDays, max: maxDays },
      trackingAvailable: opt.trackable,
    };
  });
}
