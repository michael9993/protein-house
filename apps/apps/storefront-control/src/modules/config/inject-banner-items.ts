import { Client, gql } from "urql";

import type { StorefrontConfig, HeaderBannerItem } from "./schema";

/** Map manual banner entry to HeaderBannerItem (storefront uses description || name for main text) */
function manualItemToBannerItem(manual: { id: string; text: string; link?: string | null; icon?: string | null }): HeaderBannerItem {
  return {
    id: manual.id,
    name: manual.text,
    description: null,
    link: manual.link ?? null,
    icon: manual.icon ?? null,
  };
}

const PROMOTIONS_QUERY = gql`
  query BannerPromotions($now: DateTime!) {
    promotions(
      first: 20
      where: {
        startDate: { range: { lte: $now } }
        endDate: { range: { gte: $now } }
      }
      sortBy: { field: START_DATE, direction: DESC }
    ) {
      edges {
        node {
          id
          name
          description
          startDate
          endDate
          metafield(key: "banner_link")
        }
      }
    }
  }
`;

const VOUCHERS_QUERY = gql`
  query BannerVouchers($channelSlug: String!) {
    vouchers(
      first: 20
      channel: $channelSlug
      filter: { status: [ACTIVE] }
      sortBy: { field: START_DATE, direction: DESC }
    ) {
      edges {
        node {
          id
          name
          code
          codes(first: 1) {
            edges {
              node {
                code
              }
            }
          }
          startDate
          endDate
          discountValueType
          discountValue
          metafield(key: "banner_link")
        }
      }
    }
  }
`;

function parsePromotionDescription(description: unknown): string | null {
  if (description == null) return null;
  if (typeof description === "string") return description;
  if (typeof description === "object" && description !== null && "plaintext" in description) {
    const v = (description as { plaintext?: string }).plaintext;
    return typeof v === "string" ? v : null;
  }
  return null;
}

function mapPromotionToItem(node: {
  id: string;
  name: string;
  description?: unknown;
  metafield?: string | null;
}): HeaderBannerItem {
  const description = parsePromotionDescription(node.description) ?? null;
  return {
    id: node.id,
    name: node.name,
    description,
    displayText: (description && description.trim()) ? description.trim() : node.name,
    link: node.metafield ?? null,
  };
}

function voucherDiscountDescription(
  discountValueType: string,
  discountValue: number | null | undefined
): string {
  if (discountValue == null) return "";
  switch (discountValueType) {
    case "PERCENTAGE":
      return `${discountValue}% off`;
    case "FIXED":
      return `${discountValue} off`;
    case "SHIPPING":
      return "Free shipping";
    default:
      return discountValue ? `${discountValue} off` : "";
  }
}

function mapVoucherToItem(node: {
  id: string;
  name: string | null;
  code: string | null;
  codes?: { edges: Array<{ node: { code: string } }> } | null;
  discountValueType: string;
  discountValue: number | null;
  metafield?: string | null;
}): HeaderBannerItem {
  const code =
    node.code ??
    node.codes?.edges?.[0]?.node?.code ??
    null;
  const name = node.name?.trim() ? node.name : (code ? `Use code ${code}` : "Voucher");
  const discountDesc = voucherDiscountDescription(node.discountValueType, node.discountValue);
  return {
    id: `voucher-${node.id}`,
    name,
    description: discountDesc || null,
    displayText: name,
    link: node.metafield ?? null,
  };
}

export type InjectBannerItemsDeps = {
  config: StorefrontConfig;
  apiClient: Pick<Client, "query">;
  channelSlug: string;
};

/**
 * Merges manual banner items with Saleor promotions and/or vouchers (when useSaleorPromotions
 * and/or useSaleorVouchers are true) and sets config.header.banner.items. Promotions use
 * description as primary text. Does not mutate the input config; returns a new config.
 */
export async function injectBannerItemsFromSaleor({
  config,
  apiClient,
  channelSlug,
}: InjectBannerItemsDeps): Promise<StorefrontConfig> {
  const banner = config.header?.banner;
  if (!banner) return config;

  const manualItems = banner.manualItems ?? [];
  const manualAsItems: HeaderBannerItem[] = manualItems.map(manualItemToBannerItem);
  const usePromotions = banner.useSaleorPromotions ?? false;
  const useVouchers = banner.useSaleorVouchers ?? false;

  if (!usePromotions && !useVouchers) {
    return {
      ...config,
      header: {
        ...config.header,
        banner: {
          ...banner,
          items: manualAsItems,
        },
      },
    };
  }

  const saleorItems: HeaderBannerItem[] = [];
  const now = new Date().toISOString();

  try {
    if (usePromotions) {
      const promotionsResult = await apiClient.query(PROMOTIONS_QUERY, { now }).toPromise();
      if (promotionsResult.data?.promotions?.edges) {
        for (const edge of promotionsResult.data.promotions.edges) {
          if (edge?.node) saleorItems.push(mapPromotionToItem(edge.node));
        }
      }
    }
    if (useVouchers) {
      const vouchersResult = await apiClient.query(VOUCHERS_QUERY, { channelSlug }).toPromise();
      if (vouchersResult.data?.vouchers?.edges) {
        for (const edge of vouchersResult.data.vouchers.edges) {
          if (edge?.node) saleorItems.push(mapVoucherToItem(edge.node));
        }
      }
    }
  } catch (err) {
    console.warn("[injectBannerItemsFromSaleor] Saleor request failed:", err);
  }

  const items = [...manualAsItems, ...saleorItems];

  return {
    ...config,
    header: {
      ...config.header,
      banner: {
        ...banner,
        items,
      },
    },
  };
}
