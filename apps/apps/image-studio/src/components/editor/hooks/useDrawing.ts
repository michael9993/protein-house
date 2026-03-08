import { useState, useCallback, useEffect } from "react";
import * as fabric from "fabric";

export type BrushType = "pencil" | "spray" | "circles" | "eraser";

export function useDrawing(canvas: fabric.Canvas | null) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushType, setBrushType] = useState<BrushType>("pencil");
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushWidth, setBrushWidth] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [sprayDensity, setSprayDensity] = useState(20);

  const enterDrawingMode = useCallback((type: BrushType = "pencil") => {
    if (!canvas) return;
    canvas.isDrawingMode = true;
    setBrushType(type);
    setIsDrawing(true);
  }, [canvas]);

  const exitDrawingMode = useCallback(() => {
    if (!canvas) return;
    canvas.isDrawingMode = false;
    setIsDrawing(false);
  }, [canvas]);

  // Update brush settings whenever they change
  useEffect(() => {
    if (!canvas || !isDrawing) return;

    const r = parseInt(brushColor.slice(1, 3), 16);
    const g = parseInt(brushColor.slice(3, 5), 16);
    const b = parseInt(brushColor.slice(5, 7), 16);
    const colorWithOpacity = `rgba(${r},${g},${b},${brushOpacity})`;

    if (brushType === "eraser") {
      const brush = new fabric.PencilBrush(canvas);
      brush.color = "#ffffff";
      brush.width = brushWidth;
      canvas.freeDrawingBrush = brush;
    } else if (brushType === "spray") {
      const brush = new fabric.SprayBrush(canvas);
      brush.color = colorWithOpacity;
      brush.width = brushWidth;
      brush.density = sprayDensity;
      canvas.freeDrawingBrush = brush;
    } else if (brushType === "circles") {
      const brush = new fabric.CircleBrush(canvas);
      brush.color = colorWithOpacity;
      brush.width = brushWidth;
      canvas.freeDrawingBrush = brush;
    } else {
      const brush = new fabric.PencilBrush(canvas);
      brush.color = colorWithOpacity;
      brush.width = brushWidth;
      canvas.freeDrawingBrush = brush;
    }
  }, [canvas, isDrawing, brushType, brushColor, brushWidth, brushOpacity, sprayDensity]);

  return {
    isDrawing,
    brushType,
    brushColor,
    brushWidth,
    brushOpacity,
    sprayDensity,
    enterDrawingMode,
    exitDrawingMode,
    setBrushType,
    setBrushColor,
    setBrushWidth,
    setBrushOpacity,
    setSprayDensity,
  };
}
