import { z } from "zod";
import sharp from "sharp";
import { TRPCError } from "@trpc/server";
import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";

function base64ToBuffer(base64: string): Buffer {
  const clean = base64.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(clean, "base64");
}

function bufferToBase64(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

const MIME_MAP = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
} as const;

const formatSchema = z.enum(["png", "jpeg", "webp", "avif"]);

function applyFormat(
  pipeline: sharp.Sharp,
  format: z.infer<typeof formatSchema>,
  quality: number,
): sharp.Sharp {
  switch (format) {
    case "png":
      return pipeline.png();
    case "jpeg":
      return pipeline.jpeg({ quality });
    case "webp":
      return pipeline.webp({ quality });
    case "avif":
      return pipeline.avif({ quality });
  }
}

const exportSpecSchema = z.object({
  label: z.string(),
  suffix: z.string().default(""),
  format: formatSchema,
  quality: z.number().min(1).max(100).default(92),
  width: z.number().min(1).max(16384).optional(),
  height: z.number().min(1).max(16384).optional(),
  fit: z.enum(["cover", "contain", "fill", "inside", "outside"]).default("contain"),
  dpi: z.number().min(72).max(1200).optional(),
});

export const exportRouter = router({
  /**
   * Process a single export with optional resize, format conversion, and DPI metadata.
   * Client sends a high-res source (already multiplied via Fabric.js toDataURL).
   * Server handles final resize, format, and metadata embedding.
   */
  processExport: protectedClientProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        format: formatSchema,
        quality: z.number().min(1).max(100).default(92),
        width: z.number().min(1).max(16384).optional(),
        height: z.number().min(1).max(16384).optional(),
        fit: z.enum(["cover", "contain", "fill", "inside", "outside"]).default("contain"),
        dpi: z.number().min(72).max(1200).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const buffer = base64ToBuffer(input.imageBase64);
        let pipeline = sharp(buffer);

        // Resize if custom dimensions specified
        if (input.width || input.height) {
          pipeline = pipeline.resize(input.width, input.height, { fit: input.fit });
        }

        // Embed DPI metadata
        if (input.dpi) {
          pipeline = pipeline.withMetadata({ density: input.dpi });
        }

        // Apply format conversion
        pipeline = applyFormat(pipeline, input.format, input.quality);

        const result = await pipeline.toBuffer();

        // Get actual output dimensions
        const metadata = await sharp(result).metadata();

        return {
          resultBase64: bufferToBase64(result, MIME_MAP[input.format]),
          fileSizeBytes: result.length,
          width: metadata.width ?? 0,
          height: metadata.height ?? 0,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  /**
   * Batch export — process multiple output specs from a single source image.
   * Decodes the source once and runs all Sharp pipelines in parallel.
   */
  batchExport: protectedClientProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        specs: z.array(exportSpecSchema).min(1).max(10),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const sourceBuffer = base64ToBuffer(input.imageBase64);

        const results = await Promise.all(
          input.specs.map(async (spec) => {
            let pipeline = sharp(sourceBuffer);

            if (spec.width || spec.height) {
              pipeline = pipeline.resize(spec.width, spec.height, { fit: spec.fit });
            }

            if (spec.dpi) {
              pipeline = pipeline.withMetadata({ density: spec.dpi });
            }

            pipeline = applyFormat(pipeline, spec.format, spec.quality);

            const result = await pipeline.toBuffer();
            const metadata = await sharp(result).metadata();

            return {
              label: spec.label,
              suffix: spec.suffix,
              format: spec.format,
              resultBase64: bufferToBase64(result, MIME_MAP[spec.format]),
              fileSizeBytes: result.length,
              width: metadata.width ?? 0,
              height: metadata.height ?? 0,
            };
          })
        );

        return { results };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Batch export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  /**
   * Estimate output file size without returning the full base64.
   * Used for showing "Estimated: ~2.4 MB" in the export dialog.
   */
  estimateSize: protectedClientProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        format: formatSchema,
        quality: z.number().min(1).max(100).default(92),
        width: z.number().min(1).max(16384).optional(),
        height: z.number().min(1).max(16384).optional(),
        fit: z.enum(["cover", "contain", "fill", "inside", "outside"]).default("contain"),
      })
    )
    .query(async ({ input }) => {
      try {
        const buffer = base64ToBuffer(input.imageBase64);
        let pipeline = sharp(buffer);

        if (input.width || input.height) {
          pipeline = pipeline.resize(input.width, input.height, { fit: input.fit });
        }

        pipeline = applyFormat(pipeline, input.format, input.quality);

        const result = await pipeline.toBuffer();
        const metadata = await sharp(result).metadata();

        return {
          fileSizeBytes: result.length,
          width: metadata.width ?? 0,
          height: metadata.height ?? 0,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Size estimation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),
});
