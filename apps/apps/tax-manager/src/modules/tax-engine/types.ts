import { z } from "zod";
import {
  TaxRuleSchema,
  ChannelTaxConfigSchema,
  TaxManagerConfigSchema,
  TaxTransactionLogSchema,
} from "./schemas";

export type TaxRule = z.infer<typeof TaxRuleSchema>;
export type ChannelTaxConfig = z.infer<typeof ChannelTaxConfigSchema>;
export type TaxManagerConfig = z.infer<typeof TaxManagerConfigSchema>;
export type TaxTransactionLog = z.infer<typeof TaxTransactionLogSchema>;

/** Saleor's CalculateTaxes webhook payload shape */
export interface TaxBasePayload {
  taxBase: {
    pricesEnteredWithTax: boolean;
    currency: string;
    channel: {
      slug: string;
    };
    discounts: Array<{
      name: string | null;
      amount: {
        amount: number;
      };
    }>;
    address: {
      streetAddress1: string;
      streetAddress2: string;
      city: string;
      countryArea: string;
      postalCode: string;
      country: {
        code: string;
      };
    } | null;
    shippingPrice: {
      amount: number;
    };
    lines: Array<{
      sourceLine: {
        __typename: string;
        id: string;
      };
      quantity: number;
      chargeTaxes: boolean;
      unitPrice: {
        amount: number;
      };
      totalPrice: {
        amount: number;
      };
    }>;
  };
  recipient: {
    privateMetadata: Array<{
      key: string;
      value: string;
    }>;
  } | null;
}

/** Response format Saleor expects from CalculateTaxes sync webhooks */
export interface CalculateTaxesResponse {
  currency: string;
  shipping_price_gross_amount: number;
  shipping_price_net_amount: number;
  shipping_tax_rate: number;
  subtotal_net_amount: number;
  subtotal_gross_amount: number;
  total_net_amount: number;
  total_gross_amount: number;
  lines: Array<{
    id: string;
    currency: string;
    total_net_amount: number;
    total_gross_amount: number;
    unit_net_amount: number;
    unit_gross_amount: number;
    tax_rate: number;
  }>;
}

export interface MatchedRule {
  rule: TaxRule | null;
  taxRate: number;
  source: "exact_match" | "country_match" | "default" | "export_zero_rated" | "disabled";
}
