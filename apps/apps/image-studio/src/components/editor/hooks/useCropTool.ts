import { useState, useCallback, useRef } from "react";
import * as fabric from "fabric";

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useCropTool(
  canvas: fabric.Canvas | null,
  selectedObject: fabric.FabricObject | null,
) {
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const cropTargetRef = useRef<fabric.FabricImage | null>(null);

  const isImage = selectedObject?.type === "image";
  const hasCrop = isImage && (
    !!(selectedObject as fabric.FabricImage).clipPath ||
    ((selectedObject as fabric.FabricImage).cropX ?? 0) > 0 ||
    ((selectedObject as fabric.FabricImage).cropY ?? 0) > 0
  );

  const startCrop = useCallback(() => {
    if (!canvas || !selectedObject || !isImage) return;

    const img = selectedObject as fabric.FabricImage;
    cropTargetRef.current = img;

    const bound = img.getBoundingRect();
    setCropRect({
      x: bound.left,
      y: bound.top,
      width: bound.width,
      height: bound.height,
    });
    setIsCropping(true);

    canvas.selection = false;
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [canvas, selectedObject, isImage]);

  const applyCrop = useCallback(() => {
    const img = cropTargetRef.current;
    if (!canvas || !img || !cropRect) return;

    const scaleX = img.scaleX ?? 1;
    const scaleY = img.scaleY ?? 1;
    const imgLeft = img.left ?? 0;
    const imgTop = img.top ?? 0;

    // Convert scene-space crop rect to source image pixel coords
    const srcCropX = (cropRect.x - imgLeft) / scaleX;
    const srcCropY = (cropRect.y - imgTop) / scaleY;
    const srcCropW = cropRect.width / scaleX;
    const srcCropH = cropRect.height / scaleY;

    // Stack with any existing crop offset
    const existingCropX = img.cropX ?? 0;
    const existingCropY = img.cropY ?? 0;

    // Apply native Fabric.js crop (changes actual image dimensions)
    img.cropX = existingCropX + srcCropX;
    img.cropY = existingCropY + srcCropY;
    img.width = srcCropW;
    img.height = srcCropH;

    // Reposition so cropped area stays where the crop rect was
    img.left = cropRect.x;
    img.top = cropRect.y;

    // Remove any clipPath from previous crops
    img.clipPath = undefined;

    img.dirty = true;
    img.setCoords();
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
    canvas.fire("object:modified", { target: img });

    setIsCropping(false);
    setCropRect(null);
    cropTargetRef.current = null;
    canvas.selection = true;
  }, [canvas, cropRect]);

  const cancelCrop = useCallback(() => {
    const img = cropTargetRef.current;
    setIsCropping(false);
    setCropRect(null);
    cropTargetRef.current = null;
    if (canvas) {
      canvas.selection = true;
      if (img) {
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
      }
    }
  }, [canvas]);

  const resetCrop = useCallback(() => {
    if (!canvas || !selectedObject || !isImage) return;

    const img = selectedObject as fabric.FabricImage;
    const el = img.getElement() as HTMLImageElement;

    // Reset to full original image
    img.cropX = 0;
    img.cropY = 0;
    img.width = el.naturalWidth;
    img.height = el.naturalHeight;
    img.clipPath = undefined;

    img.dirty = true;
    img.setCoords();
    canvas.requestRenderAll();
    canvas.fire("object:modified", { target: img });
  }, [canvas, selectedObject, isImage]);

  const updateCropRect = useCallback((update: Partial<CropRect>) => {
    setCropRect((prev) => (prev ? { ...prev, ...update } : null));
  }, []);

  return {
    isCropping,
    cropRect,
    isImage,
    hasCrop,
    startCrop,
    applyCrop,
    cancelCrop,
    resetCrop,
    updateCropRect,
  };
}
