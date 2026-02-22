import { z } from "zod";
import { createLogger } from "@/logger";

const logger = createLogger("pricing:rules");

// ---------------------------------------------------------------------------
// Schema & Types
// ---------------------------------------------------------------------------

export const PricingRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["global", "supplier", "region", "category"]),
  supplierId: z.string().optional(),
  regionCode: z.string().optional(),
  categorySlug: z.string().optional(),
  strategy: z.enum(["percentage_markup", "fixed_markup", "margin_target"]),
  /** For percentage_markup: 2.5 = 2.5x. For fixed_markup: 10 = +$10. For margin_target: 40 = 40%. */
  value: z.number().positive(),
  /** Higher priority wins when multiple rules match (category > region > supplier > global). */
  priority: z.number().int().default(0),
  active: z.boolean().default(true),
});

export type PricingRule = z.infer<typeof PricingRuleSchema>;

export const PricingRulesConfigSchema = z.object({
  rules: z.array(PricingRuleSchema).default([]),
});

export type PricingRulesConfig = z.infer<typeof PricingRulesConfigSchema>;

// ---------------------------------------------------------------------------
// Default global rule
// ---------------------------------------------------------------------------

export const DEFAULT_RULES: PricingRule[] = [
  {
    id: "global-default",
    name: "Default 2.5x Markup",
    type: "global",
    strategy: "percentage_markup",
    value: 2.5,
    priority: 0,
    active: true,
  },
];

// ---------------------------------------------------------------------------
// Rule resolution
// ---------------------------------------------------------------------------

interface RuleContext {
  supplierId?: string;
  regionCode?: string;
  categorySlug?: string;
}

/**
 * Find the best matching pricing rule for a given product context.
 * Rule cascade: category-specific > region > supplier > global (highest priority wins).
 */
export function resolveRule(rules: PricingRule[], ctx: RuleContext): PricingRule | null {
  const activeRules = rules.filter((r) => r.active);

  // Filter matching rules
  const matching = activeRules.filter((r) => {
    if (r.type === "global") return true;
    if (r.type === "supplier") return r.supplierId === ctx.supplierId;
    if (r.type === "region") return r.regionCode === ctx.regionCode;
    if (r.type === "category") return r.categorySlug === ctx.categorySlug;
    return false;
  });

  if (matching.length === 0) return null;

  // Sort by type priority (category > region > supplier > global), then by explicit priority
  const typePriority: Record<string, number> = { category: 30, region: 20, supplier: 10, global: 0 };
  matching.sort((a, b) => {
    const typeDiff = (typePriority[b.type] ?? 0) - (typePriority[a.type] ?? 0);
    if (typeDiff !== 0) return typeDiff;
    return b.priority - a.priority;
  });

  return matching[0];
}

/**
 * Apply a pricing rule to a cost price.
 * Returns the retail price.
 */
export function applyRule(rule: PricingRule, costPrice: number): number {
  switch (rule.strategy) {
    case "percentage_markup":
      return costPrice * rule.value;
    case "fixed_markup":
      return costPrice + rule.value;
    case "margin_target": {
      // margin_target: value = target margin %, e.g. 40 = 40%
      // retail = cost / (1 - margin/100)
      const marginFraction = rule.value / 100;
      if (marginFraction >= 1) return costPrice * 10; // Safety cap
      return costPrice / (1 - marginFraction);
    }
    default:
      return costPrice * 2.5; // Fallback
  }
}

/**
 * Compute retail price for a product given rules and context.
 */
export function computeRetailPrice(
  costPrice: number,
  rules: PricingRule[],
  ctx: RuleContext,
): { retailPrice: number; appliedRule: PricingRule | null } {
  const rule = resolveRule(rules, ctx);
  if (!rule) {
    logger.warn("No matching rule, using 2.5x default", ctx);
    return { retailPrice: costPrice * 2.5, appliedRule: null };
  }
  return { retailPrice: applyRule(rule, costPrice), appliedRule: rule };
}
