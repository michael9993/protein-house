import { DashboardModal } from "@dashboard/components/Modal";
import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import { Button } from "@saleor/macaw-ui-next";
import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ReviewImageLightboxProps {
  images: string[];
  open: boolean;
  initialIndex: number;
  onClose: () => void;
}

const ReviewImageLightbox = ({
  images,
  open,
  initialIndex,
  onClose,
}: ReviewImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, open]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handlePrevious, handleNext, onClose]);

  if (images.length === 0 || !open) {
    return null;
  }

  return (
    <DashboardModal open={open} onChange={onClose}>
      <DashboardModal.Content size="xl" disableAutofocus>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            margin: "-24px",
            padding: "24px",
            borderRadius: 0,
          }}
        >
          {/* Close button */}
          <div style={{ position: "absolute", top: "8px", right: "8px", zIndex: 10 }}>
            <Button
              onClick={onClose}
              variant="tertiary"
              size="small"
              icon={<X size={iconSize.small} strokeWidth={iconStrokeWidth} />}
              aria-label="Close image viewer"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "white",
              }}
            />
          </div>

          {/* Previous button */}
          {images.length > 1 && (
            <div
              style={{
                position: "absolute",
                left: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
              }}
            >
              <Button
                onClick={handlePrevious}
                variant="tertiary"
                size="small"
                icon={<ChevronLeft size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
                aria-label="Previous image"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                }}
              />
            </div>
          )}

          {/* Image */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              padding: "16px",
            }}
          >
            <img
              src={images[currentIndex]}
              alt={`Review image ${currentIndex + 1} of ${images.length}`}
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: 4,
              }}
            />
          </div>

          {/* Next button */}
          {images.length > 1 && (
            <div
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
              }}
            >
              <Button
                onClick={handleNext}
                variant="tertiary"
                size="small"
                icon={<ChevronRight size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
                aria-label="Next image"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                }}
              />
            </div>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                color: "white",
                padding: "4px 12px",
                borderRadius: 4,
                fontSize: "14px",
              }}
            >
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </DashboardModal.Content>
    </DashboardModal>
  );
};

export default ReviewImageLightbox;

