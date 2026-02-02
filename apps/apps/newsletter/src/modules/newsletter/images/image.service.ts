import { Client } from "urql";
import { randomUUID } from "crypto";
import { Readable } from "stream";

import { createLogger } from "../../../logger";
import { createSettingsManager } from "../../../lib/metadata-manager";
import { createImageStorage, ImageMetadata, ImageStorage } from "./image-storage";

const logger = createLogger("ImageService");

export interface ImageUploadResult {
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

export class ImageService {
  private storage: ImageStorage;
  private metadataKey = "newsletter-images";

  constructor(
    private apiClient: Client,
    private saleorApiUrl: string,
    private appId: string,
    private userId: string
  ) {
    this.storage = createImageStorage();
  }

  async uploadImage(
    file: Buffer | Readable,
    originalName: string,
    mimeType: string,
    size: number,
    metadata?: { width?: number; height?: number }
  ): Promise<ImageUploadResult> {
    logger.debug("Uploading image", { originalName, mimeType, size });

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      throw new Error(`Invalid file type: ${mimeType}. Allowed types: ${allowedTypes.join(", ")}`);
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (size > maxSize) {
      throw new Error(`File size exceeds limit: ${size} bytes. Maximum: ${maxSize} bytes (5MB)`);
    }

    // Generate unique filename
    const extension = originalName.split(".").pop() || "jpg";
    const filename = `${randomUUID()}.${extension}`;

    // Upload to storage
    const { url } = await this.storage.upload(file, filename, originalName, mimeType, metadata);

    // Create metadata
    const imageMetadata: ImageMetadata = {
      id: randomUUID(),
      filename,
      originalName,
      url,
      size,
      mimeType,
      width: metadata?.width,
      height: metadata?.height,
      uploadedAt: new Date(),
      uploadedBy: this.userId,
      usedInTemplates: [],
    };

    // Save metadata
    await this.saveImageMetadata(imageMetadata);

    logger.info("Image uploaded successfully", { id: imageMetadata.id, filename, url });

    return imageMetadata;
  }

  async getImages(): Promise<ImageMetadata[]> {
    const metadata = await this.loadImageMetadata();
    return metadata;
  }

  async getImage(id: string): Promise<ImageMetadata | null> {
    const metadata = await this.loadImageMetadata();
    return metadata.find((img) => img.id === id) || null;
  }

  async deleteImage(id: string): Promise<void> {
    const metadata = await this.loadImageMetadata();
    const image = metadata.find((img) => img.id === id);

    if (!image) {
      throw new Error(`Image not found: ${id}`);
    }

    // Check if image is used in templates
    if (image.usedInTemplates && image.usedInTemplates.length > 0) {
      throw new Error(
        `Cannot delete image: it is used in ${image.usedInTemplates.length} template(s). Remove it from templates first.`
      );
    }

    // Delete from storage
    await this.storage.delete(image.filename);

    // Remove from metadata
    const updatedMetadata = metadata.filter((img) => img.id !== id);
    await this.saveAllImageMetadata(updatedMetadata);

    logger.info("Image deleted", { id, filename: image.filename });
  }

  async updateImageUsage(imageId: string, templateIds: string[]): Promise<void> {
    const metadata = await this.loadImageMetadata();
    const image = metadata.find((img) => img.id === imageId);

    if (image) {
      image.usedInTemplates = templateIds;
      await this.saveAllImageMetadata(metadata);
    }
  }

  private async loadImageMetadata(): Promise<ImageMetadata[]> {
    try {
      const settingsManager = createSettingsManager(this.apiClient, this.appId);

      const data = await settingsManager.get(this.metadataKey, this.saleorApiUrl);
      if (!data) {
        return [];
      }

      const parsed = JSON.parse(data) as ImageMetadata[];
      // Convert date strings back to Date objects
      return parsed.map((img) => ({
        ...img,
        uploadedAt: new Date(img.uploadedAt),
      }));
    } catch (error) {
      logger.error("Failed to load image metadata", { error });
      return [];
    }
  }

  private async saveImageMetadata(image: ImageMetadata): Promise<void> {
    const metadata = await this.loadImageMetadata();
    metadata.push(image);
    await this.saveAllImageMetadata(metadata);
  }

  private async saveAllImageMetadata(metadata: ImageMetadata[]): Promise<void> {
    try {
      const settingsManager = createSettingsManager(this.apiClient, this.appId);

      await settingsManager.set({
        key: this.metadataKey,
        value: JSON.stringify(metadata),
        domain: this.saleorApiUrl,
      });
    } catch (error) {
      logger.error("Failed to save image metadata", { error });
      throw error;
    }
  }
}
