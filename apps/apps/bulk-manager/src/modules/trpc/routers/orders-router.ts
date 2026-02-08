import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { exportToCSV } from "../../export/csv-exporter";
import { exportToExcel } from "../../export/excel-exporter";
import { assertQuerySuccess } from "../utils/helpers";

export const ordersRouter = router({
  export: protectedClientProcedure
    .input(
      z.object({
        channelSlug: z.string(),
        format: z.enum(["csv", "xlsx"]),
        first: z.number().min(1).max(500).default(100),
        after: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        statusFilter: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const filter: Record<string, any> = {};
      if (input.dateFrom || input.dateTo) {
        filter.created = {};
        if (input.dateFrom) filter.created.gte = input.dateFrom;
        if (input.dateTo) filter.created.lte = input.dateTo;
      }
      if (input.statusFilter && input.statusFilter.length > 0) {
        filter.status = input.statusFilter;
      }

      const result = await ctx.apiClient.query(
        `query OrdersExport($channel: String!, $first: Int!, $after: String, $filter: OrderFilterInput) {
          orders(channel: $channel, first: $first, after: $after, filter: $filter) {
            edges {
              node {
                id
                number
                externalReference
                status
                statusDisplay
                origin
                created
                updatedAt
                channel { slug name currencyCode }
                user { id email firstName lastName }
                userEmail
                isPaid
                paymentStatus
                paymentStatusDisplay
                authorizeStatus
                chargeStatus
                total { gross { amount currency } net { amount currency } }
                subtotal { gross { amount currency } }
                undiscountedTotal { gross { amount currency } }
                shippingPrice { gross { amount currency } }
                shippingMethodName
                shippingTaxRate
                totalAuthorized { amount currency }
                totalCharged { amount currency }
                totalRefunded { amount currency }
                totalCanceled { amount currency }
                totalBalance { amount currency }
                discounts { type name amount { amount currency } }
                voucherCode
                customerNote
                weight { value unit }
                languageCodeEnum
                metadata { key value }
                lines {
                  productName
                  variantName
                  productSku
                  quantity
                  unitPrice { gross { amount currency } }
                  undiscountedUnitPrice { gross { amount currency } }
                  totalPrice { gross { amount currency } }
                  taxRate
                  unitDiscount { amount currency }
                  unitDiscountReason
                  isShippingRequired
                }
                fulfillments {
                  status
                  trackingNumber
                  created
                  warehouse { name }
                }
                giftCards { code currentBalance { amount currency } }
                shippingAddress {
                  firstName lastName companyName
                  streetAddress1 streetAddress2
                  city cityArea countryArea postalCode
                  country { code }
                  phone
                }
                billingAddress {
                  firstName lastName companyName
                  streetAddress1 streetAddress2
                  city cityArea countryArea postalCode
                  country { code }
                  phone
                }
              }
            }
            pageInfo { hasNextPage endCursor }
            totalCount
          }
        }`,
        {
          channel: input.channelSlug,
          first: input.first,
          after: input.after,
          filter: Object.keys(filter).length > 0 ? filter : undefined,
        }
      );

      assertQuerySuccess(result, "OrdersExport");

      const orders = result.data?.orders?.edges?.map((e: any) => e.node) || [];
      const pageInfo = result.data?.orders?.pageInfo;
      const totalCount = result.data?.orders?.totalCount;

      const rows = orders.flatMap((order: any) => {
        const ship = order.shippingAddress;
        const bill = order.billingAddress;
        const fulfillmentStatus = (order.fulfillments || []).map((f: any) => f.status).join("; ");
        const trackingNumbers = (order.fulfillments || [])
          .filter((f: any) => f.trackingNumber)
          .map((f: any) => f.trackingNumber)
          .join("; ");
        const discountsStr = (order.discounts || [])
          .map((d: any) => `${d.name || d.type}: ${d.amount?.amount}`)
          .join("; ");
        const giftCardsStr = (order.giftCards || []).map((gc: any) => gc.code).join("; ");
        const metadataStr = (order.metadata || []).map((m: any) => `${m.key}=${m.value}`).join("; ");

        const baseRow: Record<string, any> = {
          orderId: order.id,
          orderNumber: order.number,
          externalReference: order.externalReference || "",
          status: order.status,
          statusDisplay: order.statusDisplay,
          origin: order.origin || "",
          created: order.created,
          updatedAt: order.updatedAt || "",
          channel: order.channel?.slug || "",
          channelName: order.channel?.name || "",
          currency: order.channel?.currencyCode || order.total?.gross?.currency || "",
          customerEmail: order.userEmail || order.user?.email || "",
          customerFirstName: order.user?.firstName || "",
          customerLastName: order.user?.lastName || "",
          isPaid: order.isPaid ? "Yes" : "No",
          paymentStatus: order.paymentStatus || "",
          authorizeStatus: order.authorizeStatus || "",
          chargeStatus: order.chargeStatus || "",
          totalGross: order.total?.gross?.amount ?? "",
          totalNet: order.total?.net?.amount ?? "",
          subtotalGross: order.subtotal?.gross?.amount ?? "",
          undiscountedTotalGross: order.undiscountedTotal?.gross?.amount ?? "",
          shippingGross: order.shippingPrice?.gross?.amount ?? "",
          shippingMethodName: order.shippingMethodName || "",
          shippingTaxRate: order.shippingTaxRate ?? "",
          totalAuthorized: order.totalAuthorized?.amount ?? "",
          totalCharged: order.totalCharged?.amount ?? "",
          totalRefunded: order.totalRefunded?.amount ?? "",
          totalCanceled: order.totalCanceled?.amount ?? "",
          totalBalance: order.totalBalance?.amount ?? "",
          discounts: discountsStr,
          voucherCode: order.voucherCode || "",
          giftCards: giftCardsStr,
          customerNote: order.customerNote || "",
          weight: order.weight ? `${order.weight.value} ${order.weight.unit}` : "",
          language: order.languageCodeEnum || "",
          fulfillmentStatus,
          trackingNumbers,
          metadata: metadataStr,
          // Shipping address
          shipFirstName: ship?.firstName || "",
          shipLastName: ship?.lastName || "",
          shipCompany: ship?.companyName || "",
          shipAddress1: ship?.streetAddress1 || "",
          shipAddress2: ship?.streetAddress2 || "",
          shipCity: ship?.city || "",
          shipPostalCode: ship?.postalCode || "",
          shipCountry: ship?.country?.code || "",
          shipPhone: ship?.phone || "",
          // Billing address
          billFirstName: bill?.firstName || "",
          billLastName: bill?.lastName || "",
          billCompany: bill?.companyName || "",
          billAddress1: bill?.streetAddress1 || "",
          billAddress2: bill?.streetAddress2 || "",
          billCity: bill?.city || "",
          billPostalCode: bill?.postalCode || "",
          billCountry: bill?.country?.code || "",
          billPhone: bill?.phone || "",
        };

        const lines = order.lines || [];
        if (lines.length === 0) return [baseRow];

        return lines.map((line: any, idx: number) => ({
          ...baseRow,
          lineNumber: idx + 1,
          productName: line.productName || "",
          variantName: line.variantName || "",
          sku: line.productSku || "",
          quantity: line.quantity ?? "",
          unitPriceGross: line.unitPrice?.gross?.amount ?? "",
          undiscountedUnitPrice: line.undiscountedUnitPrice?.gross?.amount ?? "",
          lineTotalGross: line.totalPrice?.gross?.amount ?? "",
          taxRate: line.taxRate ?? "",
          unitDiscount: line.unitDiscount?.amount ?? "",
          unitDiscountReason: line.unitDiscountReason || "",
          shippingRequired: line.isShippingRequired ? "Yes" : "No",
        }));
      });

      if (input.format === "csv") {
        return { data: exportToCSV(rows), format: "csv" as const, pageInfo, totalCount };
      } else {
        return { data: exportToExcel(rows, "Orders"), format: "xlsx" as const, pageInfo, totalCount };
      }
    }),

  bulkFulfill: protectedClientProcedure
    .input(
      z.object({
        fulfillments: z.array(
          z.object({
            orderId: z.string(),
            trackingNumber: z.string().optional(),
            notifyCustomer: z.boolean().optional().default(true),
          })
        ),
        warehouseId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results: { orderId: string; success: boolean; error?: string }[] = [];

      for (const item of input.fulfillments) {
        try {
          // Fetch order lines to know what to fulfill
          const orderResult = await ctx.apiClient.query(
            `query OrderForFulfill($id: ID!) {
              order(id: $id) {
                id number
                lines {
                  id
                  quantity
                  quantityFulfilled
                }
              }
            }`,
            { id: item.orderId }
          );

          const order = orderResult.data?.order;
          if (!order) {
            results.push({ orderId: item.orderId, success: false, error: "Order not found" });
            continue;
          }

          // Build fulfillment lines (only unfulfilled quantities)
          const fulfillmentLines = (order.lines || [])
            .filter((line: any) => line.quantity > line.quantityFulfilled)
            .map((line: any) => ({
              orderLineId: line.id,
              stocks: [{ warehouse: input.warehouseId, quantity: line.quantity - line.quantityFulfilled }],
            }));

          if (fulfillmentLines.length === 0) {
            results.push({ orderId: item.orderId, success: false, error: `Order #${order.number} is already fully fulfilled` });
            continue;
          }

          const fulfillResult = await ctx.apiClient.mutation(
            `mutation OrderFulfill($order: ID!, $input: FulfillmentCreateInput!) {
              orderFulfill(order: $order, input: $input) {
                fulfillments { id status trackingNumber }
                errors { field code message warehouse order orderLines }
              }
            }`,
            {
              order: item.orderId,
              input: {
                lines: fulfillmentLines,
                trackingNumber: item.trackingNumber || "",
                notifyCustomer: item.notifyCustomer,
              },
            }
          );

          if (fulfillResult.error) {
            const errMsg = fulfillResult.error.graphQLErrors?.map((e: any) => e.message).join("; ") || "GraphQL error";
            results.push({ orderId: item.orderId, success: false, error: errMsg });
            continue;
          }

          const fulfillData = fulfillResult.data?.orderFulfill;
          if (fulfillData?.errors?.length > 0) {
            const errMsg = fulfillData.errors.map((e: any) => `${e.field || "order"}: ${e.message}`).join("; ");
            results.push({ orderId: item.orderId, success: false, error: errMsg });
            continue;
          }

          results.push({ orderId: item.orderId, success: true });
        } catch (error) {
          results.push({
            orderId: item.orderId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      return { total: results.length, successful, failed, results };
    }),

  bulkCancel: protectedClientProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const results: { orderId: string; success: boolean; error?: string }[] = [];

      for (const orderId of input.ids) {
        try {
          const result = await ctx.apiClient.mutation(
            `mutation OrderCancel($id: ID!) {
              orderCancel(id: $id) {
                order { id status }
                errors { field code message }
              }
            }`,
            { id: orderId }
          );

          if (result.error) {
            const errMsg = result.error.graphQLErrors?.map((e: any) => e.message).join("; ") || "GraphQL error";
            results.push({ orderId, success: false, error: errMsg });
            continue;
          }

          const data = result.data?.orderCancel;
          if (data?.errors?.length > 0) {
            results.push({ orderId, success: false, error: data.errors.map((e: any) => e.message).join("; ") });
          } else {
            results.push({ orderId, success: true });
          }
        } catch (error) {
          results.push({ orderId, success: false, error: error instanceof Error ? error.message : "Unknown error" });
        }
      }

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      return { total: results.length, successful, failed, results };
    }),
});
