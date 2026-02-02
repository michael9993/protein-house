import { NextApiRequest, NextApiResponse } from "next";
import * as fs from "fs/promises";
import { IncomingForm } from "formidable";
import type { File } from "formidable";

import { createLogger } from "../../../../logger";
import { createSimpleGraphQLClient } from "../../../../lib/create-graphql-client";
import { saleorApp } from "../../../../saleor-app";
import { ImageService } from "../../../../modules/newsletter/images/image.service";
import { SALEOR_API_URL_HEADER, SALEOR_AUTHORIZATION_BEARER_HEADER } from "@saleor/app-sdk/headers";

const logger = createLogger("api/newsletter/images/upload");

// Simple MIME type detection from magic bytes
function detectMimeType(buffer: Buffer): string | null {
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return "image/gif";
  }
  // WebP: Check for RIFF...WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

// Disable default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const saleorApiUrl = req.headers[SALEOR_API_URL_HEADER] as string;
    const token = req.headers[SALEOR_AUTHORIZATION_BEARER_HEADER] as string;

    if (!saleorApiUrl || !token) {
      return res.status(400).json({ error: "Missing Saleor API URL or authorization token" });
    }

    // Get auth data
    const authData = await saleorApp.apl.get(saleorApiUrl);
    if (!authData) {
      return res.status(401).json({ error: "App not authenticated" });
    }

    // Parse form data
    const form = new IncomingForm({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
      multiples: false,
    });

    const parsed = await form.parse(req);
    const files = parsed.files;
    const fileField = files.file;
    const file = Array.isArray(fileField) ? fileField[0] : (fileField as File | undefined);
    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Read file buffer
    const fileBuffer = await fs.readFile(file.filepath);
    
    // Validate file type - check magic bytes
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const detectedMimeType = file.mimetype || detectMimeType(fileBuffer);
    
    if (!detectedMimeType || !allowedMimeTypes.includes(detectedMimeType.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid file type: ${detectedMimeType || "unknown"}. Allowed types: ${allowedMimeTypes.join(", ")}`,
      });
    }

    // Create image service
    const apiClient = createSimpleGraphQLClient({
      saleorApiUrl: authData.saleorApiUrl,
      token: authData.token,
    });

    const imageService = new ImageService(
      apiClient,
      authData.saleorApiUrl,
      authData.appId,
      "system" // TODO: Get actual user ID from token
    );

    // Upload image
    const result = await imageService.uploadImage(
      fileBuffer,
      file.originalFilename || file.newFilename,
      detectedMimeType,
      file.size,
      // TODO: Extract width/height from image if needed (using sharp or similar)
    );

    // Clean up temp file
    await fs.unlink(file.filepath).catch(() => {
      // Ignore cleanup errors
    });

    logger.info("Image uploaded successfully", { id: result.id, filename: result.filename });

    return res.status(200).json(result);
  } catch (error) {
    logger.error("Error uploading image", { error });
    return res.status(500).json({
      error: "Failed to upload image",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
