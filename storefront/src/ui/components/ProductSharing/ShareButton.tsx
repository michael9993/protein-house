"use client";

import { useState, useCallback } from "react";

/** Share icon SVG — "box with arrow" style, universally recognized */
function ShareIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

interface ShareButtonProps {
  productName: string;
  /** Full product URL (used on PDP where window.location.href is available) */
  productUrl?: string;
  /** Product slug — ShareButton constructs the URL from current window location + slug */
  productSlug?: string;
  productImage?: string | null;
  className?: string;
  /** "default" = text button with icon, "icon" = icon-only button (for PDP action row & product cards) */
  variant?: "default" | "icon";
  /** Icon size class for the SVG (e.g. "h-4 w-4", "h-5 w-5") */
  iconClassName?: string;
}

/** Build product URL from slug using current window location */
function buildProductUrl(slug: string): string {
  if (typeof window === "undefined") return "";
  const parts = window.location.pathname.split("/").filter(Boolean);
  const channel = parts[0] || "";
  return `${window.location.origin}/${channel}/products/${slug}`;
}

export function ShareButton({
  productName,
  productUrl,
  productSlug,
  productImage,
  className = "",
  variant = "default",
  iconClassName,
}: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const resolvedUrl = productUrl || (productSlug ? buildProductUrl(productSlug) : "");

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = productUrl || (productSlug ? buildProductUrl(productSlug) : "");
    const shareData = {
      title: productName,
      text: `Check out ${productName}`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      setShowModal(true);
    }
  }, [productName, productUrl, productSlug]);

  const handleSocialShare = useCallback((platform: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = resolvedUrl;
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(productName);
    const encodedText = encodeURIComponent(`Check out ${productName}`);

    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        break;
      case "pinterest":
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}${productImage ? `&media=${encodeURIComponent(productImage)}` : ""}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encodedUrl}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
    setShowModal(false);
  }, [resolvedUrl, productName, productImage]);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(resolvedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [resolvedUrl]);

  const handleCloseModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(false);
  }, []);

  // Icon-only variant — renders a compact icon button
  const triggerButton = variant === "icon" ? (
    <button
      type="button"
      onClick={handleShare}
      className={className}
      aria-label="Share product"
    >
      <ShareIcon className={iconClassName || "h-4 w-4"} />
    </button>
  ) : (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 ${className}`}
      aria-label="Share product"
    >
      <ShareIcon className="h-4 w-4" />
      Share
    </button>
  );

  return (
    <>
      {triggerButton}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Share Product</h3>
              <button
                onClick={handleCloseModal}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={(e) => handleSocialShare("facebook", e)}
                className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 text-left hover:bg-neutral-50"
              >
                <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="font-medium text-neutral-900">Facebook</span>
              </button>

              <button
                onClick={(e) => handleSocialShare("twitter", e)}
                className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 text-left hover:bg-neutral-50"
              >
                <svg className="h-6 w-6 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                <span className="font-medium text-neutral-900">Twitter</span>
              </button>

              <button
                onClick={(e) => handleSocialShare("pinterest", e)}
                className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 text-left hover:bg-neutral-50"
              >
                <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
                </svg>
                <span className="font-medium text-neutral-900">Pinterest</span>
              </button>

              <button
                onClick={(e) => handleSocialShare("whatsapp", e)}
                className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 text-left hover:bg-neutral-50"
              >
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span className="font-medium text-neutral-900">WhatsApp</span>
              </button>

              <button
                onClick={(e) => handleSocialShare("email", e)}
                className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 text-left hover:bg-neutral-50"
              >
                <svg className="h-6 w-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="font-medium text-neutral-900">Email</span>
              </button>
            </div>

            {/* Copy Link */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={resolvedUrl}
                readOnly
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={handleCopy}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
