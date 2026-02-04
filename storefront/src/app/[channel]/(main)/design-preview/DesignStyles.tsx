"use client";

export function DesignStyles() {
  return (
    <style jsx global>{`
      .aurora-layer {
        position: absolute;
        inset: -20%;
        background: radial-gradient(circle at 20% 20%, rgba(27, 91, 255, 0.25), transparent 50%),
          radial-gradient(circle at 80% 30%, rgba(255, 107, 44, 0.2), transparent 55%),
          radial-gradient(circle at 30% 80%, rgba(197, 255, 60, 0.18), transparent 55%);
        filter: blur(40px);
        opacity: 0.7;
        animation: auroraFlow 18s ease-in-out infinite;
      }

      .grid-lines {
        position: absolute;
        inset: 0;
        background-image: repeating-linear-gradient(
            90deg,
            rgba(15, 23, 42, 0.06) 0,
            rgba(15, 23, 42, 0.06) 1px,
            transparent 1px,
            transparent 120px
          ),
          repeating-linear-gradient(
            0deg,
            rgba(15, 23, 42, 0.04) 0,
            rgba(15, 23, 42, 0.04) 1px,
            transparent 1px,
            transparent 120px
          );
        opacity: 0.4;
        animation: gridDrift 25s linear infinite;
      }

      .float-orb {
        position: absolute;
        width: 240px;
        height: 240px;
        border-radius: 999px;
        filter: blur(0);
        opacity: 0.45;
        animation: orbFloat 16s ease-in-out infinite;
      }

      .orb-1 {
        top: 10%;
        left: -60px;
        background: radial-gradient(circle, rgba(27, 91, 255, 0.35), transparent 65%);
      }

      .orb-2 {
        bottom: 15%;
        right: -40px;
        width: 320px;
        height: 320px;
        background: radial-gradient(circle, rgba(255, 107, 44, 0.3), transparent 65%);
        animation-delay: -4s;
      }

      .orb-3 {
        top: 55%;
        left: 60%;
        width: 180px;
        height: 180px;
        background: radial-gradient(circle, rgba(197, 255, 60, 0.25), transparent 70%);
        animation-delay: -8s;
      }

      .hero-aurora {
        background: linear-gradient(135deg, rgba(27, 91, 255, 0.12) 0%, rgba(108, 124, 255, 0.1) 45%, rgba(255, 107, 44, 0.12) 100%);
        opacity: 0.9;
      }

      .hero-lines {
        background-image: repeating-linear-gradient(
          -25deg,
          rgba(15, 23, 42, 0.04) 0,
          rgba(15, 23, 42, 0.04) 2px,
          transparent 2px,
          transparent 14px
        );
        opacity: 0.4;
      }

      .hero-card-glow {
        background: radial-gradient(circle at 20% 20%, rgba(27, 91, 255, 0.2), transparent 55%),
          radial-gradient(circle at 80% 20%, rgba(255, 107, 44, 0.18), transparent 50%);
        opacity: 0.8;
      }

      .section-aurora {
        background: radial-gradient(circle at 20% 0%, rgba(27, 91, 255, 0.12), transparent 50%),
          radial-gradient(circle at 80% 100%, rgba(255, 107, 44, 0.1), transparent 55%);
        opacity: 0.7;
      }

      .mosaic-aurora {
        background: radial-gradient(circle at 15% 20%, rgba(27, 91, 255, 0.14), transparent 50%),
          radial-gradient(circle at 90% 80%, rgba(197, 255, 60, 0.14), transparent 55%);
        opacity: 0.6;
      }

      .promo-sheen {
        background: linear-gradient(120deg, rgba(255, 255, 255, 0.1), transparent 60%);
        animation: sheen 8s ease-in-out infinite;
      }

      .marquee {
        overflow: hidden;
        position: relative;
      }

      .marquee-track {
        display: inline-flex;
        gap: 16px;
        animation: marquee 20s linear infinite;
        white-space: nowrap;
      }

      @keyframes auroraFlow {
        0% {
          transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
          transform: translate3d(-4%, 3%, 0) scale(1.05);
        }
        100% {
          transform: translate3d(0, 0, 0) scale(1);
        }
      }

      @keyframes gridDrift {
        0% {
          transform: translate3d(0, 0, 0);
        }
        100% {
          transform: translate3d(120px, 120px, 0);
        }
      }

      @keyframes orbFloat {
        0%,
        100% {
          transform: translate3d(0, 0, 0);
        }
        50% {
          transform: translate3d(20px, -20px, 0);
        }
      }

      @keyframes marquee {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(-50%);
        }
      }

      @keyframes sheen {
        0%,
        100% {
          opacity: 0.2;
        }
        50% {
          opacity: 0.6;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .aurora-layer,
        .grid-lines,
        .float-orb,
        .promo-sheen,
        .marquee-track {
          animation: none;
        }
      }
    `}</style>
  );
}
