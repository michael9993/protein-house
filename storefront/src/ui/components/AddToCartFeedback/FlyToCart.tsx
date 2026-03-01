"use client";

import { useEffect, useRef, useState } from "react";

interface FlyToCartProps {
  /** Trigger a new animation whenever this increments */
  trigger: number;
  /** Brand primary color for the dot */
  color: string;
  /** Ref to the button element that was clicked */
  sourceRef: React.RefObject<HTMLElement | null>;
}

interface DotState {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * Renders a small colored dot that flies from the Add-to-Cart button
 * to the cart icon in the header using a CSS cubic-bezier path.
 *
 * Falls back to nothing if prefers-reduced-motion is set.
 */
export function FlyToCart({ trigger, color, sourceRef }: FlyToCartProps) {
  const [dots, setDots] = useState<DotState[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (trigger === 0) return;

    // Respect reduced motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    const source = sourceRef.current;
    const target = document.querySelector('[data-testid="CartNavItem"]');
    if (!source || !target) return;

    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const dot: DotState = {
      id: nextId.current++,
      startX: sourceRect.left + sourceRect.width / 2,
      startY: sourceRect.top + sourceRect.height / 2,
      endX: targetRect.left + targetRect.width / 2,
      endY: targetRect.top + targetRect.height / 2,
    };

    setDots((prev) => [...prev, dot]);

    // Clean up after animation completes
    const timer = setTimeout(() => {
      setDots((prev) => prev.filter((d) => d.id !== dot.id));
      // Trigger badge bounce when dot arrives
      window.dispatchEvent(new CustomEvent("cart-badge-bounce"));
    }, 600);

    return () => clearTimeout(timer);
  }, [trigger, sourceRef]);

  if (dots.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]" aria-hidden="true">
      {dots.map((dot) => (
        <FlyingDot key={dot.id} dot={dot} color={color} />
      ))}
    </div>
  );
}

function FlyingDot({ dot, color }: { dot: DotState; color: string }) {
  const dx = dot.endX - dot.startX;
  const dy = dot.endY - dot.startY;

  return (
    <div
      className="absolute"
      style={{
        left: dot.startX,
        top: dot.startY,
        // Horizontal movement uses the X wrapper
        animation: "flyX 0.6s cubic-bezier(0.2, 0, 0.8, 1) forwards",
        ["--fly-dx" as string]: `${dx}px`,
      }}
    >
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}80`,
          // Vertical movement with arc overshoot
          animation: "flyY 0.6s cubic-bezier(0.5, -0.5, 0.7, 1) forwards, flyScale 0.6s ease-in forwards",
          ["--fly-dy" as string]: `${dy}px`,
        }}
      />
      <style jsx>{`
        @keyframes flyX {
          from { transform: translateX(0); }
          to   { transform: translateX(var(--fly-dx)); }
        }
        @keyframes flyY {
          from { transform: translateY(0); }
          to   { transform: translateY(var(--fly-dy)); }
        }
        @keyframes flyScale {
          0%   { transform: scale(1); opacity: 1; }
          70%  { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
