import { useState, useCallback } from "react";
import * as fabric from "fabric";

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useCropTool(canvas: fabric.Canvas | null, selectedObject: fabric.FabricObject | null) {
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);

  const isImage = selectedObject?.type === "image";
  const hasClipPath = isImage && !!(selectedObject as fabric.FabricImage).clipPath;

  const startCrop = useCallback(() => {
    if (!canvas || !selectedObject || !isImage) return;

    const img = selectedObject as fabric.FabricImage;
    const bound = img.getBoundingRect();

    setCropRect({
      x: bound.left,
      y: bound.top,
      width: bound.width,
      height: bound.height,
    });
    setIsCropping(true);

    // Disable selection on other objects while cropping
    canvas.selection = false;
  }, [canvas, selectedObject, isImage]);

  const applyCrop = useCallback(() => {
    if (!canvas || !selectedObject || !cropRect || !isImage) return;

    const img = selectedObject as fabric.FabricImage;
    const scaleX = img.scaleX ?? 1;
    const scaleY = img.scaleY ?? 1;
    const imgLeft = img.left ?? 0;
    const imgTop = img.top ?? 0;

    // Convert crop rect from scene coords to image-local coords
    const localX = (cropRect.x - imgLeft) / scaleX;
    const localY = (cropRect.y - imgTop) / scaleY;
    const localW = cropRect.width / scaleX;
    const localH = cropRect.height / scaleY;

    const clipRect = new fabric.Rect({
      left: localX,
      top: localY,
      width: localW,
      height: localH,
      absolutePositioned: false,
    });

    img.clipPath = clipRect;
    img.setCoords();
    canvas.renderAll();
    canvas.fire("object:modified", { target: img });

    setIsCropping(false);
    setCropRect(null);
    canvas.selection = true;
  }, [canvas, selectedObject, cropRect, isImage]);

  const cancelCrop = useCallback(() => {
    setIsCropping(false);
    setCropRect(null);
    if (canvas) canvas.selection = true;
  }, [canvas]);

  const resetCrop = useCallback(() => {
    if (!canvas || !selectedObject || !isImage) return;

    const img = selectedObject as fabric.FabricImage;
    img.clipPath = undefined;
    img.setCoords();
    canvas.renderAll();
    canvas.fire("object:modified", { target: img });
  }, [canvas, selectedObject, isImage]);

  const updateCropRect = useCallback((update: Partial<CropRect>) => {
    setCropRect((prev) => (prev ? { ...prev, ...update } : null));
  }, []);

  return {
    isCropping,
    cropRect,
    isImage,
    hasClipPath,
    startCrop,
    applyCrop,
    cancelCrop,
    resetCrop,
    updateCropRect,
  };
}
