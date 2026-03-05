"use client";

import { useState, useRef } from "react";
import { RatingStars } from "./RatingStars";
import { ReviewImageModal } from "./ReviewImageModal";
import { updateProductReview, deleteProductReview } from "@/app/actions";
import { useProductDetailText, useBranding } from "@/providers/StoreConfigProvider";

// Delete Confirmation Modal Component
function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  productDetailText,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  productDetailText: ReturnType<typeof useProductDetailText>;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">{productDetailText.deleteReviewTitle}</h3>
          <p className="mt-2 text-sm text-neutral-600">
            {productDetailText.deleteReviewMessage}
          </p>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {productDetailText.cancelButton}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? productDetailText.deletingButton : productDetailText.deleteReview}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ReviewItemProps {
  id: string;
  rating: number;
  title: string;
  body: string;
  images?: string[];
  helpfulCount: number;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user?: {
    id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  currentUserId?: string | null;
  onMarkHelpful?: (reviewId: string) => void;
  isMarkingHelpful?: boolean;
  onUpdate?: () => void;
  onDelete?: () => void;
}

export function ReviewItem({
  id,
  rating: initialRating,
  title: initialTitle,
  body: initialBody,
  images: initialImages = [],
  helpfulCount,
  isVerifiedPurchase,
  createdAt,
  user,
  currentUserId,
  onMarkHelpful,
  isMarkingHelpful = false,
  onUpdate,
  onDelete,
}: ReviewItemProps) {
  const productDetailText = useProductDetailText();
  const branding = useBranding();
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(initialRating);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [editImages, setEditImages] = useState<string[]>(initialImages);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const isOwner = user?.id && currentUserId && user.id === currentUserId;
  const userName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email?.split("@")[0] || "Anonymous"
    : "Guest";
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return productDetailText.justNow;
    if (diffInSeconds < 3600) return productDetailText.minutesAgo.replace("{count}", Math.floor(diffInSeconds / 60).toString());
    if (diffInSeconds < 86400) return productDetailText.hoursAgo.replace("{count}", Math.floor(diffInSeconds / 3600).toString());
    if (diffInSeconds < 604800) return productDetailText.daysAgo.replace("{count}", Math.floor(diffInSeconds / 86400).toString());
    
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };
  
  const formattedDate = formatDate(createdAt);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Limit to 5 images total
    const currentCount = editImages.length;
    const remainingSlots = 5 - currentCount;
    if (remainingSlots <= 0) {
      setError(productDetailText.maxImagesError);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setError(`Only ${remainingSlots} more image(s) can be uploaded (max 5 total)`);
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
      setEditImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      setError(err?.message || "Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      const result = await updateProductReview({
        reviewId: id,
        rating,
        title,
        body,
        images: editImages.filter(Boolean),
      });
      
      if (result.success) {
        setIsEditing(false);
        onUpdate?.();
      } else {
        setError(result.error || productDetailText.failedToUpdateReview);
      }
    } catch (err: any) {
        setError(err?.message || productDetailText.failedToUpdateReview);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      const result = await deleteProductReview(id);
      
      if (result.success) {
        setShowDeleteModal(false);
        onDelete?.();
      } else {
        setError(result.error || productDetailText.failedToDeleteReview);
        setShowDeleteModal(false);
      }
    } catch (err: any) {
        setError(err?.message || productDetailText.failedToDeleteReview);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="border-b border-neutral-200 py-6 last:border-b-0">
        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-800">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-900">{productDetailText.ratingLabel}</label>
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
            <label className="block text-sm font-medium text-neutral-900">{productDetailText.titleLabel}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              maxLength={255}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-900">{productDetailText.reviewLabel}</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label htmlFor={`review-images-${id}`} className="block text-sm font-medium text-neutral-900">
              {productDetailText.imagesOptional}
            </label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                id={`review-images-${id}`}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e.target.files)}
                disabled={uploadingImages || isSaving}
                className="block w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:cursor-pointer file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-neutral-500">
                {productDetailText.uploadImagesHint.replace("{count}", editImages.length.toString())}
              </p>
            </div>

            {/* Image Preview */}
            {editImages.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {editImages.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Review image ${index + 1}`}
                      className="h-24 w-full rounded-lg object-cover border border-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      disabled={isSaving}
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

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !body.trim()}
              className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: branding.colors.primary }}
            >
              {isSaving ? productDetailText.savingButton : productDetailText.saveButton}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setRating(initialRating);
                setTitle(initialTitle);
                setBody(initialBody);
                setEditImages(initialImages);
                setError(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={isSaving}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
            >
              {productDetailText.cancelButton}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-neutral-200 py-6 last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-sm font-medium text-neutral-600">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-neutral-900">{userName}</p>
                {isVerifiedPurchase && (
                  <span className="rounded bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                    {productDetailText.verifiedPurchase}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <RatingStars rating={rating} size="sm" />
                <span className="text-xs text-neutral-500">{formattedDate}</span>
              </div>
            </div>
          </div>

          <h4 className="mt-3 font-semibold text-neutral-900">{title}</h4>
          <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{body}</p>

          {initialImages.length > 0 && (
            <>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {initialImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Review image ${index + 1}`}
                      className="h-32 w-full rounded-lg object-cover border border-neutral-200 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        setSelectedImageIndex(index);
                        setImageModalOpen(true);
                      }}
                    />
                  </div>
                ))}
              </div>
              <ReviewImageModal
                images={initialImages}
                currentIndex={selectedImageIndex}
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                onNavigate={setSelectedImageIndex}
              />
            </>
          )}

          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={() => onMarkHelpful?.(id)}
              disabled={isMarkingHelpful}
              className="flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
              <span>{productDetailText.helpfulButtonWithCount.replace("{count}", helpfulCount.toString())}</span>
            </button>
            {isOwner && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                  title="Edit review"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  {productDetailText.editReview}
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  title="Delete review"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  {productDetailText.deleteReview}
                </button>
              </div>
            )}
          </div>
          {error && !isEditing && (
            <div className="mt-2 rounded-lg border border-error-200 bg-error-50 p-2 text-sm text-error-800">
              {error}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteModal(false);
          }
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        productDetailText={productDetailText}
      />
    </div>
  );
}

