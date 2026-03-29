import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { removeBackground, checkRembgHealth } from "../../ai/rembg-client";
import { isGenerationConfigured } from "../../ai/together-client";
import { upscaleImage, checkEsrganHealth } from "../../ai/esrgan-client";
import { getProvider, getDefaultProvider, getAvailableModelInfos } from "../../ai/provider-registry";

const aiOptionsSchema = z.object({
  negativePrompt: z.string().max(500).optional(),
  seed: z.number().int().optional(),
  stylePreset: z.string().optional(),
  thinkingLevel: z.enum(["none", "low", "medium", "high"]).optional(),
  aspectRatio: z.string().optional(),
}).optional();

// In-memory job store for async upscaling (avoids Cloudflare 100s timeout)
interface UpscaleJob {
  status: "processing" | "complete" | "error";
  resultBase64?: string;
  error?: string;
  createdAt: number;
}

const upscaleJobs = new Map<string, UpscaleJob>();

// Clean up jobs older than 10 minutes to prevent memory leaks
function cleanupOldJobs() {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [id, job] of upscaleJobs) {
    if (job.createdAt < cutoff) {
      upscaleJobs.delete(id);
    }
  }
}

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

  getAvailableModels: protectedClientProcedure.query(() => {
    return { models: getAvailableModelInfos() };
  }),

  generateBackground: protectedClientProcedure
    .input(
      z.object({
        prompt: z.string().min(1).max(500),
        width: z.number().min(256).max(1440).default(1024),
        height: z.number().min(256).max(1440).default(1024),
        modelId: z.string().optional(),
        options: aiOptionsSchema,
      })
    )
    .mutation(async ({ input }) => {
      const provider = input.modelId
        ? getProvider(input.modelId)
        : getDefaultProvider();

      if (!provider) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: input.modelId
            ? `Model "${input.modelId}" not available. Check API key configuration.`
            : "No AI providers configured. Set GEMINI_API_KEY, OPENAI_API_KEY, or STABILITY_API_KEY.",
        });
      }

      const result = await provider.generateImage({
        prompt: input.prompt,
        width: input.width,
        height: input.height,
        ...input.options,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error ?? "Image generation failed",
        });
      }
      return { resultBase64: result.resultBase64 };
    }),

  // Async upscale — returns job ID instantly, client polls for result
  upscaleStart: protectedClientProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        scale: z.enum(["2", "3", "4"]).default("2"),
      })
    )
    .mutation(async ({ input }) => {
      cleanupOldJobs();

      const jobId = `upscale_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      upscaleJobs.set(jobId, {
        status: "processing",
        createdAt: Date.now(),
      });

      // Fire and forget — process in background
      upscaleImage(input.imageBase64, parseInt(input.scale) as 2 | 3 | 4)
        .then((result) => {
          const job = upscaleJobs.get(jobId);
          if (!job) return; // cleaned up
          if (result.success) {
            job.status = "complete";
            job.resultBase64 = result.resultBase64;
          } else {
            job.status = "error";
            job.error = result.error ?? "Upscaling failed";
          }
        })
        .catch((err) => {
          const job = upscaleJobs.get(jobId);
          if (!job) return;
          job.status = "error";
          job.error = err instanceof Error ? err.message : "Unknown error";
        });

      return { jobId };
    }),

  // Poll for upscale result
  upscaleStatus: protectedClientProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      cleanupOldJobs();
      const job = upscaleJobs.get(input.jobId);
      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found or expired",
        });
      }

      if (job.status === "complete") {
        const result = job.resultBase64;
        // Clean up after delivering result
        upscaleJobs.delete(input.jobId);
        return { status: "complete" as const, resultBase64: result };
      }

      if (job.status === "error") {
        const error = job.error;
        upscaleJobs.delete(input.jobId);
        return { status: "error" as const, error };
      }

      return { status: "processing" as const };
    }),

  aiEdit: protectedClientProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        prompt: z.string().min(1).max(1000),
        modelId: z.string().optional(),
        mask: z.string().optional(),
        editType: z.enum(["general", "inpaint", "style-transfer"]).optional(),
        strength: z.number().min(0).max(1).optional(),
        options: aiOptionsSchema,
      })
    )
    .mutation(async ({ input }) => {
      const provider = input.modelId
        ? getProvider(input.modelId)
        : getDefaultProvider();

      if (!provider) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: input.modelId
            ? `Model "${input.modelId}" not available. Check API key configuration.`
            : "No AI providers configured. Set GEMINI_API_KEY, OPENAI_API_KEY, or STABILITY_API_KEY.",
        });
      }

      const result = await provider.editImage({
        imageBase64: input.imageBase64,
        prompt: input.prompt,
        mask: input.mask,
        editType: input.editType,
        strength: input.strength,
        ...input.options,
      });

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
