import { TaxRule, MatchedRule, ChannelTaxConfig } from "./types";

/**
 * Match a tax rule for a given address against the rule set.
 * Priority order:
 *   1. Exact country + countryArea match (highest priority first)
 *   2. Country-only match (highest priority first)
 *   3. Channel default rate
 */
export function matchTaxRule(
  rules: TaxRule[],
  countryCode: string,
  countryArea: string | undefined,
  channelConfig: ChannelTaxConfig
): MatchedRule {
  // Export zero-rating: if shipping to a different country than domestic, rate = 0
  if (
    channelConfig.exportZeroRating.enabled &&
    countryCode !== channelConfig.exportZeroRating.domesticCountryCode
  ) {
    return { rule: null, taxRate: 0, source: "export_zero_rated" };
  }

  const enabledRules = rules
    .filter((r) => r.enabled)
    .sort((a, b) => b.priority - a.priority);

  // 1. Exact country + state match
  if (countryArea) {
    const exactMatch = enabledRules.find(
      (r) =>
        r.countryCode === countryCode &&
        r.countryArea?.toUpperCase() === countryArea.toUpperCase()
    );
    if (exactMatch) {
      return { rule: exactMatch, taxRate: exactMatch.taxRate, source: "exact_match" };
    }
  }

  // 2. Country-only match (rules without countryArea specified)
  const countryMatch = enabledRules.find(
    (r) => r.countryCode === countryCode && !r.countryArea
  );
  if (countryMatch) {
    return { rule: countryMatch, taxRate: countryMatch.taxRate, source: "country_match" };
  }

  // 3. Default rate
  return { rule: null, taxRate: channelConfig.defaultTaxRate, source: "default" };
}
