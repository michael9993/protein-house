import { NextApiRequest, NextApiResponse } from "next";
import * as fs from "fs/promises";
import * as path from "path";

import { createLogger } from "../../../../logger";

const logger = createLogger("api/newsletter/images/[filename]");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { filename } = req.query;

  if (!filename || typeof filename !== "string") {
    return res.status(400).json({ error: "Filename is required" });
  }

  const storageType = process.env.NEWSLETTER_IMAGE_STORAGE || "local";

  try {
    if (storageType === "s3") {
      // Serve from S3 (redirect or proxy)
      const endpoint = process.env.NEWSLETTER_S3_ENDPOINT;
      const bucket = process.env.NEWSLETTER_S3_BUCKET;
      const cdnUrl = process.env.NEWSLETTER_CDN_URL;

      if (!endpoint || !bucket) {
        return res.status(500).json({ error: "S3 configuration missing" });
      }

      const key = `newsletter-images/${filename}`;
      const url = cdnUrl
        ? `${cdnUrl}/${key}`
        : `https://${endpoint}/${bucket}/${key}`;

      // Redirect to S3 URL
      return res.redirect(302, url);
    } else {
      // Serve from local filesystem
      const uploadsDir = path.join(process.cwd(), "uploads", "newsletter-images");
      const filePath = path.join(uploadsDir, filename);

      // Security: prevent directory traversal
      if (!filePath.startsWith(uploadsDir)) {
        return res.status(403).json({ error: "Invalid file path" });
      }

      try {
        const fileBuffer = await fs.readFile(filePath);
        
        // Determine content type from extension
        const ext = path.extname(filename).toLowerCase();
        const contentTypeMap: Record<string, string> = {
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".png": "image/png",
          ".gif": "image/gif",
          ".webp": "image/webp",
        };
        const contentType = contentTypeMap[ext] || "application/octet-stream";

        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return res.send(fileBuffer);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return res.status(404).json({ error: "Image not found" });
        }
        throw error;
      }
    }
  } catch (error) {
    logger.error("Error serving image", { error, filename });
    return res.status(500).json({
      error: "Failed to serve image",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
