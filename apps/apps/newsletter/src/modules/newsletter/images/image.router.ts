import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedClientProcedure } from "../../trpc/protected-client-procedure";
import { router } from "../../trpc/trpc-server";
import { ImageService } from "./image.service";

export const imageRouter = router({
  list: protectedClientProcedure.query(async ({ ctx }) => {
    const service = new ImageService(
      ctx.apiClient,
      ctx.saleorApiUrl!,
      ctx.appId!,
      // User ID from context - we'll need to get it from appBridgeState or token
      "system" // TODO: Get actual user ID from context
    );

    try {
      const images = await service.getImages();
      return { images };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to list images",
      });
    }
  }),

  get: protectedClientProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = new ImageService(
        ctx.apiClient,
        ctx.saleorApiUrl!,
        ctx.appId!,
        "system"
      );

      try {
        const image = await service.getImage(input.id);
        if (!image) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Image not found",
          });
        }
        return { image };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to get image",
        });
      }
    }),

  delete: protectedClientProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = new ImageService(
        ctx.apiClient,
        ctx.saleorApiUrl!,
        ctx.appId!,
        "system"
      );

      try {
        await service.deleteImage(input.id);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to delete image",
        });
      }
    }),

  updateUsage: protectedClientProcedure
    .input(
      z.object({
        imageId: z.string(),
        templateIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = new ImageService(
        ctx.apiClient,
        ctx.saleorApiUrl!,
        ctx.appId!,
        "system"
      );

      try {
        await service.updateImageUsage(input.imageId, input.templateIds);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update image usage",
        });
      }
    }),
});
