import { createLogger } from "@/logger";
import { matchTaxRule } from "./rule-matcher";
import {
  TaxBasePayload,
  CalculateTaxesResponse,
  MatchedRule,
  TaxRule,
  ChannelTaxConfig,
  TaxManagerConfig,
} from "./types";

const logger = createLogger("tax-engine");

/**
 * Round to 2 decimal places (currency precision).
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calculate net/gross for a given amount and tax rate.
 */
function applyTax(
  amount: number,
  rate: number,
  pricesIncludeTax: boolean
): { net: number; gross: number } {
  if (rate === 0) {
    return { net: round2(amount), gross: round2(amount) };
  }

  if (pricesIncludeTax) {
    // Price already includes tax: extract the net
    const net = round2(amount / (1 + rate));
    return { net, gross: round2(amount) };
  }

  // Price excludes tax: add tax on top
  const gross = round2(amount * (1 + rate));
  return { net: round2(amount), gross };
}

export interface CalculateTaxesInput {
  payload: TaxBasePayload;
  config: TaxManagerConfig;
}

export interface CalculateTaxesResult {
  response: CalculateTaxesResponse;
  matchedRule: MatchedRule;
}

/**
 * Main tax calculation entry point.
 * Receives the Saleor webhook payload + our config, returns the tax response.
 */
export function calculateTaxes({ payload, config }: CalculateTaxesInput): CalculateTaxesResult {
  const { taxBase } = payload;
  const { currency, channel, address, lines, shippingPrice, pricesEnteredWithTax } = taxBase;

  // Find channel config
  const channelConfig = config.channels.find((c) => c.channelSlug === channel.slug);

  // If channel not configured or disabled, pass through with zero tax
  if (!channelConfig || !channelConfig.enabled) {
    return zeroTaxResponse(currency, lines, shippingPrice.amount, pricesEnteredWithTax);
  }

  // If no address, can't determine tax jurisdiction — use default rate
  const countryCode = address?.country?.code;
  if (!countryCode) {
    logger.debug("No address provided, using default rate", { channel: channel.slug });
    const defaultRate = channelConfig.defaultTaxRate;
    return buildTaxResponse(currency, lines, shippingPrice.amount, pricesEnteredWithTax, defaultRate, defaultRate, {
      rule: null,
      taxRate: defaultRate,
      source: "default",
    });
  }

  // Match rule
  const matched = matchTaxRule(
    config.rules,
    countryCode,
    address?.countryArea || undefined,
    channelConfig
  );

  const lineRate = matched.taxRate;
  const shippingRate = matched.rule?.shippingTaxRate ?? lineRate;

  logger.debug("Tax calculation", {
    channel: channel.slug,
    country: countryCode,
    area: address?.countryArea,
    lineRate,
    shippingRate,
    source: matched.source,
    rule: matched.rule?.name,
  });

  return buildTaxResponse(currency, lines, shippingPrice.amount, pricesEnteredWithTax, lineRate, shippingRate, matched);
}

function buildTaxResponse(
  currency: string,
  lines: TaxBasePayload["taxBase"]["lines"],
  shippingAmount: number,
  pricesIncludeTax: boolean,
  lineRate: number,
  shippingRate: number,
  matched: MatchedRule
): CalculateTaxesResult {
  // Calculate each line
  const calculatedLines = lines.map((line) => {
    const effectiveRate = line.chargeTaxes ? lineRate : 0;
    const totalResult = applyTax(line.totalPrice.amount, effectiveRate, pricesIncludeTax);
    const unitResult = applyTax(line.unitPrice.amount, effectiveRate, pricesIncludeTax);

    return {
      id: line.sourceLine.id,
      currency,
      total_net_amount: totalResult.net,
      total_gross_amount: totalResult.gross,
      unit_net_amount: unitResult.net,
      unit_gross_amount: unitResult.gross,
      tax_rate: effectiveRate * 100, // Saleor expects percentage (e.g. 17 not 0.17)
    };
  });

  // Calculate shipping tax
  const shipping = applyTax(shippingAmount, shippingRate, pricesIncludeTax);

  // Subtotals (sum of all lines)
  const subtotalNet = round2(calculatedLines.reduce((sum, l) => sum + l.total_net_amount, 0));
  const subtotalGross = round2(calculatedLines.reduce((sum, l) => sum + l.total_gross_amount, 0));

  // Totals (subtotal + shipping)
  const totalNet = round2(subtotalNet + shipping.net);
  const totalGross = round2(subtotalGross + shipping.gross);

  return {
    response: {
      currency,
      shipping_price_gross_amount: shipping.gross,
      shipping_price_net_amount: shipping.net,
      shipping_tax_rate: shippingRate * 100,
      subtotal_net_amount: subtotalNet,
      subtotal_gross_amount: subtotalGross,
      total_net_amount: totalNet,
      total_gross_amount: totalGross,
      lines: calculatedLines,
    },
    matchedRule: matched,
  };
}

function zeroTaxResponse(
  currency: string,
  lines: TaxBasePayload["taxBase"]["lines"],
  shippingAmount: number,
  pricesIncludeTax: boolean
): CalculateTaxesResult {
  return buildTaxResponse(currency, lines, shippingAmount, pricesIncludeTax, 0, 0, {
    rule: null,
    taxRate: 0,
    source: "disabled",
  });
}
