"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Zoom } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

// Swiper CSS
import "swiper/css";

import "swiper/css/zoom";

import { useComponentStyle, useComponentClasses } from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";

interface ProductGalleryProps {
  images: Array<{
    url: string;
    alt?: string | null;
  }>;
  productName: string;
  discountPercent?: number;
  allowLightbox?: boolean;
}

export function ProductGallery({ images, productName, discountPercent, allowLightbox = true }: ProductGalleryProps) {
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const cdStyle = useComponentStyle("pdp.gallery");
  const cdClasses = useComponentClasses("pdp.gallery");

  // Zoom container ref for scroll wheel
  const zoomContainerRef = useRef<HTMLDivElement>(null);

  // Thumbnail scroll state
  const thumbsRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  const handleZoomChange = useCallback((_swiper: SwiperType, scale: number) => {
    setIsZoomed(scale > 1);
    setZoomScale(Math.round(scale * 10) / 10);
  }, []);

  // Scroll wheel zoom control
  useEffect(() => {
    const el = zoomContainerRef.current;
    if (!el || !allowLightbox || !mainSwiper) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoom = mainSwiper.zoom;
      const currentScale = (zoom as unknown as { scale: number }).scale || 1;
      const delta = e.deltaY > 0 ? -0.3 : 0.3;
      const newScale = Math.min(3, Math.max(1, currentScale + delta));

      if (newScale <= 1) {
        zoom.out();
      } else {
        // Use zoom.in() to enter zoom, then manually adjust scale
        if (currentScale <= 1) {
          zoom.in();
        }
        // Access the zoom container's transform to set custom scale
        const slideEl = mainSwiper.slides[mainSwiper.activeIndex];
        const zoomContainer = slideEl?.querySelector(".swiper-zoom-container") as HTMLElement;
        if (zoomContainer) {
          const imageEl = zoomContainer.querySelector("img") as HTMLElement;
          if (imageEl) {
            imageEl.style.transform = `translate3d(0px, 0px, 0px) scale(${newScale})`;
          }
          // Update internal scale tracking
          (zoom as unknown as { scale: number }).scale = newScale;
          setIsZoomed(newScale > 1);
          setZoomScale(Math.round(newScale * 10) / 10);
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [allowLightbox, mainSwiper]);

  // Thumbnail overflow detection
  const updateThumbScroll = useCallback(() => {
    const el = thumbsRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollStart(scrollLeft > 2);
    setCanScrollEnd(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = thumbsRef.current;
    if (!el) return;
    updateThumbScroll();
    el.addEventListener("scroll", updateThumbScroll, { passive: true });
    const ro = new ResizeObserver(updateThumbScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateThumbScroll);
      ro.disconnect();
    };
  }, [updateThumbScroll, images.length]);

  const scrollThumbs = useCallback((direction: "start" | "end") => {
    const el = thumbsRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "end" ? 200 : -200, behavior: "smooth" });
  }, []);

  // Auto-scroll thumbnail strip to keep active thumbnail visible
  useEffect(() => {
    const container = thumbsRef.current;
    if (!container) return;
    const activeThumb = container.children[activeIndex] as HTMLElement | undefined;
    if (!activeThumb) return;
    activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activeIndex]);

  // Double-click to toggle zoom
  const handleDoubleClick = useCallback(() => {
    if (!allowLightbox || !mainSwiper) return;
    if (isZoomed) {
      mainSwiper.zoom.out();
    } else {
      mainSwiper.zoom.in();
    }
  }, [allowLightbox, mainSwiper, isZoomed]);

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
    <div
      data-cd="pdp-gallery"
      className={`flex flex-col gap-3 group relative ${cdClasses}`}
      style={{
        ...buildComponentStyle("pdp.gallery", cdStyle),
      }}
    >
      {/* Main image */}
      <div className="relative">
        {/* Discount Ribbon */}
        {(discountPercent || 0) > 0 && (
          <div className="absolute -start-2 top-4 z-20 sm:-start-3 sm:top-6 pointer-events-none">
            <div
              className="relative flex items-center px-3 py-1.5 text-xs font-bold text-white shadow-lg sm:px-4 sm:py-2 sm:text-sm"
              style={{ backgroundColor: "var(--store-error, #ef4444)" }}
            >
              <span>{discountPercent}% OFF</span>
              <div
                className="absolute -end-2 top-0 h-full w-2"
                style={{
                  background: "linear-gradient(135deg, var(--store-error, #ef4444) 50%, transparent 50%)",
                }}
              />
              <div
                className="absolute -start-1 -bottom-1 h-2 w-2"
                style={{
                  background: "var(--store-error-700, #b91c1c)",
                  clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                }}
              />
            </div>
          </div>
        )}

        {/* Main Swiper */}
        <div
          ref={zoomContainerRef}
          className="relative w-full aspect-square overflow-hidden rounded-2xl bg-neutral-100"
        >
          <Swiper
            spaceBetween={10}
            modules={[Zoom]}
            className="h-full w-full"
            zoom={allowLightbox ? { maxRatio: 3, minRatio: 1 } : false}
            allowTouchMove={!isZoomed}
            onSwiper={setMainSwiper}
            onSlideChange={(swiper) => {
              setActiveIndex(swiper.activeIndex);
            }}
            onZoomChange={handleZoomChange}
          >
            {images.map((image, index) => (
              <SwiperSlide key={index}>
                <div
                  className={`relative h-full w-full ${allowLightbox ? "swiper-zoom-container" : ""}`}
                  style={{ cursor: allowLightbox ? (isZoomed ? "grab" : "zoom-in") : undefined }}
                  onDoubleClick={handleDoubleClick}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || `${productName} - Image ${index + 1}`}
                    fill
                    priority={index === 0}
                    className="object-contain p-2"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Zoom indicator */}
          {allowLightbox && (
            <div className="absolute bottom-3 end-3 z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur-sm">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                </svg>
                {isZoomed ? (
                  <span>{zoomScale}x</span>
                ) : (
                  <span className="hidden sm:inline">Scroll or double-click to zoom</span>
                )}
              </div>
            </div>
          )}

          {/* Custom navigation arrows */}
          {images.length > 1 && !isZoomed && (
            <>
              {activeIndex > 0 && (
                <button
                  onClick={() => mainSwiper?.slidePrev()}
                  aria-label="Previous image"
                  className="absolute start-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-neutral-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md"
                >
                  <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}
              {activeIndex < images.length - 1 && (
                <button
                  onClick={() => mainSwiper?.slideNext()}
                  aria-label="Next image"
                  className="absolute end-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-neutral-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md"
                >
                  <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )}
            </>
          )}

          <style jsx global>{`
            .product-gallery-thumbs {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .product-gallery-thumbs::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </div>
      </div>

      {/* Thumbnail strip with scroll arrows */}
      {images.length > 1 && (
        <div className="relative">
          {canScrollStart && (
            <button
              onClick={() => scrollThumbs("start")}
              aria-label="Scroll thumbnails left"
              className="absolute start-0 top-0 bottom-0 z-10 flex w-7 items-center justify-center bg-gradient-to-e from-white via-white/90 to-transparent"
            >
              <svg className="h-4 w-4 text-neutral-600 rtl:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          <div
            ref={thumbsRef}
            className="flex gap-2 overflow-x-auto select-none pb-1 product-gallery-thumbs"
          >
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => mainSwiper?.slideTo(index)}
                className={`relative flex-shrink-0 overflow-hidden rounded-lg transition-all duration-300 w-16 ${
                  activeIndex === index
                    ? "opacity-100 scale-95 ring-2 ring-neutral-900 ring-offset-1"
                    : "opacity-60 hover:opacity-100 hover:scale-95"
                }`}
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-neutral-100">
                  <Image
                    src={image.url}
                    alt={image.alt || `Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              </button>
            ))}
          </div>

          {canScrollEnd && (
            <button
              onClick={() => scrollThumbs("end")}
              aria-label="Scroll thumbnails right"
              className="absolute end-0 top-0 bottom-0 z-10 flex w-7 items-center justify-center bg-gradient-to-s from-white via-white/90 to-transparent"
            >
              <svg className="h-4 w-4 text-neutral-600 rtl:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
