import { z } from "zod";
import { gql } from "graphql-tag";
import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { assertQuerySuccess } from "../utils/helpers";

const PRODUCTS_QUERY = gql`
  query ProductsList($channel: String!, $first: Int!, $after: String, $search: String) {
    products(channel: $channel, first: $first, after: $after, filter: { search: $search }) {
      edges {
        node {
          id
          name
          slug
          thumbnail(size: 256) {
            url
          }
          media {
            id
            url
            alt
            type
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

const PRODUCT_DETAIL_QUERY = gql`
  query ProductDetail($id: ID!, $channel: String!) {
    product(id: $id, channel: $channel) {
      id
      name
      slug
      description
      media {
        id
        url
        alt
        type
        oembedData
      }
      thumbnail(size: 512) {
        url
      }
    }
  }
`;

const CHANNELS_QUERY = gql`
  query Channels {
    channels {
      id
      slug
      name
      currencyCode
    }
  }
`;

interface ProductNode {
  id: string;
  name: string;
  slug: string;
  thumbnail: { url: string } | null;
  media: Array<{ id: string; url: string; alt: string; type: string }>;
}

export const productsRouter = router({
  list: protectedClientProcedure
    .input(
      z.object({
        channel: z.string(),
        first: z.number().min(1).max(100).default(20),
        after: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.apiClient.query(PRODUCTS_QUERY, {
        channel: input.channel,
        first: input.first,
        after: input.after ?? null,
        search: input.search ?? null,
      });

      assertQuerySuccess(result, "ProductsList");

      const products = result.data?.products;
      return {
        products: (products?.edges ?? []).map((edge: { node: ProductNode }) => edge.node),
        pageInfo: products?.pageInfo ?? { hasNextPage: false, endCursor: null },
        totalCount: products?.totalCount ?? 0,
      };
    }),

  getDetail: protectedClientProcedure
    .input(
      z.object({
        productId: z.string(),
        channel: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.apiClient.query(PRODUCT_DETAIL_QUERY, {
        id: input.productId,
        channel: input.channel,
      });

      assertQuerySuccess(result, "ProductDetail");

      return result.data?.product ?? null;
    }),

  channels: protectedClientProcedure.query(async ({ ctx }) => {
    const result = await ctx.apiClient.query(CHANNELS_QUERY, {});
    assertQuerySuccess(result, "Channels");
    return result.data?.channels ?? [];
  }),
});
