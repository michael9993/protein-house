import { Box } from "@saleor/macaw-ui-next";
import { useCallback, useState } from "react";

import ReviewImageLightbox from "./ReviewImageLightbox";

interface ReviewImageGalleryProps {
  images: string[];
}

const ReviewImageGallery = ({ images }: ReviewImageGalleryProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleImageClick = useCallback((index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <Box
        display="flex"
        gap={2}
        overflowX="auto"
        paddingY={1}
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--mu-colors-neutral-plain) transparent",
        }}
      >
        {images.map((image, index) => (
          <Box
            key={index}
            as="button"
            onClick={() => handleImageClick(index)}
            style={{
              flexShrink: 0,
              cursor: "pointer",
              border: "1px solid var(--mu-colors-neutral-plain)",
              borderRadius: 4,
              overflow: "hidden",
              padding: 0,
              background: "transparent",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
            aria-label={`View image ${index + 1} of ${images.length}`}
          >
            <img
              src={image}
              alt={`Review image ${index + 1}`}
              style={{
                width: 120,
                height: 120,
                objectFit: "cover",
                display: "block",
              }}
            />
          </Box>
        ))}
      </Box>

      <ReviewImageLightbox
        images={images}
        open={lightboxOpen}
        initialIndex={selectedIndex}
        onClose={handleClose}
      />
    </>
  );
};

export default ReviewImageGallery;
