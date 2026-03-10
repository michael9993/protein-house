import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import * as fabric from "fabric";

import { useCanvas } from "./hooks/useCanvas";
import { useHistory } from "./hooks/useHistory";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useAutoSave } from "./hooks/useAutoSave";
import { CanvasToolbar } from "./CanvasToolbar";
import { ToolPanel } from "./ToolPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { LayersPanel } from "./LayersPanel";
import { ExportDialog } from "./ExportDialog";
import { CanvasContextMenu } from "./CanvasContextMenu";
import { SaveToSaleorDialog } from "../products/SaveToSaleorDialog";
import { BackgroundRemovalPanel } from "../ai/BackgroundRemovalPanel";
import { BackgroundGenerationPanel } from "../ai/BackgroundGenerationPanel";
import { EnhancePanel } from "../ai/EnhancePanel";
import { UpscalePanel } from "../ai/UpscalePanel";
import { AIEditPanel } from "../ai/AIEditPanel";
import { DrawingPanel } from "./DrawingPanel";
import { FiltersPanel } from "./FiltersPanel";
import { CanvasResizeDialog } from "./CanvasResizeDialog";
import { useCropTool } from "./hooks/useCropTool";
import { CropOverlay } from "./CropOverlay";
import { useDrawing } from "./hooks/useDrawing";
import { useSmartGuides } from "./hooks/useSmartGuides";
import { useManualGuides } from "./hooks/useManualGuides";
import { BUILT_IN_TEMPLATES } from "@/modules/templates/built-in";
import { applyTemplateToCanvas } from "./utils/applyTemplate";
import { ComponentsPanel } from "./ComponentsPanel";
import { FloatingTextToolbar } from "./FloatingTextToolbar";
import { ShapesPanel } from "./ShapesPanel";
import { HistoryPanel } from "./HistoryPanel";
import { SocialPresetsPanel } from "./SocialPresetsPanel";
import { BrandKitDialog } from "./BrandKitDialog";
import { MockupFillDialog } from "./MockupFillDialog";
import { CodeExportDialog } from "./CodeExportDialog";
import { useComponentStorage } from "@/modules/components/useComponentStorage";
import { useProjects } from "@/modules/projects/useProjects";
import type { Project } from "@/modules/projects/types";

const CANVAS_ID = "image-studio-canvas";

type RightPanel = "properties" | "layers" | "history";

export function CanvasEditor() {
  const [showExport, setShowExport] = useState(false);
  const [showSaveToSaleor, setShowSaveToSaleor] = useState(false);
  const [saveFormat, setSaveFormat] = useState<"png" | "jpeg">("png");
  const [saveBase64, setSaveBase64] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [activeAIPanel, setActiveAIPanel] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>("properties");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [showCanvasResize, setShowCanvasResize] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [showSaveComponent, setShowSaveComponent] = useState(false);
  const [showMockupFill, setShowMockupFill] = useState(false);
  const [showBrandKit, setShowBrandKit] = useState(false);
  const [showCodeExport, setShowCodeExport] = useState(false);
  const [showProjectNameDialog, setShowProjectNameDialog] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState("");
  const [eyedropperTarget, setEyedropperTarget] = useState<"fill" | "stroke" | null>(null);
  const draftPromptShown = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const {
    canvas,
    selectedObject,
    zoom,
    canvasWidth,
    canvasHeight,
    addImage,
    addText,
    addTextbox,
    addRect,
    addCircle,
    addTriangle,
    addStar,
    addLine,
    addArrow,
    addPolygon,
    addSVG,
    deleteSelected,
    selectAll,
    copySelected,
    pasteFromClipboard,
    duplicateSelected,
    setZoomLevel,
    exportCanvas,
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
    enterPanMode,
    exitPanMode,
    sampleColor,
  } = useCanvas(CANVAS_ID, { width: 800, height: 600 });

  const { saveState, undo, redo, canUndo, canRedo, initHistory, entries: historyEntries, currentIndex: historyIndex, jumpTo: historyJumpTo } = useHistory(canvas);
  const crop = useCropTool(canvas, selectedObject);
  const drawing = useDrawing(canvas);
  const {
    components,
    addComponent,
    removeComponent,
    updateComponentName,
    brandKits,
    addBrandKit,
    removeBrandKit,
  } = useComponentStorage();

  const manualGuides = useManualGuides(canvas, canvasWidth, canvasHeight);

  const {
    gridVisible,
    snapEnabled,
    toggleSnap,
    toggleGrid,
  } = useSmartGuides(canvas, true, canvasWidth, canvasHeight, manualGuides.verticalSnapTargets, manualGuides.horizontalSnapTargets);

  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    createProject,
    updateProject,
  } = useProjects();

  const { hasDraft, lastSaved, saveDraft, restoreDraft, clearDraft } = useAutoSave(canvas, activeProjectId, canvasWidth, canvasHeight);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Detect mockup placeholders on canvas
  const hasPlaceholders = useMemo(() => {
    if (!canvas) return false;
    return canvas.getObjects().some((obj) => (obj as any).data?.placeholderType);
  }, [canvas, selectedObject]);

  // Enter/exit drawing mode when panel changes
  useEffect(() => {
    if (activeAIPanel === "draw") {
      drawing.enterDrawingMode();
    } else if (drawing.isDrawing) {
      drawing.exitDrawingMode();
    }
  }, [activeAIPanel]);

  // Show draft recovery prompt once on mount if a draft exists
  useEffect(() => {
    if (hasDraft && canvas && !draftPromptShown.current) {
      draftPromptShown.current = true;
      setShowDraftRecovery(true);
    }
  }, [hasDraft, canvas]);

  // Load image from sessionStorage (coming from Products page)
  useEffect(() => {
    if (!canvas) return;
    const pendingImage = sessionStorage.getItem("image-studio-pending-image");
    if (pendingImage) {
      sessionStorage.removeItem("image-studio-pending-image");
      addImage(pendingImage);
    }
  }, [canvas]);

  // Apply template from sessionStorage (coming from Templates page)
  useEffect(() => {
    if (!canvas) return;
    const pendingTemplate = sessionStorage.getItem("image-studio-pending-template");
    if (pendingTemplate) {
      sessionStorage.removeItem("image-studio-pending-template");
      const template = BUILT_IN_TEMPLATES.find((t) => t.id === pendingTemplate);
      if (template) {
        applyTemplateToCanvas(canvas, template);
        showNotification("success", `Template "${template.name}" applied`);
      }
    }
  }, [canvas]);

  // Load component from sessionStorage (coming from Library page)
  useEffect(() => {
    if (!canvas) return;
    const pending = sessionStorage.getItem("image-studio-pending-component");
    if (pending) {
      sessionStorage.removeItem("image-studio-pending-component");
      try {
        const comp = JSON.parse(pending);
        fabric.util.enlivenObjects([comp.fabricJson]).then((objects: fabric.FabricObject[]) => {
          objects.forEach((obj) => {
            obj.set({ left: (obj.left ?? 0) + 20, top: (obj.top ?? 0) + 20 });
            canvas.add(obj);
          });
          if (objects.length > 0) {
            canvas.setActiveObject(
              objects.length === 1
                ? objects[0]
                : new fabric.ActiveSelection(objects, { canvas }),
            );
            canvas.renderAll();
            canvas.fire("object:modified", { target: objects[0] });
            showNotification("success", `Component "${comp.name}" loaded`);
          }
        });
      } catch {
        // Ignore invalid JSON
      }
    }
  }, [canvas]);

  // Load project from sessionStorage (coming from Projects page)
  useEffect(() => {
    if (!canvas) return;
    const pending = sessionStorage.getItem("image-studio-pending-project");
    if (pending) {
      sessionStorage.removeItem("image-studio-pending-project");
      try {
        const project: Project = JSON.parse(pending);
        canvas.loadFromJSON(project.canvasJson).then(() => {
          resizeCanvas(project.canvasWidth, project.canvasHeight);
          canvas.requestRenderAll();
          setActiveProjectId(project.id);
          showNotification("success", `Project "${project.name}" loaded`);
        });
      } catch {
        // Ignore invalid JSON
      }
    }
  }, [canvas]);

  // Generate a document-only thumbnail (not the workspace)
  const generateThumbnail = useCallback((): string => {
    const full = exportCanvas("png", 0.8);
    if (!full) return "";
    // Downscale by creating a small canvas
    try {
      const img = new Image();
      img.src = full;
      const thumbCanvas = document.createElement("canvas");
      const maxDim = 200;
      const ratio = Math.min(maxDim / canvasWidth, maxDim / canvasHeight, 1);
      thumbCanvas.width = Math.round(canvasWidth * ratio);
      thumbCanvas.height = Math.round(canvasHeight * ratio);
      const tCtx = thumbCanvas.getContext("2d");
      if (tCtx) {
        tCtx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
        return thumbCanvas.toDataURL("image/png", 0.6);
      }
    } catch {
      // Fallback to full size
    }
    return full;
  }, [exportCanvas, canvasWidth, canvasHeight]);

  // Save project handler
  const handleSaveProject = useCallback(() => {
    if (!canvas) return;

    if (activeProjectId) {
      const json = canvas.toJSON();
      const thumbnail = generateThumbnail();
      updateProject(activeProjectId, json, canvasWidth, canvasHeight, thumbnail);
      showNotification("success", "Project saved");
    } else {
      // Show inline dialog instead of prompt() (blocked by iframe sandbox)
      setProjectNameInput("");
      setShowProjectNameDialog(true);
    }
  }, [canvas, activeProjectId, canvasWidth, canvasHeight, updateProject, generateThumbnail]);

  // Create project after name is entered
  const handleConfirmProjectName = useCallback(() => {
    if (!canvas || !projectNameInput.trim()) return;
    const json = canvas.toJSON();
    const thumbnail = generateThumbnail();
    createProject(projectNameInput.trim(), json, canvasWidth, canvasHeight, thumbnail);
    showNotification("success", `Project "${projectNameInput.trim()}" created`);
    setShowProjectNameDialog(false);
    setProjectNameInput("");
  }, [canvas, projectNameInput, canvasWidth, canvasHeight, createProject, generateThumbnail]);

  // Initialize history when canvas is ready
  useEffect(() => {
    if (!canvas) return;
    initHistory();

    const events = [
      "object:added",
      "object:removed",
      "object:modified",
      "object:skewing",
    ] as const;

    const handler = () => saveState();
    events.forEach((event) => canvas.on(event, handler));

    return () => {
      events.forEach((event) => canvas.off(event, handler));
    };
  }, [canvas, initHistory, saveState]);

  // Keyboard shortcuts
  const shortcutActions = useMemo(
    () => ({
      undo,
      redo,
      deleteSelected,
      selectAll,
      copy: copySelected,
      paste: pasteFromClipboard,
      duplicate: duplicateSelected,
      bringForward,
      sendBackward,
      zoomIn: () => setZoomLevel(zoom + 0.1),
      zoomOut: () => setZoomLevel(zoom - 0.1),
      zoomReset: () => setZoomLevel(1),
      save: handleSaveProject,
      exportImage: () => setShowExport(true),
      group: groupSelected,
      ungroup: ungroupSelected,
      escape: () => {
        if (activeAIPanel) {
          setActiveAIPanel(null);
        } else {
          discardSelection();
        }
      },
      toggleLeftPanel: () => {
        setLeftPanelOpen((prev) => {
          if (prev) setActiveAIPanel(null);
          return !prev;
        });
      },
      toggleRightPanel: () => setRightPanelOpen((prev) => !prev),
      toggleAllPanels: () => {
        const bothOpen = leftPanelOpen && rightPanelOpen;
        setLeftPanelOpen(!bothOpen);
        setRightPanelOpen(!bothOpen);
        if (bothOpen) setActiveAIPanel(null);
      },
      toggleGrid,
      toggleSnap,
      enterPanMode,
      exitPanMode,
    }),
    [
      undo, redo, deleteSelected, selectAll, copySelected, pasteFromClipboard,
      duplicateSelected, bringForward, sendBackward, zoom, setZoomLevel,
      handleSaveProject, activeAIPanel, discardSelection, groupSelected, ungroupSelected,
      leftPanelOpen, rightPanelOpen, toggleGrid, toggleSnap, enterPanMode, exitPanMode,
    ]
  );

  useKeyboardShortcuts(shortcutActions);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // SVG files: read as text and use addSVG
      if (file.name.toLowerCase().endsWith(".svg") || file.type === "image/svg+xml") {
        const reader = new FileReader();
        reader.onload = (event) => {
          const svgText = event.target?.result as string;
          if (svgText) addSVG(svgText);
        };
        reader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) addImage(dataUrl);
        };
        reader.readAsDataURL(file);
      }
      e.target.value = "";
    },
    [addImage, addSVG]
  );

  const handleImageUrlSubmit = useCallback(() => {
    if (imageUrlInput.trim()) {
      addImage(imageUrlInput.trim());
      setImageUrlInput("");
      setShowImageInput(false);
    }
  }, [imageUrlInput, addImage]);

  const handleExport = useCallback(
    (format: "png" | "jpeg" | "webp", quality: number, transparentBg?: boolean) => {
      const dataUrl = exportCanvas(format, quality, transparentBg);
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `image-studio-export.${format === "jpeg" ? "jpg" : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setShowExport(false);
    },
    [exportCanvas]
  );

  const handleSaveToSaleor = useCallback(() => {
    const dataUrl = exportCanvas("png", 1);
    if (!dataUrl) return;
    setSaveBase64(dataUrl);
    setSaveFormat("png");
    setShowSaveToSaleor(true);
  }, [exportCanvas]);

  const handleSaved = useCallback((_productId: string, _mediaId: string) => {
    setShowSaveToSaleor(false);
    showNotification("success", "Image saved to product!");
  }, []);

  const showNotification = useCallback((type: "success" | "error", message: string) => {
    setNotification({ type, message });
  }, []);

  // AI result handler: replace the selected image with AI result
  const handleAIResult = useCallback(
    (resultBase64: string) => {
      if (selectedObject?.type === "image") {
        replaceSelectedImage(resultBase64);
      } else {
        addImage(resultBase64);
      }
      showNotification("success", "AI processing complete!");
    },
    [selectedObject, replaceSelectedImage, addImage, showNotification]
  );

  // AI generation result: add as background (bottom layer)
  const handleGenerationResult = useCallback(
    (resultBase64: string) => {
      addImage(resultBase64);
      showNotification("success", "Background generated!");
    },
    [addImage, showNotification]
  );

  // Eyedropper mode: set cursor and handle clicks
  useEffect(() => {
    if (!canvas || !eyedropperTarget) return;
    canvas.defaultCursor = "crosshair";
    canvas.selection = false;

    const handleClick = (opt: any) => {
      const pointer = canvas.getViewportPoint(opt.e);
      const color = sampleColor(pointer.x, pointer.y);
      if (color && selectedObject) {
        selectedObject.set(eyedropperTarget, color);
        canvas.renderAll();
        canvas.fire("object:modified", { target: selectedObject });
      }
      setEyedropperTarget(null);
    };

    canvas.on("mouse:down", handleClick);
    return () => {
      canvas.off("mouse:down", handleClick);
      canvas.defaultCursor = "default";
      canvas.selection = true;
    };
  }, [canvas, eyedropperTarget, sampleColor, selectedObject]);

  // Auto-fit canvas zoom when container resizes (panel toggle, window resize)
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        zoomToFit(entry.contentRect.width, entry.contentRect.height);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [canvas, zoomToFit]);

  // Auto-dismiss notification
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Handle draft recovery
  const handleRestoreDraft = useCallback(async () => {
    const restored = await restoreDraft();
    setShowDraftRecovery(false);
    if (restored) {
      showNotification("success", "Draft restored");
      initHistory();
    }
  }, [restoreDraft, showNotification, initHistory]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setShowDraftRecovery(false);
  }, [clearDraft]);

  return (
    <div className="flex flex-col h-full">
      {/* Top Toolbar */}
      <CanvasToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        zoom={zoom}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onUndo={undo}
        onRedo={redo}
        onZoomIn={() => setZoomLevel(zoom + 0.1)}
        onZoomOut={() => setZoomLevel(zoom - 0.1)}
        onZoomReset={() => setZoomLevel(1)}
        onExport={() => setShowExport(true)}
        onSaveToSaleor={handleSaveToSaleor}
        onClear={clearCanvas}
        onCanvasResize={() => setShowCanvasResize(true)}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        onToggleLeftPanel={() => {
          setLeftPanelOpen((prev) => {
            if (prev) setActiveAIPanel(null);
            return !prev;
          });
        }}
        onToggleRightPanel={() => setRightPanelOpen((prev) => !prev)}
        onZoomToFit={() => {
          const container = canvasContainerRef.current;
          if (container) zoomToFit(container.clientWidth, container.clientHeight);
        }}
        hasPlaceholders={hasPlaceholders}
        onFillProduct={() => setShowMockupFill(true)}
        onCodeExport={() => setShowCodeExport(true)}
        snapEnabled={snapEnabled}
        gridVisible={gridVisible}
        onToggleSnap={toggleSnap}
        onToggleGrid={toggleGrid}
        projectName={activeProject?.name ?? null}
        onSaveProject={handleSaveProject}
        onOpenProjects={() => {
          window.location.href = "/projects";
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: collapsed strip or full ToolPanel + AI panel */}
        {!leftPanelOpen ? (
          <button
            onClick={() => setLeftPanelOpen(true)}
            className="w-8 border-r bg-background flex items-center justify-center hover:bg-accent shrink-0"
            title="Show Tools ([)"
          >
            <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        ) : (
          <>
            <ToolPanel
              onAddText={addText}
              onAddTextbox={addTextbox}
              onUploadImage={() => fileInputRef.current?.click()}
              onAddImageUrl={() => setShowImageInput(true)}
              activeAIPanel={activeAIPanel}
              onToggleAIPanel={setActiveAIPanel}
            />

            {/* AI Panels (slides out from left) */}
            {activeAIPanel && (
              <div className="w-56 border-r bg-background p-3 overflow-y-auto">
            {activeAIPanel === "draw" && (
              <DrawingPanel
                brushType={drawing.brushType}
                brushColor={drawing.brushColor}
                brushWidth={drawing.brushWidth}
                brushOpacity={drawing.brushOpacity}
                sprayDensity={drawing.sprayDensity}
                onBrushTypeChange={drawing.setBrushType}
                onBrushColorChange={drawing.setBrushColor}
                onBrushWidthChange={drawing.setBrushWidth}
                onBrushOpacityChange={drawing.setBrushOpacity}
                onSprayDensityChange={drawing.setSprayDensity}
                onDone={() => setActiveAIPanel(null)}
              />
            )}
            {activeAIPanel === "aiEdit" && (
              <AIEditPanel
                getSelectedImageBase64={getSelectedImageBase64}
                onResult={handleAIResult}
              />
            )}
            {activeAIPanel === "removeBg" && (
              <BackgroundRemovalPanel
                getSelectedImageBase64={getSelectedImageBase64}
                onResult={handleAIResult}
              />
            )}
            {activeAIPanel === "generateBg" && (
              <BackgroundGenerationPanel
                onResult={handleGenerationResult}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
              />
            )}
            {activeAIPanel === "enhance" && (
              <EnhancePanel
                getSelectedImageBase64={getSelectedImageBase64}
                onResult={handleAIResult}
              />
            )}
            {activeAIPanel === "upscale" && (
              <UpscalePanel
                getSelectedImageBase64={getSelectedImageBase64}
                onResult={handleAIResult}
              />
            )}
            {activeAIPanel === "filters" && (
              <FiltersPanel
                canvas={canvas}
                selectedObject={selectedObject}
              />
            )}
            {activeAIPanel === "components" && (
              <ComponentsPanel
                canvas={canvas}
                selectedObject={selectedObject}
                components={components}
                onAddComponent={addComponent}
                onDeleteComponent={removeComponent}
                onRenameComponent={updateComponentName}
                showSaveForm={showSaveComponent}
              />
            )}
            {activeAIPanel === "shapes" && (
              <ShapesPanel
                onAddRect={addRect}
                onAddCircle={addCircle}
                onAddTriangle={addTriangle}
                onAddStar={addStar}
                onAddLine={addLine}
                onAddArrow={addArrow}
                onAddPolygon={addPolygon}
                onClose={() => setActiveAIPanel(null)}
              />
            )}
            {activeAIPanel === "social" && (
              <SocialPresetsPanel
                canvas={canvas}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                onResizeCanvas={resizeCanvas}
                brandKits={brandKits}
                onOpenBrandKit={() => setShowBrandKit(true)}
              />
            )}
          </div>
        )}
          </>
        )}

        {/* Canvas Area — canvas element fills this container via zoomToFit */}
        <div ref={canvasContainerRef} className="flex-1 overflow-hidden relative">
          <canvas id={CANVAS_ID} />
          {!crop.isCropping && (
            <FloatingTextToolbar selectedObject={selectedObject} canvas={canvas} />
          )}
          {crop.isCropping && crop.cropRect && canvas && (
            <CropOverlay
              cropRect={crop.cropRect}
              onUpdate={crop.updateCropRect}
              onApply={crop.applyCrop}
              onCancel={crop.cancelCrop}
              containerRect={canvasContainerRef.current?.getBoundingClientRect() ?? null}
              viewportTransform={canvas.viewportTransform ?? [1, 0, 0, 1, 0, 0]}
            />
          )}
        </div>

        {/* Right Panel: collapsed strip or full Properties/Layers */}
        {!rightPanelOpen ? (
          <button
            onClick={() => setRightPanelOpen(true)}
            className="w-8 border-l bg-background flex items-center justify-center hover:bg-accent shrink-0"
            title="Show Properties (])"
          >
            <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        ) : (
          <div className="w-52 border-l bg-background flex flex-col overflow-hidden shrink-0">
            {/* Tab selector */}
            <div className="flex border-b">
              <button
                onClick={() => setRightPanel("properties")}
                className={`flex-1 px-3 py-2 text-[10px] font-medium uppercase transition-colors ${
                  rightPanel === "properties"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Properties
              </button>
              <button
                onClick={() => setRightPanel("layers")}
                className={`flex-1 px-3 py-2 text-[10px] font-medium uppercase transition-colors ${
                  rightPanel === "layers"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Layers
              </button>
              <button
                onClick={() => setRightPanel("history")}
                className={`flex-1 px-3 py-2 text-[10px] font-medium uppercase transition-colors ${
                  rightPanel === "history"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                History
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {rightPanel === "properties" ? (
                <PropertiesPanel
                  selectedObject={selectedObject}
                  canvas={canvas}
                  onBringForward={bringForward}
                  onSendBackward={sendBackward}
                  onDelete={deleteSelected}
                  onFlipHorizontal={flipHorizontal}
                  onFlipVertical={flipVertical}
                  onAlign={alignObjects}
                  onDistribute={distributeObjects}
                  onGroup={groupSelected}
                  onUngroup={ungroupSelected}
                  hasMultipleSelected={selectedObject?.type === "activeselection"}
                  onEyedropper={setEyedropperTarget}
                  eyedropperTarget={eyedropperTarget}
                  onCrop={crop.startCrop}
                  onResetCrop={crop.resetCrop}
                  isImage={crop.isImage}
                  hasClipPath={crop.hasCrop}
                />
              ) : rightPanel === "layers" ? (
                <LayersPanel
                  canvas={canvas}
                  selectedObject={selectedObject}
                  onSelectObject={() => setRightPanel("properties")}
                />
              ) : (
                <HistoryPanel
                  entries={historyEntries}
                  currentIndex={historyIndex}
                  onJumpTo={historyJumpTo}
                />
              )}
            </div>

            {/* Auto-save indicator */}
            {lastSaved && (
              <div className="px-3 py-1.5 border-t text-[9px] text-muted-foreground text-center">
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      <CanvasContextMenu
        canvas={canvas}
        selectedObject={selectedObject}
        onCopy={copySelected}
        onPaste={pasteFromClipboard}
        onDuplicate={duplicateSelected}
        onDelete={deleteSelected}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onSelectAll={selectAll}
        onFlipHorizontal={flipHorizontal}
        onFlipVertical={flipVertical}
        onGroup={groupSelected}
        onUngroup={ungroupSelected}
        onSaveAsComponent={() => {
          setLeftPanelOpen(true);
          setActiveAIPanel("components");
          setShowSaveComponent(true);
        }}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.svg"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Notification toast */}
      {notification && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${
            notification.type === "success"
              ? "bg-green-600 text-white"
              : "bg-destructive text-destructive-foreground"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Draft Recovery Dialog */}
      {showDraftRecovery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-[380px] shadow-xl">
            <h3 className="text-sm font-semibold mb-2">Recover Draft?</h3>
            <p className="text-xs text-muted-foreground mb-4">
              An unsaved draft was found from a previous session. Would you like to restore it?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleDiscardDraft}
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent"
              >
                Discard
              </button>
              <button
                onClick={handleRestoreDraft}
                className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Restore Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image URL Dialog */}
      {showImageInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-[400px] shadow-xl">
            <h3 className="text-sm font-semibold mb-3">Load Image from URL</h3>
            <input
              type="url"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 rounded-md border text-sm mb-3"
              onKeyDown={(e) => e.key === "Enter" && handleImageUrlSubmit()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowImageInput(false);
                  setImageUrlInput("");
                }}
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleImageUrlSubmit}
                className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Load
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Resize Dialog */}
      {showCanvasResize && (
        <CanvasResizeDialog
          currentWidth={canvasWidth}
          currentHeight={canvasHeight}
          onResize={resizeCanvas}
          onClose={() => setShowCanvasResize(false)}
        />
      )}

      {/* Export Dialog */}
      {showExport && (
        <ExportDialog
          onExport={handleExport}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Save to Saleor Dialog */}
      {showSaveToSaleor && (
        <SaveToSaleorDialog
          imageBase64={saveBase64}
          format={saveFormat}
          onClose={() => setShowSaveToSaleor(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Mockup Fill Dialog */}
      {showMockupFill && canvas && (
        <MockupFillDialog
          canvas={canvas}
          onClose={() => setShowMockupFill(false)}
          onFilled={() => {
            setShowMockupFill(false);
            showNotification("success", "Placeholders filled from product!");
          }}
        />
      )}

      {/* Brand Kit Dialog */}
      {showBrandKit && (
        <BrandKitDialog
          brandKits={brandKits}
          onSave={async (kit) => {
            await addBrandKit(kit);
          }}
          onDelete={async (id) => {
            await removeBrandKit(id);
          }}
          onClose={() => setShowBrandKit(false)}
        />
      )}

      {/* Code Export Dialog */}
      {showCodeExport && canvas && (
        <CodeExportDialog
          canvas={canvas}
          onClose={() => setShowCodeExport(false)}
        />
      )}

      {/* Project Name Dialog (replaces prompt() which is blocked in iframe sandbox) */}
      {showProjectNameDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border shadow-lg p-5 w-80">
            <h3 className="text-sm font-semibold mb-3">Save Project</h3>
            <input
              type="text"
              value={projectNameInput}
              onChange={(e) => setProjectNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmProjectName();
                if (e.key === "Escape") setShowProjectNameDialog(false);
              }}
              placeholder="Project name..."
              className="w-full px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowProjectNameDialog(false)}
                className="px-3 py-1.5 text-xs rounded-md border hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmProjectName}
                disabled={!projectNameInput.trim()}
                className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
