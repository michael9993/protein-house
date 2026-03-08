import { z } from "zod";
import { gql } from "graphql-tag";
import { TRPCError } from "@trpc/server";
import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { assertQuerySuccess } from "../utils/helpers";
import { uploadBase64ToProduct, downloadImageAsBase64 } from "../utils/image-upload";

const PRODUCT_MEDIA_DELETE = gql`
  mutation ProductMediaDelete($id: ID!) {
    productMediaDelete(id: $id) {
      product {
        id
      }
      errors {
        field
        code
        message
      }
    }
  }
`;

const PRODUCT_MEDIA_UPDATE = gql`
  mutation ProductMediaUpdate($id: ID!, $input: ProductMediaUpdateInput!) {
    productMediaUpdate(id: $id, input: $input) {
      media {
        id
        alt
        url
      }
      errors {
        field
        code
        message
      }
    }
  }
`;

export const mediaRouter = router({
  uploadToProduct: protectedClientProcedure
    .input(
      z.object({
        productId: z.string(),
        imageBase64: z.string(),
        alt: z.string().default(""),
        format: z.enum(["png", "jpeg"]).default("png"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await uploadBase64ToProduct(
        input.imageBase64,
        input.productId,
        input.alt,
        input.format,
        ctx.saleorApiUrl,
        ctx.appToken,
      );

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to upload image: ${result.error}`,
        });
      }

      return {
        mediaId: result.mediaId,
        mediaUrl: result.mediaUrl,
      };
    }),

  updateAlt: protectedClientProcedure
    .input(
      z.object({
        mediaId: z.string(),
        alt: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.apiClient.mutation(PRODUCT_MEDIA_UPDATE, {
        id: input.mediaId,
        input: { alt: input.alt },
      });

      assertQuerySuccess(result, "ProductMediaUpdate");

      const data = result.data?.productMediaUpdate;
      if (data?.errors?.length > 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: data.errors.map((e: { message: string }) => e.message).join("; "),
        });
      }

      return data?.media;
    }),

  delete: protectedClientProcedure
    .input(z.object({ mediaId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.apiClient.mutation(PRODUCT_MEDIA_DELETE, {
        id: input.mediaId,
      });

      assertQuerySuccess(result, "ProductMediaDelete");

      const data = result.data?.productMediaDelete;
      if (data?.errors?.length > 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: data.errors.map((e: { message: string }) => e.message).join("; "),
        });
      }

      return { success: true };
    }),

  downloadOriginal: protectedClientProcedure
    .input(z.object({ mediaUrl: z.string().url() }))
    .query(async ({ input }) => {
      const result = await downloadImageAsBase64(input.mediaUrl);

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to download image: ${result.error}`,
        });
      }

      return {
        base64: result.base64,
        mimeType: result.mimeType,
      };
    }),
});
