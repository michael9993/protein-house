"use client";

import { useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs, Zoom, EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

// Swiper CSS
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/zoom";
import "swiper/css/effect-fade";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

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
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
    <>
      <div className="flex flex-col gap-4 group relative">
        {/* Discount Ribbon */}
        {(discountPercent || 0) > 0 && (
            <div className="absolute -left-2 top-4 z-20 sm:-left-3 sm:top-6 pointer-events-none">
                <div 
                className="relative flex items-center px-3 py-1.5 text-xs font-bold text-white shadow-lg sm:px-4 sm:py-2 sm:text-sm"
                style={{ backgroundColor: "#ef4444" }}
                >
                <span>{discountPercent}% OFF</span>
                <div 
                    className="absolute -right-2 top-0 h-full w-2"
                    style={{
                    background: "linear-gradient(135deg, #ef4444 50%, transparent 50%)",
                    }}
                />
                <div 
                    className="absolute -left-1 -bottom-1 h-2 w-2"
                    style={{
                    background: "#b91c1c",
                    clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                    }}
                />
                </div>
            </div>
        )}

        {/* Main Swiper */}
        <div className="relative w-full aspect-[4/3] md:aspect-square overflow-hidden rounded-2xl bg-neutral-100">
          <Swiper
            spaceBetween={10}
            navigation={true}
            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
            modules={[FreeMode, Navigation, Thumbs, Zoom, EffectFade]}
            className="h-full w-full"
            loop={true}
            zoom={allowLightbox}
            onSlideChange={(swiper) => setLightboxIndex(swiper.realIndex)}
          >
            {images.map((image, index) => (
              <SwiperSlide key={index}>
                <div 
                  className={`relative h-full w-full ${allowLightbox ? "cursor-zoom-in swiper-zoom-container" : ""}`}
                  onClick={() => {
                    if (allowLightbox) {
                        setLightboxIndex(index);
                        setIsLightboxOpen(true);
                    }
                  }}
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

          {/* Custom Navigation Overlay Styles - Minimal & Smaller */}
          <style jsx global>{`
            .swiper-button-next, .swiper-button-prev {
              color: var(--store-neutral-900, #171717);
              background: transparent;
              width: 32px;
              height: 32px;
              border-radius: 0;
              backdrop-filter: none;
              box-shadow: none;
              margin-top: -16px; /* Center adjustment */
            }
            .swiper-button-next:hover, .swiper-button-prev:hover {
              background: transparent;
              transform: scale(1.1);
            }
            .swiper-button-next:after, .swiper-button-prev:after {
              font-size: 16px;
              font-weight: 600; 
            }
          `}</style>
        </div>

        {/* Thumbnail Swiper */}
        {images.length > 1 && (
          <div className="w-full mt-4 select-none min-h-[80px]">
            <Swiper
              onSwiper={setThumbsSwiper}
              spaceBetween={12}
              slidesPerView={4}
              freeMode={true}
              watchSlidesProgress={true}
              modules={[FreeMode, Navigation, Thumbs]}
              className="mySwiper"
              breakpoints={{
                640: { slidesPerView: 5 },
                768: { slidesPerView: 5 },
                1024: { slidesPerView: 6 },
              }}
            >
              {images.map((image, index) => (
                <SwiperSlide key={index}>
                  <button
                     className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-300 w-full opacity-60 hover:opacity-100 hover:scale-95 ui-selected:opacity-100 ui-selected:ring-2 ring-offset-1`}
                  >
                     <div className="relative h-20 w-full rounded-lg overflow-hidden bg-neutral-100">
                        <Image
                          src={image.url}
                          alt={image.alt || `Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                     </div>
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
            
            {/* Active Thumb Style Logic */}
            <style jsx global>{`
              .swiper-slide-thumb-active button {
                opacity: 1;
                transform: scale(0.95);
                box-shadow: 0 0 0 2px var(--test-primary, #000);
              }
              .swiper-slide {
                height: auto;
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox - High Z-Index to beat QuickView (9999) */}
      <Transition show={isLightboxOpen} as={Fragment}>
        <Dialog 
          as="div" 
          className="relative z-[10000]" 
          onClose={(e) => {
             // Optional: check if we should close or if it's interfering
             setIsLightboxOpen(false)
          }}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/95 backdrop-blur-sm" />
          </Transition.Child>

          <div 
            className="fixed inset-0 overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div className="flex h-full w-full items-center justify-center p-4">
              
              {/* Close Button */}
              <button
                onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
                className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-2 text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Lightbox Swiper */}
               <div className="h-full w-full max-w-7xl mx-auto flex items-center justify-center">
                 <Swiper
                    initialSlide={lightboxIndex}
                    spaceBetween={30}
                    navigation={true}
                    modules={[Navigation, Zoom]}
                    zoom={true}
                    className="h-full w-full"
                 >
                    {images.map((image, index) => (
                      <SwiperSlide key={index}>
                        <div className="swiper-zoom-container h-full w-full flex items-center justify-center">
                          <div className="relative h-full w-full max-h-[85vh]">
                            <Image
                              src={image.url}
                              alt={image.alt || productName}
                              fill
                              className="object-contain"
                              sizes="100vw"
                              priority
                            />
                          </div>
                        </div>
                      </SwiperSlide>
                    ))}
                 </Swiper>
               </div>

            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
