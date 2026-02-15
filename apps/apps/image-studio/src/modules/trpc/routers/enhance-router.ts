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

export const enhanceRouter = router({
  resize: protectedClientProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        width: z.number().min(1).max(8000),
        height: z.number().min(1).max(8000),
        fit: z.enum(["cover", "contain", "fill", "inside", "outside"]).default("contain"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const buffer = base64ToBuffer(input.imageBase64);
        const result = await sharp(buffer)
          .resize(input.width, input.height, { fit: input.fit })
          .png()
          .toBuffer();
        return { resultBase64: bufferToBase64(result, "image/png") };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Resize failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  adjustColors: protectedClientProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        brightness: z.number().min(0).max(3).default(1),
        saturation: z.number().min(0).max(3).default(1),
        hue: z.number().min(0).max(360).default(0),
        contrast: z.number().min(0.1).max(3).optional(),
        sharpness: z.number().min(0).max(10).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const buffer = base64ToBuffer(input.imageBase64);
        let pipeline = sharp(buffer).modulate({
          brightness: input.brightness,
          saturation: input.saturation,
          hue: input.hue,
        });

        if (input.contrast && input.contrast !== 1) {
          pipeline = pipeline.linear(input.contrast, -(128 * (input.contrast - 1)));
        }

        if (input.sharpness && input.sharpness > 0) {
          pipeline = pipeline.sharpen({ sigma: input.sharpness });
        }

        const result = await pipeline.png().toBuffer();
        return { resultBase64: bufferToBase64(result, "image/png") };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Color adjustment failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  convertFormat: protectedClientProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        format: z.enum(["png", "jpeg", "webp"]),
        quality: z.number().min(1).max(100).default(85),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const buffer = base64ToBuffer(input.imageBase64);
        let pipeline = sharp(buffer);

        const mimeMap = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" } as const;

        if (input.format === "png") {
          pipeline = pipeline.png();
        } else if (input.format === "jpeg") {
          pipeline = pipeline.jpeg({ quality: input.quality });
        } else {
          pipeline = pipeline.webp({ quality: input.quality });
        }

        const result = await pipeline.toBuffer();
        return {
          resultBase64: bufferToBase64(result, mimeMap[input.format]),
          mimeType: mimeMap[input.format],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Format conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),
});
