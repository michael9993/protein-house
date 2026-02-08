"use client";

/**
 * DesignStyles - Premium Athletic Product Card Design System
 *
 * Aesthetic Direction: Bold Performance Sports
 * - High contrast, dramatic shadows
 * - Dynamic motion that feels "fast" and "energetic"
 * - Premium materials: glass, gradients, depth
 * - Athletic typography: condensed, bold, uppercase
 *
 * Card-only styles - page layout uses original design
 */
export function DesignStyles() {
  return (
    <style jsx global>{`
      :root {
        /* V7 Core Colors - Inherit from store theme */
        --v7-primary: var(--store-primary);
        --v7-secondary: var(--store-secondary);
        --v7-accent: var(--store-accent);
        --v7-bg: var(--store-bg);
        --v7-surface: var(--store-surface);
        --v7-ink: var(--store-text);
        --v7-muted: var(--store-text-muted);

        /* Premium Athletic Additions */
        --v7-black: #0a0a0a;
        --v7-white: #fafafa;
        --v7-glass: rgba(255, 255, 255, 0.92);
        --v7-glass-dark: rgba(10, 10, 10, 0.85);

        /* Motion - Athletic/Fast Feel */
        --v7-ease-athletic: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        --v7-ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
        --v7-ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
        --v7-ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
        --v7-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

        /* Shadows - Dramatic Depth */
        --v7-shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06);
        --v7-shadow-hover: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 12px 24px -8px rgba(0, 0, 0, 0.15);
        --v7-shadow-lifted: 0 20px 40px -15px rgba(0, 0, 0, 0.3);
        --v7-shadow-intense: 0 35px 60px -15px rgba(0, 0, 0, 0.35);
      }

      /* ============================
         CARD SYSTEM - BOLD LIFT
         ============================ */

      .v7-card {
        position: relative;
        transform: translateY(0) scale(1);
        transition:
          transform 0.45s var(--v7-ease-out-expo),
          box-shadow 0.45s var(--v7-ease-smooth);
        will-change: transform, box-shadow;
        cursor: pointer;
      }

      .v7-card:hover {
        transform: translateY(-16px) scale(1.02);
        box-shadow: var(--v7-shadow-intense);
        z-index: 10;
      }

      /* Image Treatment - Dynamic Zoom + Float */
      .v7-card-image {
        transition: transform 0.55s var(--v7-ease-out-expo);
        will-change: transform;
      }

      .v7-card:hover .v7-card-image {
        transform: scale(1.12) translateY(-10px);
      }

      /* ============================
         ACTION BAR SYSTEM
         ============================ */

      /* Quick Action Bar - Dramatic slide up */
      .v7-action-bar {
        transform: translateY(100%);
        opacity: 0;
        transition:
          transform 0.4s var(--v7-ease-out-expo),
          opacity 0.3s ease;
      }

      .v7-card:hover .v7-action-bar {
        transform: translateY(0);
        opacity: 1;
      }

      /* Individual action buttons stagger */
      .v7-action-bar > *:nth-child(1) { transition-delay: 0ms; }
      .v7-action-bar > *:nth-child(2) { transition-delay: 50ms; }
      .v7-action-bar > *:nth-child(3) { transition-delay: 100ms; }

      /* Action Buttons - Bouncy with scale */
      .v7-action-btn {
        transform: scale(1);
        transition:
          transform 0.2s var(--v7-ease-bounce),
          background-color 0.2s ease,
          box-shadow 0.2s ease;
        cursor: pointer;
      }

      .v7-action-btn:hover {
        transform: scale(1.15);
      }

      .v7-action-btn:active {
        transform: scale(0.92);
      }

      /* ============================
         BADGE SYSTEM - PREMIUM
         ============================ */

      /* Sale Badge - Pulsing attention grabber */
      .v7-badge-sale {
        animation: v7-pulse-sale 2s ease-in-out infinite;
      }

      @keyframes v7-pulse-sale {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
        }
        50% {
          transform: scale(1.03);
          box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
        }
      }

      /* New Badge - Subtle glow */
      .v7-badge-new {
        animation: v7-glow-new 2.5s ease-in-out infinite;
      }

      @keyframes v7-glow-new {
        0%, 100% {
          box-shadow: 0 0 12px 2px rgba(34, 197, 94, 0.3);
        }
        50% {
          box-shadow: 0 0 20px 4px rgba(34, 197, 94, 0.5);
        }
      }

      /* ============================
         OVERLAY EFFECTS
         ============================ */

      /* Gradient overlay on hover */
      .v7-overlay-gradient {
        opacity: 0;
        transition: opacity 0.4s var(--v7-ease-smooth);
      }

      .v7-card:hover .v7-overlay-gradient {
        opacity: 1;
      }

      /* Glass panel effect */
      .v7-glass {
        background: var(--v7-glass);
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
      }

      .v7-glass-dark {
        background: var(--v7-glass-dark);
        backdrop-filter: blur(20px) saturate(150%);
        -webkit-backdrop-filter: blur(20px) saturate(150%);
      }

      /* ============================
         GRID ANIMATIONS
         ============================ */

      /* Staggered entrance - Athletic feel */
      .v7-grid-enter > * {
        opacity: 0;
        transform: translateY(50px) scale(0.94);
        animation: v7-slide-up 0.65s var(--v7-ease-out-expo) forwards;
      }

      @keyframes v7-slide-up {
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* Stagger delays - 12 items */
      .v7-grid-enter > *:nth-child(1) { animation-delay: 0ms; }
      .v7-grid-enter > *:nth-child(2) { animation-delay: 70ms; }
      .v7-grid-enter > *:nth-child(3) { animation-delay: 140ms; }
      .v7-grid-enter > *:nth-child(4) { animation-delay: 210ms; }
      .v7-grid-enter > *:nth-child(5) { animation-delay: 280ms; }
      .v7-grid-enter > *:nth-child(6) { animation-delay: 350ms; }
      .v7-grid-enter > *:nth-child(7) { animation-delay: 420ms; }
      .v7-grid-enter > *:nth-child(8) { animation-delay: 490ms; }
      .v7-grid-enter > *:nth-child(n+9) { animation-delay: 560ms; }

      /* ============================
         SHIMMER / LOADING
         ============================ */

      .v7-shimmer {
        background: linear-gradient(
          90deg,
          #f5f5f5 25%,
          #ebebeb 50%,
          #f5f5f5 75%
        );
        background-size: 400% 100%;
        animation: v7-shimmer 1.6s ease infinite;
      }

      @keyframes v7-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* ============================
         WISHLIST HEART - EMOTIONAL
         ============================ */

      .v7-heart {
        transition: transform 0.3s var(--v7-ease-bounce), color 0.2s ease;
        cursor: pointer;
      }

      .v7-heart:hover {
        transform: scale(1.25);
      }

      .v7-heart-filled {
        animation: v7-heart-pop 0.5s var(--v7-ease-bounce);
      }

      @keyframes v7-heart-pop {
        0% { transform: scale(1); }
        30% { transform: scale(1.4); }
        60% { transform: scale(0.9); }
        100% { transform: scale(1); }
      }

      /* ============================
         TEXT EFFECTS
         ============================ */

      /* Product name hover underline - Athletic style */
      .v7-name-underline {
        position: relative;
        display: inline;
        background: linear-gradient(var(--v7-primary), var(--v7-primary)) no-repeat;
        background-size: 0% 3px;
        background-position: left bottom;
        transition: background-size 0.35s var(--v7-ease-out-expo);
      }

      .v7-card:hover .v7-name-underline {
        background-size: 100% 3px;
      }

      /* ============================
         PRICE TAG - PREMIUM
         ============================ */

      .v7-price {
        position: relative;
        display: inline-block;
      }

      .v7-price-highlight {
        position: absolute;
        bottom: 0;
        left: -6px;
        right: -6px;
        height: 45%;
        background: var(--v7-primary);
        opacity: 0.15;
        border-radius: 3px;
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.35s var(--v7-ease-out-expo);
      }

      .v7-card:hover .v7-price-highlight {
        transform: scaleX(1);
      }

      /* ============================
         QUICK VIEW BUTTON - DRAMATIC
         ============================ */

      .v7-quick-view-btn {
        transform: scale(0.8);
        opacity: 0;
        transition:
          transform 0.35s var(--v7-ease-bounce),
          opacity 0.25s ease;
      }

      .v7-card:hover .v7-quick-view-btn {
        transform: scale(1);
        opacity: 1;
      }

      /* ============================
         BRAND BADGE - FLOATING
         ============================ */

      .v7-brand-badge {
        transform: translateX(-8px);
        opacity: 0;
        transition:
          transform 0.4s var(--v7-ease-out-expo),
          opacity 0.3s ease;
      }

      .v7-card:hover .v7-brand-badge {
        transform: translateX(0);
        opacity: 1;
      }

      /* ============================
         CATEGORY LABEL
         ============================ */

      .v7-category {
        letter-spacing: 0.15em;
        text-transform: uppercase;
        font-weight: 700;
        font-size: 10px;
      }

      /* ============================
         FEATURED CARD
         ============================ */

      @media (min-width: 768px) {
        .v7-card-featured {
          grid-column: span 2;
        }

        .v7-card-featured .v7-card-image-container {
          min-height: 480px;
        }
      }

      /* ============================
         MOBILE OPTIMIZATIONS
         ============================ */

      /* On mobile/touch devices, reduce hover effects */
      @media (max-width: 640px) {
        .v7-card:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: var(--v7-shadow-hover);
        }

        .v7-card:hover .v7-card-image {
          transform: scale(1.05);
        }

        /* Hide overlay and action bar on mobile (use always-visible button instead) */
        .v7-card:hover .v7-overlay-gradient {
          opacity: 0;
        }

        .v7-card:hover .v7-action-bar {
          opacity: 0;
          transform: translateY(100%);
        }

        /* Faster grid entrance on mobile */
        .v7-grid-enter > * {
          animation-duration: 0.45s;
        }

        /* Reduced stagger on mobile */
        .v7-grid-enter > *:nth-child(1) { animation-delay: 0ms; }
        .v7-grid-enter > *:nth-child(2) { animation-delay: 40ms; }
        .v7-grid-enter > *:nth-child(3) { animation-delay: 80ms; }
        .v7-grid-enter > *:nth-child(4) { animation-delay: 120ms; }
        .v7-grid-enter > *:nth-child(n+5) { animation-delay: 160ms; }
      }

      /* ============================
         TOUCH DEVICE OPTIMIZATIONS
         ============================ */

      @media (hover: none) and (pointer: coarse) {
        /* Touch devices: show quick view button always */
        .v7-quick-view-btn {
          opacity: 1 !important;
          transform: scale(1) !important;
        }

        /* Disable hover transforms on touch devices */
        .v7-card:hover {
          transform: none;
        }

        .v7-card:hover .v7-card-image {
          transform: none;
        }

        /* Touch feedback on cards */
        .v7-card:active {
          transform: scale(0.98);
          transition: transform 0.1s ease;
        }

        /* Touch feedback on buttons */
        .v7-action-btn:active,
        .v7-heart:active {
          transform: scale(0.9) !important;
        }
      }

      /* ============================
         REDUCED MOTION
         ============================ */

      @media (prefers-reduced-motion: reduce) {
        .v7-card,
        .v7-card-image,
        .v7-action-bar,
        .v7-action-btn,
        .v7-badge-sale,
        .v7-badge-new,
        .v7-heart,
        .v7-grid-enter > *,
        .v7-shimmer,
        .v7-quick-view-btn,
        .v7-brand-badge,
        .v7-name-underline,
        .v7-price-highlight {
          animation: none !important;
          transition: none !important;
        }

        .v7-card:hover {
          transform: translateY(-4px);
        }

        .v7-card:hover .v7-action-bar,
        .v7-card:hover .v7-quick-view-btn,
        .v7-card:hover .v7-brand-badge {
          opacity: 1;
          transform: none;
        }

        .v7-grid-enter > * {
          opacity: 1;
          transform: none;
        }
      }
    `}</style>
  );
}
