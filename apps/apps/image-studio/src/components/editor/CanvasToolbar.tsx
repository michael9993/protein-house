import { useState } from "react";
import { getAspectRatioLabel } from "./utils/canvasPresets";

const ZOOM_PRESETS = [
  { value: 0.25, label: "25%" },
  { value: 0.5, label: "50%" },
  { value: 0.75, label: "75%" },
  { value: 1, label: "100%" },
  { value: 1.5, label: "150%" },
  { value: 2, label: "200%" },
  { value: 3, label: "300%" },
  { value: 4, label: "400%" },
];

interface CanvasToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  canvasWidth?: number;
  canvasHeight?: number;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onExport: () => void;
  onSaveToSaleor: () => void;
  onClear: () => void;
  onCanvasResize?: () => void;
  leftPanelOpen?: boolean;
  rightPanelOpen?: boolean;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
  onZoomToFit?: () => void;
  onSetZoom?: (level: number) => void;
  hasPlaceholders?: boolean;
  onFillProduct?: () => void;
  onCodeExport?: () => void;
  snapEnabled?: boolean;
  gridVisible?: boolean;
  onToggleSnap?: () => void;
  onToggleGrid?: () => void;
  projectName?: string | null;
  onSaveProject?: () => void;
  onOpenProjects?: () => void;
}

export function CanvasToolbar({
  canUndo,
  canRedo,
  zoom,
  canvasWidth,
  canvasHeight,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onExport,
  onSaveToSaleor,
  onClear,
  onCanvasResize,
  leftPanelOpen,
  rightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
  onZoomToFit,
  onSetZoom,
  hasPlaceholders,
  onFillProduct,
  onCodeExport,
  snapEnabled,
  gridVisible,
  onToggleSnap,
  onToggleGrid,
  projectName,
  onSaveProject,
  onOpenProjects,
}: CanvasToolbarProps) {
  const [showZoomMenu, setShowZoomMenu] = useState(false);

  return (
    <div className="flex items-center justify-between border-b bg-background px-3 py-1.5 overflow-x-auto">
      <div className="flex items-center gap-1 shrink-0">
        {/* Project info */}
        {onOpenProjects && (
          <div className="flex items-center gap-1 border-r pr-2 mr-1">
            <ToolbarButton onClick={onOpenProjects} title="Projects">
              <FolderIcon />
            </ToolbarButton>
            <span className="text-[10px] text-muted-foreground max-w-[100px] truncate hidden md:inline">
              {projectName || "Untitled"}
            </span>
            {onSaveProject && (
              <ToolbarButton onClick={onSaveProject} title="Save project (Ctrl+S)">
                <SaveIcon />
              </ToolbarButton>
            )}
          </div>
        )}

        {/* Panel toggles */}
        {onToggleLeftPanel && (
          <ToolbarButton onClick={onToggleLeftPanel} title={leftPanelOpen ? "Hide Tools ([)" : "Show Tools ([)"}>
            <SidebarLeftIcon active={leftPanelOpen} />
          </ToolbarButton>
        )}
        {onToggleRightPanel && (
          <ToolbarButton onClick={onToggleRightPanel} title={rightPanelOpen ? "Hide Properties (])" : "Show Properties (])"}>
            <SidebarRightIcon active={rightPanelOpen} />
          </ToolbarButton>
        )}

        {(onToggleLeftPanel || onToggleRightPanel) && <div className="w-px h-5 bg-border mx-1" />}

        {/* Undo / Redo */}
        <ToolbarButton onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <UndoIcon />
        </ToolbarButton>
        <ToolbarButton onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          <RedoIcon />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Zoom */}
        <ToolbarButton onClick={onZoomOut} title="Zoom Out (Ctrl+-)">
          <MinusIcon />
        </ToolbarButton>
        <div className="relative">
          <button
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded min-w-[3.5rem] text-center"
            title="Click for zoom presets"
          >
            {Math.round(zoom * 100)}%
            <ChevronDownIcon />
          </button>
          {showZoomMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowZoomMenu(false)} />
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-popover border rounded-md shadow-lg py-1 z-50 min-w-[130px]">
                {ZOOM_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      onSetZoom?.(preset.value);
                      setShowZoomMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-xs text-left hover:bg-accent ${
                      Math.abs(zoom - preset.value) < 0.05 ? "font-semibold text-primary" : "text-popover-foreground"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                {onZoomToFit && (
                  <>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={() => {
                        onZoomToFit();
                        setShowZoomMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent text-popover-foreground"
                    >
                      Fit to Canvas
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    onZoomReset();
                    setShowZoomMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent text-popover-foreground"
                >
                  Reset (100%)
                </button>
              </div>
            </>
          )}
        </div>
        <ToolbarButton onClick={onZoomIn} title="Zoom In (Ctrl+=)">
          <PlusIcon />
        </ToolbarButton>

        {canvasWidth && canvasHeight && onCanvasResize && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <button
              onClick={onCanvasResize}
              className="px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent rounded"
              title="Canvas Size"
            >
              {canvasWidth}x{canvasHeight} ({getAspectRatioLabel(canvasWidth, canvasHeight)})
            </button>
          </>
        )}

        {/* Snap & Grid toggles */}
        {(onToggleSnap || onToggleGrid) && (
          <div className="flex items-center border-l pl-1.5 ml-1.5 gap-0.5">
            {onToggleSnap && (
              <div className="relative group/tip">
                <button
                  onClick={onToggleSnap}
                  className={`p-1.5 rounded text-xs transition-colors ${
                    snapEnabled ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <MagnetIcon />
                </button>
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap px-2 py-1 text-[10px] bg-popover text-popover-foreground rounded shadow-md border opacity-0 group-hover/tip:opacity-100 transition-opacity duration-100 delay-150 pointer-events-none z-50">
                  {snapEnabled ? "Disable snap (Alt+S)" : "Enable snap (Alt+S)"}
                </span>
              </div>
            )}
            {onToggleGrid && (
              <div className="relative group/tip">
                <button
                  onClick={onToggleGrid}
                  className={`p-1.5 rounded text-xs transition-colors ${
                    gridVisible ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <GridIcon />
                </button>
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap px-2 py-1 text-[10px] bg-popover text-popover-foreground rounded shadow-md border opacity-0 group-hover/tip:opacity-100 transition-opacity duration-100 delay-150 pointer-events-none z-50">
                  {gridVisible ? "Hide grid (Alt+G)" : "Show grid (Alt+G)"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <ToolbarButton onClick={onClear} title="Clear Canvas">
          <TrashIcon />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        {hasPlaceholders && onFillProduct && (
          <button
            onClick={onFillProduct}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
            title="Fill placeholders from a Saleor product"
          >
            <FillIcon />
            Fill Product
          </button>
        )}

        <button
          onClick={onSaveToSaleor}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border hover:bg-accent"
          title="Save to Saleor Product"
        >
          <UploadIcon />
          Save to Product
        </button>

        {onCodeExport && (
          <button
            onClick={onCodeExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border hover:bg-accent"
            title="Export as Code"
          >
            <CodeIcon />
            Code
          </button>
        )}

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <DownloadIcon />
          Export
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative group/tip">
      <button
        onClick={onClick}
        disabled={disabled}
        className="flex items-center justify-center h-7 w-7 rounded hover:bg-accent disabled:opacity-30 disabled:pointer-events-none"
      >
        {children}
      </button>
      {title && (
        <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap px-2 py-1 text-[10px] bg-popover text-popover-foreground rounded shadow-md border opacity-0 group-hover/tip:opacity-100 transition-opacity duration-100 delay-150 pointer-events-none z-50">
          {title}
        </span>
      )}
    </div>
  );
}

function UndoIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}

function SidebarLeftIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-3.5 w-3.5 ${active ? "" : "opacity-50"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </svg>
  );
}

function SidebarRightIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`h-3.5 w-3.5 ${active ? "" : "opacity-50"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M15 3v18" />
    </svg>
  );
}

function FillIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
      <path d="m5 2 5 5" />
      <path d="M2 13h15" />
      <path d="M22 20a2 2 0 1 1-4 0c0-1.6 2-3 2-3s2 1.4 2 3Z" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function MagnetIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 15-4-4 6.75-6.77a7.79 7.79 0 0 1 11 11L13 22l-4-4 6.39-6.36a2.14 2.14 0 0 0-3-3L6 15" />
      <path d="m5 8 4 4" />
      <path d="m12 15 4 4" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="inline-block h-3 w-3 ml-0.5 -mr-0.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <path d="M7 3v4a1 1 0 0 0 1 1h7" />
    </svg>
  );
}
