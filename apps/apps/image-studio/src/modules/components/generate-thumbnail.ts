import * as fabric from "fabric";

const THUMB_SIZE = 120;

/**
 * Generate a thumbnail data URL from a Fabric object.
 * Creates a temporary off-screen canvas, renders the object, and returns a PNG data URL.
 */
export async function generateThumbnail(
  object: fabric.FabricObject,
): Promise<string> {
  const cloned = await object.clone();

  // Get object bounds
  const bounds = cloned.getBoundingRect();
  const objW = bounds.width || 1;
  const objH = bounds.height || 1;

  // Scale to fit thumbnail size
  const scale = Math.min(THUMB_SIZE / objW, THUMB_SIZE / objH, 1);
  const canvasW = Math.ceil(objW * scale);
  const canvasH = Math.ceil(objH * scale);

  // Create off-screen canvas element
  const el = document.createElement("canvas");
  el.width = canvasW;
  el.height = canvasH;

  const tempCanvas = new fabric.StaticCanvas(el, {
    width: canvasW,
    height: canvasH,
    backgroundColor: "#ffffff",
  });

  // Position the cloned object centered in the thumbnail
  cloned.set({
    left: canvasW / 2,
    top: canvasH / 2,
    originX: "center",
    originY: "center",
    scaleX: (cloned.scaleX ?? 1) * scale,
    scaleY: (cloned.scaleY ?? 1) * scale,
  });

  tempCanvas.add(cloned);
  tempCanvas.renderAll();

  const dataUrl = tempCanvas.toDataURL({ format: "png" });

  // Cleanup
  tempCanvas.dispose();

  return dataUrl;
}
