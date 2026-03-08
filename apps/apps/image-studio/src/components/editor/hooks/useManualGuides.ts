import { useState, useCallback, useEffect, useRef } from "react";
import type { Canvas } from "fabric";

export interface ManualGuide {
  id: string;
  axis: "h" | "v";
  position: number; // canvas-space coordinate
}

const MANUAL_GUIDE_COLOR = "#3B82F6"; // blue-500
const MANUAL_GUIDE_DASH = [6, 4];

export function useManualGuides(canvas: Canvas | null, docWidth?: number, docHeight?: number) {
  const [guides, setGuides] = useState<ManualGuide[]>([]);
  const guidesRef = useRef<ManualGuide[]>([]);
  const draggingRef = useRef<{ id: string; axis: "h" | "v" } | null>(null);

  // Keep ref in sync for render callback
  useEffect(() => {
    guidesRef.current = guides;
  }, [guides]);

  const addGuide = useCallback((axis: "h" | "v", position: number) => {
    const id = `guide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setGuides((prev) => [...prev, { id, axis, position }]);
    canvas?.requestRenderAll();
  }, [canvas]);

  const removeGuide = useCallback((id: string) => {
    setGuides((prev) => prev.filter((g) => g.id !== id));
    canvas?.requestRenderAll();
  }, [canvas]);

  const updateGuide = useCallback((id: string, position: number) => {
    setGuides((prev) => prev.map((g) => (g.id === id ? { ...g, position } : g)));
  }, []);

  const clearGuides = useCallback(() => {
    setGuides([]);
    canvas?.requestRenderAll();
  }, [canvas]);

  // Render manual guides on canvas
  useEffect(() => {
    if (!canvas) return;

    function renderManualGuides(opt: any) {
      const ctx = opt.ctx as CanvasRenderingContext2D;
      if (!ctx || !canvas || guidesRef.current.length === 0) return;

      const vt = canvas.viewportTransform;
      const zoom = vt ? vt[0] : 1;
      const panX = vt ? vt[4] : 0;
      const panY = vt ? vt[5] : 0;
      const toScreenX = (cx: number) => cx * zoom + panX;
      const toScreenY = (cy: number) => cy * zoom + panY;

      const dW = docWidth ?? canvas.getWidth();
      const dH = docHeight ?? canvas.getHeight();

      ctx.save();
      ctx.strokeStyle = MANUAL_GUIDE_COLOR;
      ctx.lineWidth = 1;
      ctx.setLineDash(MANUAL_GUIDE_DASH);

      for (const guide of guidesRef.current) {
        ctx.beginPath();
        if (guide.axis === "v") {
          const sx = toScreenX(guide.position);
          ctx.moveTo(sx, toScreenY(0));
          ctx.lineTo(sx, toScreenY(dH));
        } else {
          const sy = toScreenY(guide.position);
          ctx.moveTo(toScreenX(0), sy);
          ctx.lineTo(toScreenX(dW), sy);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    canvas.on("after:render", renderManualGuides);
    return () => {
      canvas.off("after:render", renderManualGuides);
    };
  }, [canvas, docWidth, docHeight]);

  // Double-click on canvas edge to add guide
  useEffect(() => {
    if (!canvas) return;

    const canvasEl = canvas.getSelectionElement();
    if (!canvasEl) return;

    function handleDblClick(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvasEl.getBoundingClientRect();
      const vt = canvas.viewportTransform;
      const zoom = vt ? vt[0] : 1;
      const panX = vt ? vt[4] : 0;
      const panY = vt ? vt[5] : 0;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Convert screen coords to canvas/scene coords
      const canvasX = (mouseX - panX) / zoom;
      const canvasY = (mouseY - panY) / zoom;

      const EDGE_MARGIN = 20; // pixels from edge of canvas element

      if (mouseY < EDGE_MARGIN) {
        // Top edge → add vertical guide at canvasX
        addGuide("v", Math.round(canvasX));
      } else if (mouseX < EDGE_MARGIN) {
        // Left edge → add horizontal guide at canvasY
        addGuide("h", Math.round(canvasY));
      }
    }

    canvasEl.addEventListener("dblclick", handleDblClick);
    return () => {
      canvasEl.removeEventListener("dblclick", handleDblClick);
    };
  }, [canvas, addGuide]);

  // Provide snap targets for integration with smart guides
  const verticalSnapTargets = guides.filter((g) => g.axis === "v").map((g) => g.position);
  const horizontalSnapTargets = guides.filter((g) => g.axis === "h").map((g) => g.position);

  return {
    guides,
    addGuide,
    removeGuide,
    updateGuide,
    clearGuides,
    verticalSnapTargets,
    horizontalSnapTargets,
  };
}
