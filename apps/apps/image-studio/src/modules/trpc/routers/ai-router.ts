import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { removeBackground, checkRembgHealth } from "../../ai/rembg-client";
import { generateImage, editImage, isGenerationConfigured } from "../../ai/together-client";
import { upscaleImage, checkEsrganHealth } from "../../ai/esrgan-client";

export const aiRouter = router({
  removeBackground: protectedClientProcedure
    .input(z.object({ imageBase64: z.string() }))
    .mutation(async ({ input }) => {
      const result = await removeBackground(input.imageBase64);
      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error ?? "Background removal failed",
        });
      }
      return { resultBase64: result.resultBase64 };
    }),

  generateBackground: protectedClientProcedure
    .input(
      z.object({
        prompt: z.string().min(1).max(500),
        width: z.number().min(256).max(1440).default(1024),
        height: z.number().min(256).max(1440).default(1024),
      })
    )
    .mutation(async ({ input }) => {
      const result = await generateImage(input.prompt, input.width, input.height);
      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error ?? "Image generation failed",
        });
      }
      return { resultBase64: result.resultBase64 };
    }),

  upscale: protectedClientProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        scale: z.enum(["2", "3", "4"]).default("2"),
      })
    )
    .mutation(async ({ input }) => {
      const result = await upscaleImage(input.imageBase64, parseInt(input.scale) as 2 | 3 | 4);
      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error ?? "Upscaling failed",
        });
      }
      return { resultBase64: result.resultBase64 };
    }),

  aiEdit: protectedClientProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        prompt: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ input }) => {
      const result = await editImage(input.imageBase64, input.prompt);
      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error ?? "AI image editing failed",
        });
      }
      return { resultBase64: result.resultBase64 };
    }),

  checkHealth: protectedClientProcedure.query(async () => {
    const [rembg, esrgan] = await Promise.all([
      checkRembgHealth(),
      checkEsrganHealth(),
    ]);
    return {
      rembg,
      esrgan,
      gemini: isGenerationConfigured(),
    };
  }),
});
