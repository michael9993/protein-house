import { NextApiRequest, NextApiResponse } from "next";
import { saleorApp } from "../../saleor-app";
import { createGraphQLClient } from "@saleor/apps-shared/create-graphql-client";
import { gql } from "urql";

export type AutoVoucherItem = {
  code: string;
  minSpent: number | null;
  type: "SHIPPING" | "ENTIRE_ORDER" | "SPECIFIC_PRODUCT";
};

/**
 * GET /api/auto-voucher-codes?channelSlug=default-channel&saleorApiUrl=...
 *
 * Returns vouchers that have metadata key "auto" and value "true"
 * (to be auto-applied at cart/checkout), with minSpent and type for rule matching.
 * Requires app to be installed; uses MANAGE_DISCOUNTS permission to query vouchers.
 */
const AUTO_VOUCHERS_QUERY = gql`
  query AutoVoucherCodes($channelSlug: String!, $filter: VoucherFilterInput!) {
    vouchers(
      first: 50
      channel: $channelSlug
      filter: $filter
      sortBy: { field: START_DATE, direction: DESC }
    ) {
      edges {
        node {
          id
          code
          type
          minSpent {
            amount
          }
          codes(first: 10) {
            edges {
              node {
                code
              }
            }
          }
        }
      }
    }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-saleor-api-url");
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const channelSlug = req.query.channelSlug as string | undefined;
  const saleorApiUrl =
    (req.query.saleorApiUrl as string) || (req.headers["x-saleor-api-url"] as string);

  if (!channelSlug) {
    return res.status(400).json({ error: "channelSlug is required" });
  }

  if (!saleorApiUrl) {
    return res.status(200).json({ codes: [] });
  }

  try {
    const authData = await saleorApp.apl.get(saleorApiUrl);
    if (!authData) {
      return res.status(200).json({ codes: [] });
    }

    const client = createGraphQLClient({
      saleorApiUrl: authData.saleorApiUrl,
      token: authData.token,
    });

    const result = await client
      .query(AUTO_VOUCHERS_QUERY, {
        channelSlug,
        filter: {
          status: ["ACTIVE"],
          metadata: [{ key: "auto", value: "true" }],
        },
      })
      .toPromise();

    const edges = result.data?.vouchers?.edges ?? [];
    const vouchers: AutoVoucherItem[] = [];
    for (const edge of edges) {
      const node = edge?.node as {
        code?: string;
        type?: string;
        minSpent?: { amount: number } | null;
        codes?: { edges?: Array<{ node?: { code?: string } }> };
      } | undefined;
      if (!node) continue;
      const code = node.code ?? node.codes?.edges?.[0]?.node?.code;
      if (code && typeof code === "string" && code.trim()) {
        const minSpent = node.minSpent?.amount != null ? Number(node.minSpent.amount) : null;
        const type =
          node.type === "SHIPPING" || node.type === "ENTIRE_ORDER" || node.type === "SPECIFIC_PRODUCT"
            ? node.type
            : "ENTIRE_ORDER";
        vouchers.push({ code: code.trim(), minSpent, type });
      }
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ codes: vouchers.map((v) => v.code), vouchers });
  } catch (error) {
    console.error("[auto-voucher-codes] Error:", error);
    return res.status(200).json({ codes: [] });
  }
}
