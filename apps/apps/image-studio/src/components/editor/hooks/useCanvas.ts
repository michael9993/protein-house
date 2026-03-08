import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";

export interface CanvasState {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.FabricObject | null;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
}

interface UseCanvasOptions {
  width?: number;
  height?: number;
}

/** Marker property on the page background rect */
const PAGE_BG_KEY = "__pageBg";

function isPageBackground(obj: fabric.FabricObject): boolean {
  return (obj as any)[PAGE_BG_KEY] === true;
}

function createPageRect(w: number, h: number): fabric.Rect {
  const rect = new fabric.Rect({
    left: 0,
    top: 0,
    width: w,
    height: h,
    fill: "#ffffff",
    selectable: false,
    evented: false,
    strokeWidth: 0,
    shadow: new fabric.Shadow({
      color: "rgba(0,0,0,0.12)",
      blur: 12,
      offsetX: 0,
      offsetY: 2,
    }),
  });
  (rect as any)[PAGE_BG_KEY] = true;
  return rect;
}

export function useCanvas(canvasElId: string, options: UseCanvasOptions = {}) {
  const { width = 800, height = 600 } = options;
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const clipboardRef = useRef<fabric.FabricObject | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);
  const [zoom, setZoom] = useState(1);
  const [canvasDimensions, setCanvasDimensions] = useState({ width, height });

  useEffect(() => {
    const canvasEl = document.getElementById(canvasElId) as HTMLCanvasElement;
    if (!canvasEl) return;

    const canvas = new fabric.Canvas(canvasEl, {
      width,
      height,
      backgroundColor: "#f0f0f0", // workspace gray
      preserveObjectStacking: true,
    });

    // Add page background rect (white document area)
    const pageRect = createPageRect(width, height);
    canvas.add(pageRect);

    canvas.on("selection:created", (e) => {
      setSelectedObject(e.selected?.[0] ?? null);
    });

    canvas.on("selection:updated", (e) => {
      setSelectedObject(e.selected?.[0] ?? null);
    });

    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
    });

    canvasRef.current = canvas;

    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
  }, [canvasElId, width, height]);

  // Helper: find the page background rect on the canvas
  const getPageRect = useCallback((): fabric.Rect | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return (canvas.getObjects().find((o) => isPageBackground(o)) as fabric.Rect) ?? null;
  }, []);

  // Helper: ensure page rect is at the bottom of the stack
  const ensurePageRectAtBottom = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pg = canvas.getObjects().find((o) => isPageBackground(o));
    if (pg) {
      canvas.sendObjectToBack(pg);
    }
  }, []);

  const addImage = useCallback(async (imageUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fix doubled data URL prefix (e.g. data:image/png;base64,data:image/png;base64,...)
    let url = imageUrl;
    const dataPrefix = "data:image/";
    if (url.startsWith(dataPrefix)) {
      const secondIdx = url.indexOf(dataPrefix, dataPrefix.length);
      if (secondIdx > 0) {
        url = url.substring(secondIdx);
      }
    }

    try {
      const img = await fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" });

      // Position relative to document dimensions, not canvas element
      const docW = canvasDimensions.width;
      const docH = canvasDimensions.height;
      const scale = Math.min(docW / (img.width ?? 1), docH / (img.height ?? 1), 1);

      img.scale(scale);
      img.set({
        left: (docW - (img.width ?? 0) * scale) / 2,
        top: (docH - (img.height ?? 0) * scale) / 2,
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    } catch (err) {
      console.error("Failed to load image:", err);
    }
  }, [canvasDimensions]);

  const addText = useCallback((text: string = "Double-click to edit") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const safeText = typeof text === "string" ? text : String(text ?? "Text");
    const textObj = new fabric.IText(safeText, {
      left: canvasDimensions.width / 2 - 100,
      top: canvasDimensions.height / 2 - 20,
      fontSize: 24,
      fontFamily: "Arial",
      fill: "#000000",
    });

    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();
  }, [canvasDimensions]);

  const addRect = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = new fabric.Rect({
      left: canvasDimensions.width / 2 - 50,
      top: canvasDimensions.height / 2 - 50,
      width: 100,
      height: 100,
      fill: "rgba(59, 130, 246, 0.5)",
      stroke: "#3b82f6",
      strokeWidth: 2,
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  }, [canvasDimensions]);

  const addCircle = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const circle = new fabric.Circle({
      left: canvasDimensions.width / 2 - 50,
      top: canvasDimensions.height / 2 - 50,
      radius: 50,
      fill: "rgba(34, 197, 94, 0.5)",
      stroke: "#22c55e",
      strokeWidth: 2,
    });

    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  }, [canvasDimensions]);

  const deleteSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects().filter((o) => !isPageBackground(o));
    if (activeObjects.length === 0) return;

    activeObjects.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
    setSelectedObject(null);
  }, []);

  const selectAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects().filter((obj) => obj.selectable !== false && !isPageBackground(obj));
    if (objects.length === 0) return;

    const selection = new fabric.ActiveSelection(objects, { canvas });
    canvas.setActiveObject(selection);
    canvas.renderAll();
  }, []);

  const copySelected = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const active = canvas.getActiveObject();
    if (!active) return;

    const cloned = await active.clone();
    clipboardRef.current = cloned;
  }, []);

  const pasteFromClipboard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !clipboardRef.current) return;

    const cloned = await clipboardRef.current.clone();
    canvas.discardActiveObject();

    cloned.set({
      left: (cloned.left ?? 0) + 20,
      top: (cloned.top ?? 0) + 20,
      evented: true,
    });

    if (cloned.type === "activeselection") {
      (cloned as fabric.ActiveSelection).forEachObject((obj: fabric.FabricObject) => {
        canvas.add(obj);
      });
      cloned.setCoords();
    } else {
      canvas.add(cloned);
    }

    // Offset clipboard for next paste
    clipboardRef.current.set({
      left: (clipboardRef.current.left ?? 0) + 20,
      top: (clipboardRef.current.top ?? 0) + 20,
    });

    canvas.setActiveObject(cloned);
    canvas.renderAll();
  }, []);

  const duplicateSelected = useCallback(async () => {
    await copySelected();
    await pasteFromClipboard();
  }, [copySelected, pasteFromClipboard]);

  const setZoomLevel = useCallback((newZoom: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const clamped = Math.max(0.1, Math.min(5, newZoom));
    // Canvas element is container-sized; center the document within it
    const elW = canvas.getWidth();
    const elH = canvas.getHeight();
    const docW = canvasDimensions.width * clamped;
    const docH = canvasDimensions.height * clamped;
    const panX = (elW - docW) / 2;
    const panY = (elH - docH) / 2;
    canvas.setViewportTransform([clamped, 0, 0, clamped, panX, panY]);
    canvas.renderAll();
    setZoom(clamped);
  }, [canvasDimensions]);

  const exportCanvas = useCallback(
    (format: "png" | "jpeg" = "png", quality = 1, transparentBg = false): string | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      // Save current state (canvas element is container-sized)
      const savedW = canvas.getWidth();
      const savedH = canvas.getHeight();
      const savedVT = canvas.viewportTransform
        ? [...canvas.viewportTransform]
        : [1, 0, 0, 1, 0, 0];
      const savedBg = canvas.backgroundColor;

      // Temporarily set canvas to document dimensions at 1:1
      canvas.setDimensions({
        width: canvasDimensions.width,
        height: canvasDimensions.height,
      });
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      // Set page rect to white fill (covers workspace gray) or hide it for transparent
      const pageRect = getPageRect();
      const savedPageFill = pageRect?.fill;
      if (transparentBg) {
        canvas.backgroundColor = "";
        if (pageRect) pageRect.set("visible", false);
      } else {
        canvas.backgroundColor = "#ffffff";
        if (pageRect) pageRect.set("visible", false); // bg color handles it
      }

      canvas.renderAll();

      const dataUrl = canvas.toDataURL({ format, quality, multiplier: 1 });

      // Restore everything
      canvas.backgroundColor = savedBg;
      if (pageRect) {
        pageRect.set("visible", true);
        if (savedPageFill !== undefined) pageRect.set("fill", savedPageFill);
      }
      canvas.setDimensions({ width: savedW, height: savedH });
      canvas.setViewportTransform(savedVT as any);
      canvas.renderAll();

      return dataUrl;
    },
    [canvasDimensions, getPageRect]
  );

  const toJSON = useCallback((): object | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toJSON();
  }, []);

  const loadFromJSON = useCallback(async (json: object) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await canvas.loadFromJSON(json);

    // Ensure page background rect exists and is at bottom
    let pg = canvas.getObjects().find((o) => isPageBackground(o));
    if (!pg) {
      pg = createPageRect(canvasDimensions.width, canvasDimensions.height);
      canvas.add(pg);
    }
    pg.set({ selectable: false, evented: false });
    canvas.sendObjectToBack(pg);

    canvas.backgroundColor = "#f0f0f0";
    canvas.renderAll();
  }, [canvasDimensions]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = "#f0f0f0";

    // Re-add page background
    const pageRect = createPageRect(canvasDimensions.width, canvasDimensions.height);
    canvas.add(pageRect);
    canvas.renderAll();
  }, [canvasDimensions]);

  const bringForward = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedObject) return;
    canvas.bringObjectForward(selectedObject);
    canvas.renderAll();
  }, [selectedObject]);

  const sendBackward = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedObject) return;
    canvas.sendObjectBackwards(selectedObject);
    // Ensure page rect stays at bottom
    ensurePageRectAtBottom();
    canvas.renderAll();
  }, [selectedObject, ensurePageRectAtBottom]);

  const bringToFront = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedObject) return;
    canvas.bringObjectToFront(selectedObject);
    canvas.renderAll();
  }, [selectedObject]);

  const sendToBack = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedObject) return;
    canvas.sendObjectToBack(selectedObject);
    // Ensure page rect stays at very bottom
    ensurePageRectAtBottom();
    canvas.renderAll();
  }, [selectedObject, ensurePageRectAtBottom]);

  const getSelectedImageBase64 = useCallback((): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedObject) return null;

    if (selectedObject.type !== "image") return null;

    return (selectedObject as fabric.FabricImage).toDataURL({
      format: "png",
      quality: 1,
    });
  }, [selectedObject]);

  const replaceSelectedImage = useCallback(async (newBase64: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedObject) return;

    const oldObj = selectedObject;
    const { left, top, scaleX, scaleY, angle } = oldObj;

    // Fix doubled data URL prefix (e.g. data:image/png;base64,data:image/png;base64,...)
    let url = newBase64;
    const dataPrefix = "data:image/";
    if (url.startsWith(dataPrefix)) {
      const secondIdx = url.indexOf(dataPrefix, dataPrefix.length);
      if (secondIdx > 0) {
        url = url.substring(secondIdx);
      }
    }

    try {
      const newImg = await fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
      newImg.set({ left, top, scaleX, scaleY, angle });

      const idx = canvas.getObjects().indexOf(oldObj);
      canvas.remove(oldObj);
      canvas.insertAt(idx, newImg);
      canvas.setActiveObject(newImg);
      canvas.renderAll();
    } catch (err) {
      console.error("Failed to replace image:", err);
    }
  }, [selectedObject]);

  const flipHorizontal = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedObject) return;
    selectedObject.set("flipX", !selectedObject.flipX);
    canvas.renderAll();
    canvas.fire("object:modified", { target: selectedObject });
  }, [selectedObject]);

  const flipVertical = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedObject) return;
    selectedObject.set("flipY", !selectedObject.flipY);
    canvas.renderAll();
    canvas.fire("object:modified", { target: selectedObject });
  }, [selectedObject]);

  const resizeCanvas = useCallback((newWidth: number, newHeight: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update document dimensions (not canvas element size — that's container-driven)
    setCanvasDimensions({ width: newWidth, height: newHeight });

    // Update page background rect to new document dimensions
    const pg = canvas.getObjects().find((o) => isPageBackground(o));
    if (pg) {
      pg.set({ width: newWidth, height: newHeight });
      pg.setCoords();
    }

    canvas.renderAll();
  }, []);

  const groupSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== "activeselection") return;
    const group = (active as fabric.ActiveSelection).toGroup();
    canvas.setActiveObject(group);
    canvas.renderAll();
  }, []);

  const ungroupSelected = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== "group") return;
    const items = (active as fabric.Group).toActiveSelection();
    canvas.setActiveObject(items);
    canvas.renderAll();
  }, []);

  // === Alignment Methods ===
  // Single object: align relative to document dimensions (canvas/scene space)
  // Multiple objects: align relative to each other
  // Note: Fabric.js v6 getBoundingRect() returns scene-plane coordinates (NOT viewport-space),
  // so no viewport transform correction is needed.
  const alignObjects = useCallback((alignment: "left" | "centerH" | "right" | "top" | "centerV" | "bottom") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const active = canvas.getActiveObject();
    if (!active) return;

    const objects = active.type === "activeselection"
      ? (active as fabric.ActiveSelection).getObjects()
      : [active];

    const docW = canvasDimensions.width;
    const docH = canvasDimensions.height;

    if (objects.length === 1) {
      const obj = objects[0];
      // getBoundingRect() returns scene-plane coords in Fabric v6 (no viewport correction needed).
      // We align relative to document dimensions (docW × docH), NOT the canvas element size.
      const bound = obj.getBoundingRect();
      // Offset between obj.left/top and the bounding rect edge (accounts for rotation/origin)
      const offsetX = (obj.left ?? 0) - bound.left;
      const offsetY = (obj.top ?? 0) - bound.top;

      switch (alignment) {
        case "left": obj.set("left", offsetX); break;
        case "centerH": obj.set("left", (docW - bound.width) / 2 + offsetX); break;
        case "right": obj.set("left", docW - bound.width + offsetX); break;
        case "top": obj.set("top", offsetY); break;
        case "centerV": obj.set("top", (docH - bound.height) / 2 + offsetY); break;
        case "bottom": obj.set("top", docH - bound.height + offsetY); break;
      }
      obj.setCoords();
    } else {
      // Align multiple objects relative to selection bounds (all in scene-plane coords)
      const bounds = objects.map((o) => o.getBoundingRect());
      const groupLeft = Math.min(...bounds.map((b) => b.left));
      const groupTop = Math.min(...bounds.map((b) => b.top));
      const groupRight = Math.max(...bounds.map((b) => b.left + b.width));
      const groupBottom = Math.max(...bounds.map((b) => b.top + b.height));

      objects.forEach((obj, i) => {
        const b = bounds[i];
        const offsetX = (obj.left ?? 0) - b.left;
        const offsetY = (obj.top ?? 0) - b.top;
        switch (alignment) {
          case "left": obj.set("left", groupLeft + offsetX); break;
          case "centerH": obj.set("left", (groupLeft + groupRight - b.width) / 2 + offsetX); break;
          case "right": obj.set("left", groupRight - b.width + offsetX); break;
          case "top": obj.set("top", groupTop + offsetY); break;
          case "centerV": obj.set("top", (groupTop + groupBottom - b.height) / 2 + offsetY); break;
          case "bottom": obj.set("top", groupBottom - b.height + offsetY); break;
        }
        obj.setCoords();
      });
    }

    canvas.renderAll();
    canvas.fire("object:modified", { target: active });
  }, [canvasDimensions]);

  const distributeObjects = useCallback((direction: "horizontal" | "vertical") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const active = canvas.getActiveObject();
    if (!active || active.type !== "activeselection") return;

    const objects = (active as fabric.ActiveSelection).getObjects();
    if (objects.length < 3) return;

    const bounds = objects.map((o) => ({ obj: o, rect: o.getBoundingRect() }));

    if (direction === "horizontal") {
      bounds.sort((a, b) => a.rect.left - b.rect.left);
      const totalWidth = bounds.reduce((sum, b) => sum + b.rect.width, 0);
      const start = bounds[0].rect.left;
      const end = bounds[bounds.length - 1].rect.left + bounds[bounds.length - 1].rect.width;
      const gap = (end - start - totalWidth) / (bounds.length - 1);

      let x = start;
      bounds.forEach((b) => {
        b.obj.set("left", x + ((b.obj.left ?? 0) - b.rect.left));
        b.obj.setCoords();
        x += b.rect.width + gap;
      });
    } else {
      bounds.sort((a, b) => a.rect.top - b.rect.top);
      const totalHeight = bounds.reduce((sum, b) => sum + b.rect.height, 0);
      const start = bounds[0].rect.top;
      const end = bounds[bounds.length - 1].rect.top + bounds[bounds.length - 1].rect.height;
      const gap = (end - start - totalHeight) / (bounds.length - 1);

      let y = start;
      bounds.forEach((b) => {
        b.obj.set("top", y + ((b.obj.top ?? 0) - b.rect.top));
        b.obj.setCoords();
        y += b.rect.height + gap;
      });
    }

    canvas.renderAll();
    canvas.fire("object:modified", { target: active });
  }, []);

  const zoomToFit = useCallback((containerWidth: number, containerHeight: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resize canvas element to fill the container
    canvas.setDimensions({ width: containerWidth, height: containerHeight });

    const padding = 40;
    const availW = containerWidth - padding;
    const availH = containerHeight - padding;
    const fitZoom = Math.min(availW / canvasDimensions.width, availH / canvasDimensions.height, 2);
    const clamped = Math.max(0.1, Math.min(5, fitZoom));

    // Center the zoomed document within the container
    const docW = canvasDimensions.width * clamped;
    const docH = canvasDimensions.height * clamped;
    const panX = (containerWidth - docW) / 2;
    const panY = (containerHeight - docH) / 2;
    canvas.setViewportTransform([clamped, 0, 0, clamped, panX, panY]);
    canvas.renderAll();
    setZoom(clamped);
  }, [canvasDimensions]);

  const discardSelection = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.renderAll();
    setSelectedObject(null);
  }, []);

  return {
    canvas: canvasRef.current,
    selectedObject,
    zoom,
    canvasWidth: canvasDimensions.width,
    canvasHeight: canvasDimensions.height,
    addImage,
    addText,
    addRect,
    addCircle,
    deleteSelected,
    selectAll,
    copySelected,
    pasteFromClipboard,
    duplicateSelected,
    setZoomLevel,
    exportCanvas,
    toJSON,
    loadFromJSON,
    clearCanvas,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    getSelectedImageBase64,
    replaceSelectedImage,
    discardSelection,
    flipHorizontal,
    flipVertical,
    resizeCanvas,
    groupSelected,
    ungroupSelected,
    alignObjects,
    distributeObjects,
    zoomToFit,
  };
}
