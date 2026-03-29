import { describe, it, expect } from "vitest";
import {
  calculateKPIs,
  calculateTopProducts,
  calculateTopCategories,
  calculateRevenueOverTime,
  formatRecentOrders,
  detectCurrencies,
} from "./analytics-calculator";
import {
  type OrderAnalyticsFragment,
  OrderStatus,
  OrderChargeStatusEnum,
  OrderGrantedRefundStatusEnum,
} from "../../../../generated/graphql";

// Mock order data for testing
const createMockOrder = (
  id: string,
  total: number,
  currency: string,
  created: string,
  lines: Array<{ productName: string; quantity: number; totalPrice: number }>,
  overrides?: Partial<Pick<OrderAnalyticsFragment, "status" | "chargeStatus" | "paymentStatus" | "paymentStatusDisplay" | "totalRefunded" | "totalGrantedRefund" | "grantedRefunds">>
): OrderAnalyticsFragment => {
  return {
    __typename: "Order",
    id,
    number: `ORD-${id.slice(-4)}`,
    created,
    status: overrides?.status ?? OrderStatus.Fulfilled,
    chargeStatus: overrides?.chargeStatus ?? OrderChargeStatusEnum.Full,
    paymentStatus: overrides?.paymentStatus ?? ("FULLY_CHARGED" as any),
    paymentStatusDisplay: overrides?.paymentStatusDisplay ?? "Fully charged",
    totalRefunded: overrides?.totalRefunded ?? { __typename: "Money", amount: 0, currency },
    totalGrantedRefund: overrides?.totalGrantedRefund ?? { __typename: "Money", amount: 0, currency },
    grantedRefunds: overrides?.grantedRefunds ?? [],
    total: {
      __typename: "TaxedMoney",
      gross: { __typename: "Money", amount: total, currency },
      net: { __typename: "Money", amount: total * 0.9, currency },
    },
    shippingPrice: {
      __typename: "TaxedMoney",
      gross: { __typename: "Money", amount: 0, currency },
    },
    discounts: [],
    channel: {
      __typename: "Channel",
      slug: "default",
      name: "Default Channel",
      currencyCode: currency,
    },
    lines: lines.map((line, idx) => ({
      __typename: "OrderLine",
      id: `line-${id}-${idx}`,
      productName: line.productName,
      productSku: `SKU-${line.productName}`,
      quantity: line.quantity,
      totalPrice: {
        __typename: "TaxedMoney",
        gross: { __typename: "Money", amount: line.totalPrice, currency },
      },
      unitDiscount: { __typename: "Money", amount: 0, currency },
      variant: {
        __typename: "ProductVariant",
        channelListings: null,
        product: {
          __typename: "Product",
          id: `product-${line.productName}`,
          name: line.productName,
          category: {
            __typename: "Category",
            id: `cat-${line.productName}`,
            name: `${line.productName} Category`,
          },
          metadata: [],
          privateMetadata: [],
        },
      },
    })),
    metadata: [],
    privateMetadata: [],
    user: {
      __typename: "User",
      id: `user-${id}`,
      email: `user${id}@example.com`,
    },
  };
};

describe("calculateKPIs", () => {
  it("should calculate GMV correctly", () => {
    const orders = [
      createMockOrder("1", 100, "USD", "2024-01-01T00:00:00Z", [
        { productName: "Product A", quantity: 1, totalPrice: 100 },
      ]),
      createMockOrder("2", 200, "USD", "2024-01-02T00:00:00Z", [
        { productName: "Product B", quantity: 2, totalPrice: 200 },
      ]),
    ];

    const result = calculateKPIs(orders, [], "USD");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.gmv.value).toContain("300");
      expect(result.value.totalOrders.value).toBe("2");
    }
  });

  it("should filter by currency when multiple currencies present", () => {
    const orders = [
      createMockOrder("1", 100, "USD", "2024-01-01T00:00:00Z", []),
      createMockOrder("2", 200, "EUR", "2024-01-02T00:00:00Z", []),
      createMockOrder("3", 150, "USD", "2024-01-03T00:00:00Z", []),
    ];

    const result = calculateKPIs(orders, [], "USD");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      // Should only include USD orders (100 + 150 = 250)
      expect(result.value.gmv.value).toContain("250");
      expect(result.value.totalOrders.value).toBe("2"); // Only 2 USD orders
    }
  });

  it("should calculate AOV correctly", () => {
    const orders = [
      createMockOrder("1", 100, "USD", "2024-01-01T00:00:00Z", []),
      createMockOrder("2", 200, "USD", "2024-01-02T00:00:00Z", []),
    ];

    const result = calculateKPIs(orders, [], "USD");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      // AOV should be (100 + 200) / 2 = 150
      expect(result.value.averageOrderValue.value).toContain("150");
    }
  });

  it("should calculate trend vs previous period", () => {
    const currentOrders = [
      createMockOrder("1", 150, "USD", "2024-01-01T00:00:00Z", []),
    ];
    const previousOrders = [
      createMockOrder("2", 100, "USD", "2023-12-01T00:00:00Z", []),
    ];

    const result = calculateKPIs(currentOrders, previousOrders, "USD");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      // Trend should be up (150 vs 100 = 50% increase)
      expect(result.value.gmv.trend?.direction).toBe("up");
      expect(result.value.gmv.trend?.value).toBeGreaterThan(0);
    }
  });

  it("should handle empty orders", () => {
    const result = calculateKPIs([], [], "USD");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.gmv.value).toContain("0");
      expect(result.value.totalOrders.value).toBe("0");
    }
  });
});

describe("calculateTopProducts", () => {
  it("should sort products by revenue", () => {
    const orders = [
      createMockOrder("1", 100, "USD", "2024-01-01T00:00:00Z", [
        { productName: "Product A", quantity: 1, totalPrice: 50 },
        { productName: "Product B", quantity: 1, totalPrice: 50 },
      ]),
      createMockOrder("2", 200, "USD", "2024-01-02T00:00:00Z", [
        { productName: "Product B", quantity: 2, totalPrice: 200 },
      ]),
    ];

    const result = calculateTopProducts(orders, "USD", 10);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(2);
      // Product B should be first (250 total revenue)
      expect(result.value[0].name).toBe("Product B");
      expect(result.value[0].revenue).toBe(250);
    }
  });

  it("should respect limit", () => {
    const orders = Array.from({ length: 20 }, (_, i) =>
      createMockOrder(`${i}`, 100, "USD", "2024-01-01T00:00:00Z", [
        { productName: `Product ${i}`, quantity: 1, totalPrice: 100 },
      ])
    );

    const result = calculateTopProducts(orders, "USD", 5);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(5);
    }
  });
});

describe("calculateTopCategories", () => {
  it("should aggregate revenue by category", () => {
    const orders = [
      createMockOrder("1", 100, "USD", "2024-01-01T00:00:00Z", [
        { productName: "Product A", quantity: 1, totalPrice: 100 },
      ]),
      createMockOrder("2", 200, "USD", "2024-01-02T00:00:00Z", [
        { productName: "Product B", quantity: 1, totalPrice: 200 },
      ]),
    ];

    const result = calculateTopCategories(orders, "USD", 10);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBeGreaterThan(0);
    }
  });
});

describe("calculateRevenueOverTime", () => {
  it("should group by day", () => {
    const orders = [
      createMockOrder("1", 100, "USD", "2024-01-01T00:00:00Z", []),
      createMockOrder("2", 200, "USD", "2024-01-01T12:00:00Z", []),
      createMockOrder("3", 150, "USD", "2024-01-02T00:00:00Z", []),
    ];

    const result = calculateRevenueOverTime(orders, "USD", "day");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(2); // Two days
      // First day should have 300 total (100 + 200)
      const firstDay = result.value.find((d) => d.date.includes("2024-01-01"));
      expect(firstDay?.revenue).toBe(300);
    }
  });
});

describe("detectCurrencies", () => {
  it("should detect single currency", () => {
    const orders = [
      createMockOrder("1", 100, "USD", "2024-01-01T00:00:00Z", []),
      createMockOrder("2", 200, "USD", "2024-01-02T00:00:00Z", []),
    ];

    const result = detectCurrencies(orders);

    expect(result.currencies).toEqual(["USD"]);
    expect(result.primaryCurrency).toBe("USD");
    expect(result.isMultiCurrency).toBe(false);
  });

  it("should detect multiple currencies", () => {
    const orders = [
      createMockOrder("1", 100, "USD", "2024-01-01T00:00:00Z", []),
      createMockOrder("2", 200, "EUR", "2024-01-02T00:00:00Z", []),
      createMockOrder("3", 150, "USD", "2024-01-03T00:00:00Z", []),
    ];

    const result = detectCurrencies(orders);

    expect(result.currencies).toContain("USD");
    expect(result.currencies).toContain("EUR");
    expect(result.isMultiCurrency).toBe(true);
    // USD should be primary (2 orders vs 1)
    expect(result.primaryCurrency).toBe("USD");
  });

  it("should handle empty orders", () => {
    const result = detectCurrencies([]);

    expect(result.currencies).toEqual([]);
    expect(result.primaryCurrency).toBe("USD");
    expect(result.isMultiCurrency).toBe(false);
  });
});

describe("formatRecentOrders", () => {
  it("should format orders correctly", () => {
    const orders = [
      createMockOrder("1", 100, "USD", "2024-01-01T00:00:00Z", []),
    ];

    const result = formatRecentOrders(orders, 10);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].id).toBe("1");
      expect(result.value[0].total.amount).toBe(100);
      expect(result.value[0].total.currency).toBe("USD");
    }
  });

  it("should respect limit", () => {
    const orders = Array.from({ length: 20 }, (_, i) =>
      createMockOrder(`${i}`, 100, "USD", "2024-01-01T00:00:00Z", [])
    );

    const result = formatRecentOrders(orders, 5);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.length).toBe(5);
    }
  });
});
