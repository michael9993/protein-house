"use client";

import { useState, FormEvent, useRef } from "react";
import { RatingStars } from "./RatingStars";
import { createProductReview } from "@/app/actions";
import { useProductDetailText, useBranding } from "@/providers/StoreConfigProvider";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ productId, onSuccess, onCancel }: ReviewFormProps) {
  const productDetailText = useProductDetailText();
  const branding = useBranding();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Limit to 5 images total
    const currentCount = images.length;
    const remainingSlots = 5 - currentCount;
    if (remainingSlots <= 0) {
      setError(productDetailText.maxImagesError);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setError(productDetailText.onlyXMoreImagesError.replace("{count}", remainingSlots.toString()));
    }

    setUploadingImages(true);
    setError(null);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch("/api/review-images", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json() as { error?: string };
          throw new Error(errorData.error || "Failed to upload image");
        }

        const data = await response.json() as { url: string };
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      setError(err?.message || productDetailText.failedToUploadImages);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError(productDetailText.pleaseSelectRating);
      return;
    }

    if (!title.trim()) {
      setError(productDetailText.pleaseEnterReviewTitle);
      return;
    }

    if (!body.trim()) {
      setError(productDetailText.pleaseEnterReviewBody);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createProductReview({
        productId,
        rating,
        title: title.trim(),
        body: body.trim(),
        images: images.filter(Boolean),
      });

      if (!result.success) {
        setError(result.error || productDetailText.failedToSubmitReview);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          // Reset form
          setRating(0);
          setTitle("");
          setBody("");
          setImages([]);
          setSuccess(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error submitting review:", err);
      const errorMessage = err?.message || productDetailText.failedToSubmitReviewRetry;
      
      // Check if error is due to authentication
      if (errorMessage.includes("authenticated") || errorMessage.includes("authentication")) {
        setError(productDetailText.mustBeLoggedInToReview);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
        <svg
          className="mx-auto h-12 w-12 text-emerald-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="mt-2 font-medium text-emerald-900">{productDetailText.thankYouMessage}</p>
        <p className="mt-1 text-sm text-emerald-700">{productDetailText.reviewSubmittedMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-900">
          {productDetailText.ratingRequired} <span className="text-red-500">*</span>
        </label>
        <div className="mt-2">
          <RatingStars
            rating={rating}
            interactive
            onRatingChange={setRating}
            size="lg"
          />
        </div>
      </div>

      <div>
        <label htmlFor="review-title" className="block text-sm font-medium text-neutral-900">
          {productDetailText.reviewTitleRequired} <span className="text-red-500">*</span>
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={255}
          required
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
          placeholder={productDetailText.reviewTitlePlaceholder}
        />
      </div>

      <div>
        <label htmlFor="review-body" className="block text-sm font-medium text-neutral-900">
          {productDetailText.reviewRequired} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          required
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
          placeholder={productDetailText.reviewPlaceholder}
        />
        <p className="mt-1 text-xs text-neutral-500">
          {productDetailText.characterCount.replace("{count}", body.length.toString())}
        </p>
      </div>

      {/* Image Upload */}
      <div>
        <label htmlFor="review-images" className="block text-sm font-medium text-neutral-900">
          {productDetailText.imagesOptional}
        </label>
        <div className="mt-2">
          <input
            ref={fileInputRef}
            id="review-images"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleImageUpload(e.target.files)}
            disabled={uploadingImages || isSubmitting}
            className="block w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:cursor-pointer file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-neutral-500">
            {productDetailText.uploadImagesHint.replace("{count}", images.length.toString())}
          </p>
        </div>

        {/* Image Preview */}
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Review image ${index + 1}`}
                  className="h-24 w-full rounded-lg object-cover border border-neutral-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  disabled={isSubmitting}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                  aria-label="Remove image"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {uploadingImages && (
          <div className="mt-2 text-sm text-neutral-600">
            {productDetailText.uploadingImages}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {productDetailText.cancelButton}
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{
            backgroundColor: branding.colors.primary,
          }}
        >
          {isSubmitting ? productDetailText.submittingButton : productDetailText.submitReviewButton}
        </button>
      </div>
    </form>
  );
}

