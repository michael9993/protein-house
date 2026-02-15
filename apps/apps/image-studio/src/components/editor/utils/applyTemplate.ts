import * as fabric from "fabric";
import type { Template, TemplateLayer } from "@/modules/templates/types";

/**
 * Apply a template to a Fabric.js canvas.
 * Resizes the canvas, sets background, and creates all template layers.
 */
export function applyTemplateToCanvas(canvas: fabric.Canvas, template: Template) {
  // Clear existing content
  canvas.clear();

  // Resize canvas to template dimensions
  canvas.setDimensions({ width: template.width, height: template.height });
  canvas.backgroundColor = template.backgroundColor;

  // Add each layer
  for (const layer of template.layers) {
    const obj = createLayerObject(layer);
    if (obj) {
      // Tag placeholder objects with metadata for mockup auto-fill
      if (layer.placeholderType) {
        (obj as any).data = {
          ...((obj as any).data ?? {}),
          placeholderType: layer.placeholderType,
          placeholderLabel: layer.placeholder ?? layer.placeholderType,
        };
      }
      canvas.add(obj);
    }
  }

  canvas.renderAll();
}

function createLayerObject(layer: TemplateLayer): fabric.FabricObject | null {
  switch (layer.type) {
    case "rect": {
      return new fabric.Rect({
        left: layer.left,
        top: layer.top,
        width: layer.width,
        height: layer.height,
        fill: layer.fill ?? "#cccccc",
        stroke: layer.stroke,
        strokeWidth: layer.strokeWidth ?? 0,
        opacity: layer.opacity ?? 1,
      });
    }

    case "circle": {
      const radius = Math.min(layer.width, layer.height) / 2;
      return new fabric.Circle({
        left: layer.left,
        top: layer.top,
        radius,
        fill: layer.fill ?? "#cccccc",
        stroke: layer.stroke,
        strokeWidth: layer.strokeWidth ?? 0,
        opacity: layer.opacity ?? 1,
      });
    }

    case "text": {
      const textContent = String(layer.text ?? layer.placeholder ?? "Text");
      return new fabric.IText(textContent, {
        left: layer.left,
        top: layer.top,
        width: layer.width,
        fontSize: layer.fontSize ?? 24,
        fontFamily: layer.fontFamily ?? "Arial",
        fontWeight: (layer.fontWeight ?? "normal") as any,
        textAlign: layer.textAlign ?? "left",
        fill: layer.fill ?? "#000000",
        opacity: layer.opacity ?? 1,
      });
    }

    case "image": {
      // Create a placeholder rect for image slots
      // Users will replace these with their own images
      const placeholder = new fabric.Rect({
        left: layer.left,
        top: layer.top,
        width: layer.width,
        height: layer.height,
        fill: "#e8e8e8",
        stroke: "#cccccc",
        strokeWidth: 1,
        strokeDashArray: [8, 4],
        opacity: layer.opacity ?? 1,
      });

      // If there's a source URL, load it asynchronously
      if (layer.src) {
        fabric.FabricImage.fromURL(layer.src, { crossOrigin: "anonymous" }).then((img) => {
          const scaleX = layer.width / (img.width ?? 1);
          const scaleY = layer.height / (img.height ?? 1);
          img.set({
            left: layer.left,
            top: layer.top,
            scaleX,
            scaleY,
            opacity: layer.opacity ?? 1,
          });
          const canvas = placeholder.canvas;
          if (canvas) {
            const idx = canvas.getObjects().indexOf(placeholder);
            canvas.remove(placeholder);
            canvas.insertAt(idx, img);
            canvas.renderAll();
          }
        }).catch(() => {
          // Keep placeholder on error
        });
      }

      return placeholder;
    }

    default:
      return null;
  }
}
