"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductGalleryProps {
  images: Array<{
    url: string;
    alt?: string | null;
  }>;
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const selectedImage = images[selectedIndex];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-neutral-100 flex items-center justify-center">
        <svg className="h-24 w-24 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div 
        className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <Image
          src={selectedImage?.url || ""}
          alt={selectedImage?.alt || productName}
          fill
          priority
          className={`object-cover transition-transform duration-300 ${
            isZoomed ? "scale-150" : "scale-100"
          }`}
          style={isZoomed ? {
            transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`
          } : undefined}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        
        {/* Zoom indicator */}
        {!isZoomed && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-600 backdrop-blur-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            Hover to zoom
          </div>
        )}

        {/* Navigation arrows for multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-neutral-700 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
              aria-label="Previous image"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-neutral-700 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
              aria-label="Next image"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                selectedIndex === index 
                  ? "ring-2 ring-neutral-900 ring-offset-2" 
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt || `${productName} - Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

