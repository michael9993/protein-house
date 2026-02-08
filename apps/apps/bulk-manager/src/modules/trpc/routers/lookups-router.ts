import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { assertQuerySuccess } from "../utils/helpers";

export const lookupsRouter = router({
  categories: protectedClientProcedure.query(async ({ ctx }) => {
    const result = await ctx.apiClient.query(
      `query CategoriesList {
        categories(first: 100) {
          edges {
            node {
              id
              name
              slug
              parent { id name }
              level
            }
          }
        }
      }`,
      {}
    );

    assertQuerySuccess(result, "CategoriesList");

    const categories = (result.data?.categories?.edges || []).map((e: any) => ({
      id: e.node.id,
      name: e.node.name,
      slug: e.node.slug,
      parentName: e.node.parent?.name || null,
      level: e.node.level,
    }));

    return { categories };
  }),

  productTypes: protectedClientProcedure.query(async ({ ctx }) => {
    const result = await ctx.apiClient.query(
      `query ProductTypesList {
        productTypes(first: 100) {
          edges {
            node {
              id
              name
              slug
              isShippingRequired
              isDigital
              hasVariants
            }
          }
        }
      }`,
      {}
    );

    assertQuerySuccess(result, "ProductTypesList");

    const productTypes = (result.data?.productTypes?.edges || []).map((e: any) => ({
      id: e.node.id,
      name: e.node.name,
      slug: e.node.slug,
      isShippingRequired: e.node.isShippingRequired,
      isDigital: e.node.isDigital,
      hasVariants: e.node.hasVariants,
    }));

    return { productTypes };
  }),

  warehouses: protectedClientProcedure.query(async ({ ctx }) => {
    const result = await ctx.apiClient.query(
      `query WarehousesList {
        warehouses(first: 100) {
          edges {
            node {
              id
              name
              slug
            }
          }
        }
      }`,
      {}
    );

    assertQuerySuccess(result, "WarehousesList");

    const warehouses = (result.data?.warehouses?.edges || []).map((e: any) => ({
      id: e.node.id,
      name: e.node.name,
      slug: e.node.slug,
    }));

    return { warehouses };
  }),

  taxClasses: protectedClientProcedure.query(async ({ ctx }) => {
    const result = await ctx.apiClient.query(
      `query TaxClassesList {
        taxClasses(first: 100) {
          edges {
            node {
              id
              name
            }
          }
        }
      }`,
      {}
    );

    assertQuerySuccess(result, "TaxClassesList");

    const taxClasses = (result.data?.taxClasses?.edges || []).map((e: any) => ({
      id: e.node.id,
      name: e.node.name,
    }));

    return { taxClasses };
  }),
});
