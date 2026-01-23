import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs/promises";
import * as path from "path";
import { Readable } from "stream";

import { createLogger } from "../../../logger";

const logger = createLogger("ImageStorage");

export interface ImageMetadata {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  uploadedAt: Date;
  uploadedBy: string;
  usedInTemplates?: string[];
}

export interface ImageStorage {
  upload(
    file: Buffer | Readable,
    filename: string,
    originalName: string,
    mimeType: string,
    metadata?: { width?: number; height?: number }
  ): Promise<{ url: string; filename: string }>;
  delete(filename: string): Promise<void>;
  getUrl(filename: string): string;
  getThumbnailUrl(filename: string): string | null;
}

class LocalImageStorage implements ImageStorage {
  private uploadsDir: string;

  constructor() {
    // Store in uploads directory outside public folder
    this.uploadsDir = path.join(process.cwd(), "uploads", "newsletter-images");
    this.ensureUploadsDir();
  }

  private async ensureUploadsDir() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      logger.error("Failed to create uploads directory", { error });
    }
  }

  async upload(
    file: Buffer | Readable,
    filename: string,
    originalName: string,
    mimeType: string
  ): Promise<{ url: string; filename: string }> {
    const filePath = path.join(this.uploadsDir, filename);

    try {
      if (Buffer.isBuffer(file)) {
        await fs.writeFile(filePath, file);
      } else {
        const chunks: Buffer[] = [];
        for await (const chunk of file) {
          chunks.push(chunk);
        }
        await fs.writeFile(filePath, Buffer.concat(chunks));
      }

      // Return URL that will be served via API route
      const url = `/api/newsletter/images/${filename}`;
      logger.debug("Image uploaded to local storage", { filename, url });

      return { url, filename };
    } catch (error) {
      logger.error("Failed to upload image to local storage", { error, filename });
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async delete(filename: string): Promise<void> {
    const filePath = path.join(this.uploadsDir, filename);
    try {
      await fs.unlink(filePath);
      logger.debug("Image deleted from local storage", { filename });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        logger.error("Failed to delete image from local storage", { error, filename });
        throw error;
      }
      // File doesn't exist, that's okay
    }
  }

  getUrl(filename: string): string {
    return `/api/newsletter/images/${filename}`;
  }

  getThumbnailUrl(filename: string): string | null {
    // For local storage, thumbnails would be stored as filename-thumb.jpg
    const thumbnailFilename = filename.replace(/\.[^/.]+$/, "-thumb.jpg");
    return `/api/newsletter/images/${thumbnailFilename}`;
  }
}

class S3ImageStorage implements ImageStorage {
  private s3Client: S3Client;
  private bucket: string;
  private cdnUrl?: string;
  private region: string;

  constructor() {
    const endpoint = process.env.NEWSLETTER_S3_ENDPOINT;
    const accessKeyId = process.env.NEWSLETTER_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.NEWSLETTER_S3_SECRET_ACCESS_KEY;
    this.bucket = process.env.NEWSLETTER_S3_BUCKET || "";
    this.region = process.env.NEWSLETTER_S3_REGION || "us-east-1";
    this.cdnUrl = process.env.NEWSLETTER_CDN_URL;

    if (!endpoint || !accessKeyId || !secretAccessKey || !this.bucket) {
      throw new Error(
        "S3 configuration missing. Required: NEWSLETTER_S3_ENDPOINT, NEWSLETTER_S3_ACCESS_KEY_ID, NEWSLETTER_S3_SECRET_ACCESS_KEY, NEWSLETTER_S3_BUCKET"
      );
    }

    this.s3Client = new S3Client({
      endpoint: `https://${endpoint}`,
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for DigitalOcean Spaces
    });

    logger.debug("S3 image storage initialized", { endpoint, bucket: this.bucket, region: this.region });
  }

  async upload(
    file: Buffer | Readable,
    filename: string,
    originalName: string,
    mimeType: string
  ): Promise<{ url: string; filename: string }> {
    const key = `newsletter-images/${filename}`;

    try {
      let body: Buffer;
      if (Buffer.isBuffer(file)) {
        body = file;
      } else {
        const chunks: Buffer[] = [];
        for await (const chunk of file) {
          chunks.push(chunk);
        }
        body = Buffer.concat(chunks);
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: mimeType,
        ACL: "public-read", // Make images publicly accessible
      });

      await this.s3Client.send(command);

      const url = this.cdnUrl
        ? `${this.cdnUrl}/${key}`
        : `https://${process.env.NEWSLETTER_S3_ENDPOINT}/${this.bucket}/${key}`;

      logger.debug("Image uploaded to S3", { filename, key, url });

      return { url, filename };
    } catch (error) {
      logger.error("Failed to upload image to S3", { error, filename, key });
      throw new Error(`Failed to upload image to S3: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async delete(filename: string): Promise<void> {
    const key = `newsletter-images/${filename}`;
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
      logger.debug("Image deleted from S3", { filename, key });
    } catch (error) {
      logger.error("Failed to delete image from S3", { error, filename, key });
      throw error;
    }
  }

  getUrl(filename: string): string {
    const key = `newsletter-images/${filename}`;
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${key}`;
    }
    return `https://${process.env.NEWSLETTER_S3_ENDPOINT}/${this.bucket}/${key}`;
  }

  getThumbnailUrl(filename: string): string | null {
    const thumbnailFilename = filename.replace(/\.[^/.]+$/, "-thumb.jpg");
    const key = `newsletter-images/${thumbnailFilename}`;
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${key}`;
    }
    return `https://${process.env.NEWSLETTER_S3_ENDPOINT}/${this.bucket}/${key}`;
  }
}

export function createImageStorage(): ImageStorage {
  const storageType = process.env.NEWSLETTER_IMAGE_STORAGE || "local";

  if (storageType === "s3") {
    return new S3ImageStorage();
  }

  return new LocalImageStorage();
}
