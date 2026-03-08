import { useEffect, useRef, useCallback, useState } from "react";
import type { Canvas, FabricObject } from "fabric";

const SNAP_THRESHOLD = 5; // canvas-space pixels
const GUIDE_COLOR = "#F43F5E";
const GUIDE_DASH = [4, 4];
const GRID_COLOR = "#e5e7eb";

interface GuideLine {
  orientation: "horizontal" | "vertical";
  position: number; // canvas-space coordinate
}

/**
 * Get the axis-aligned bounding box of an object in canvas/scene coordinate space.
 * In Fabric.js v6, getBoundingRect() already returns scene-plane coordinates
 * (NOT viewport-space), so no viewport transform correction is needed.
 */
function getCanvasSpaceBounds(obj: FabricObject) {
  const rect = obj.getBoundingRect();
  return {
    left: rect.left,
    centerX: rect.left + rect.width / 2,
    right: rect.left + rect.width,
    top: rect.top,
    centerY: rect.top + rect.height / 2,
    bottom: rect.top + rect.height,
  };
}

export function useSmartGuides(canvas: Canvas | null, enabled: boolean, docWidth?: number, docHeight?: number) {
  const guidesRef = useRef<GuideLine[]>([]);
  const [gridVisible, setGridVisible] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [snapEnabled, setSnapEnabled] = useState(true);

  useEffect(() => {
    if (!canvas || !enabled) return;

    function handleMoving(e: any) {
      if (!snapEnabled || !canvas) return;
      const target = e.target as FabricObject;
      if (!target) return;

      const guides: GuideLine[] = [];

      // Ensure target coords are fresh, then get canvas-space bounds
      target.setCoords();
      const targetPts = getCanvasSpaceBounds(target);

      // Document edge + center snap targets (canvas space, using document dims)
      const dW = docWidth ?? canvas.getWidth();
      const dH = docHeight ?? canvas.getHeight();
      const verticalSnaps = [0, dW / 2, dW];
      const horizontalSnaps = [0, dH / 2, dH];

      // Other objects' snap points (canvas space), skip page background
      canvas.getObjects().forEach((obj) => {
        if (obj === target || !obj.visible || (obj as any).__pageBg) return;
        const pts = getCanvasSpaceBounds(obj);
        verticalSnaps.push(pts.left, pts.centerX, pts.right);
        horizontalSnaps.push(pts.top, pts.centerY, pts.bottom);
      });

      // Grid snap targets (relative to document area)
      if (gridVisible) {
        for (let x = 0; x <= dW; x += gridSize) verticalSnaps.push(x);
        for (let y = 0; y <= dH; y += gridSize) horizontalSnaps.push(y);
      }

      // Find closest vertical snap (X axis)
      let dx = 0;
      const targetXPoints = [targetPts.left, targetPts.centerX, targetPts.right];
      for (const tx of targetXPoints) {
        for (const sx of verticalSnaps) {
          if (Math.abs(tx - sx) < SNAP_THRESHOLD) {
            dx = sx - tx;
            guides.push({ orientation: "vertical", position: sx });
            break;
          }
        }
        if (dx !== 0) break;
      }

      // Find closest horizontal snap (Y axis)
      let dy = 0;
      const targetYPoints = [targetPts.top, targetPts.centerY, targetPts.bottom];
      for (const ty of targetYPoints) {
        for (const sy of horizontalSnaps) {
          if (Math.abs(ty - sy) < SNAP_THRESHOLD) {
            dy = sy - ty;
            guides.push({ orientation: "horizontal", position: sy });
            break;
          }
        }
        if (dy !== 0) break;
      }

      // Apply snap delta in canvas space
      if (dx !== 0 || dy !== 0) {
        target.set({
          left: (target.left ?? 0) + dx,
          top: (target.top ?? 0) + dy,
        });
        target.setCoords();
      }

      guidesRef.current = guides;
      canvas.requestRenderAll();
    }

    function handleModified() {
      guidesRef.current = [];
      canvas!.requestRenderAll();
    }

    function renderGuides(opt: any) {
      const ctx = opt.ctx as CanvasRenderingContext2D;
      if (!ctx || !canvas) return;

      // after:render fires with default context state (no viewport transform),
      // so convert canvas coords → screen coords for drawing.
      const vt = canvas.viewportTransform;
      const zoom = vt ? vt[0] : 1;
      const panX = vt ? vt[4] : 0;
      const panY = vt ? vt[5] : 0;
      const toScreenX = (cx: number) => cx * zoom + panX;
      const toScreenY = (cy: number) => cy * zoom + panY;

      // Use document dimensions for grid/guide extent
      const dW = docWidth ?? canvas.getWidth();
      const dH = docHeight ?? canvas.getHeight();

      // Draw grid (within document area)
      if (gridVisible) {
        ctx.save();
        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= dW; x += gridSize) {
          const sx = toScreenX(x);
          ctx.beginPath();
          ctx.moveTo(sx, toScreenY(0));
          ctx.lineTo(sx, toScreenY(dH));
          ctx.stroke();
        }
        for (let y = 0; y <= dH; y += gridSize) {
          const sy = toScreenY(y);
          ctx.beginPath();
          ctx.moveTo(toScreenX(0), sy);
          ctx.lineTo(toScreenX(dW), sy);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw snap guide lines (within document area)
      if (guidesRef.current.length === 0) return;
      ctx.save();
      ctx.strokeStyle = GUIDE_COLOR;
      ctx.lineWidth = 1;
      ctx.setLineDash(GUIDE_DASH);

      for (const guide of guidesRef.current) {
        ctx.beginPath();
        if (guide.orientation === "vertical") {
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

    canvas.on("object:moving", handleMoving);
    canvas.on("object:modified", handleModified);
    canvas.on("after:render", renderGuides);

    return () => {
      canvas.off("object:moving", handleMoving);
      canvas.off("object:modified", handleModified);
      canvas.off("after:render", renderGuides);
      guidesRef.current = [];
    };
  }, [canvas, enabled, snapEnabled, gridVisible, gridSize, docWidth, docHeight]);

  const toggleGrid = useCallback(() => {
    setGridVisible((v) => !v);
    canvas?.requestRenderAll();
  }, [canvas]);

  const toggleSnap = useCallback(() => {
    setSnapEnabled((v) => !v);
  }, []);

  return {
    gridVisible,
    setGridVisible,
    gridSize,
    setGridSize,
    snapEnabled,
    toggleSnap,
    toggleGrid,
  };
}
