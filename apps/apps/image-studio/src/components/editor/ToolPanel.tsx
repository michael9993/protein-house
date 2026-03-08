interface ToolPanelProps {
  onAddText: () => void;
  onAddTextbox: () => void;
  onUploadImage: () => void;
  onAddImageUrl: () => void;
  activeAIPanel: string | null;
  onToggleAIPanel: (panel: string | null) => void;
}

export function ToolPanel({
  onAddText,
  onAddTextbox,
  onUploadImage,
  onAddImageUrl,
  activeAIPanel,
  onToggleAIPanel,
}: ToolPanelProps) {
  return (
    <div className="w-14 border-r bg-background flex flex-col items-center py-3 gap-1 overflow-y-auto">
      <ToolButton onClick={onUploadImage} title="Upload Image" label="Image">
        <ImageUploadIcon />
      </ToolButton>
      <ToolButton onClick={onAddImageUrl} title="Add Image from URL" label="URL">
        <LinkIcon />
      </ToolButton>

      <div className="w-8 h-px bg-border my-1" />

      <ToolButton onClick={onAddText} title="Add Text (IText)" label="Text">
        <TypeIcon />
      </ToolButton>
      <ToolButton onClick={onAddTextbox} title="Add Text Box (auto-wrap)" label="TxtBox">
        <TextboxIcon />
      </ToolButton>
      <ToolButton
        onClick={() => onToggleAIPanel(activeAIPanel === "shapes" ? null : "shapes")}
        title="Shape Library"
        label="Shapes"
        active={activeAIPanel === "shapes"}
      >
        <ShapesIcon />
      </ToolButton>

      <div className="w-8 h-px bg-border my-1" />

      {/* Edit Tools */}
      <ToolButton
        onClick={() => onToggleAIPanel(activeAIPanel === "draw" ? null : "draw")}
        title="Draw"
        label="Draw"
        active={activeAIPanel === "draw"}
      >
        <PencilIcon />
      </ToolButton>
      <ToolButton
        onClick={() => onToggleAIPanel(activeAIPanel === "filters" ? null : "filters")}
        title="Filters"
        label="Filters"
        active={activeAIPanel === "filters"}
      >
        <FilterIcon />
      </ToolButton>

      {/* Library & Social */}
      <ToolButton
        onClick={() => onToggleAIPanel(activeAIPanel === "components" ? null : "components")}
        title="Design Components"
        label="Comps"
        active={activeAIPanel === "components"}
      >
        <PuzzleIcon />
      </ToolButton>
      <ToolButton
        onClick={() => onToggleAIPanel(activeAIPanel === "social" ? null : "social")}
        title="Social Media Presets"
        label="Social"
        active={activeAIPanel === "social"}
      >
        <ShareIcon />
      </ToolButton>

      <div className="w-8 h-px bg-border my-1" />

      {/* AI Tools */}
      <ToolButton
        onClick={() => onToggleAIPanel(activeAIPanel === "aiEdit" ? null : "aiEdit")}
        title="AI Edit Image"
        label="AI Edit"
        active={activeAIPanel === "aiEdit"}
      >
        <WandIcon />
      </ToolButton>
      <ToolButton
        onClick={() => onToggleAIPanel(activeAIPanel === "removeBg" ? null : "removeBg")}
        title="Remove Background"
        label="Rm BG"
        active={activeAIPanel === "removeBg"}
      >
        <ScissorsIcon />
      </ToolButton>
      <ToolButton
        onClick={() => onToggleAIPanel(activeAIPanel === "generateBg" ? null : "generateBg")}
        title="AI Background"
        label="AI BG"
        active={activeAIPanel === "generateBg"}
      >
        <SparklesIcon />
      </ToolButton>
      <ToolButton
        onClick={() => onToggleAIPanel(activeAIPanel === "enhance" ? null : "enhance")}
        title="Enhance Image"
        label="Adjust"
        active={activeAIPanel === "enhance"}
      >
        <SlidersIcon />
      </ToolButton>
      <ToolButton
        onClick={() => onToggleAIPanel(activeAIPanel === "upscale" ? null : "upscale")}
        title="Upscale Image"
        label="Upscale"
        active={activeAIPanel === "upscale"}
      >
        <MaximizeIcon />
      </ToolButton>
    </div>
  );
}

function ToolButton({
  onClick,
  title,
  label,
  children,
  active,
}: {
  onClick: () => void;
  title: string;
  label: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div className="relative group/tip">
      <button
        onClick={onClick}
        className={`flex flex-col items-center gap-0.5 p-1.5 rounded-md w-11 transition-colors ${
          active ? "bg-primary/10 text-primary" : "hover:bg-accent"
        }`}
      >
        {children}
        <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
      </button>
      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-1 text-[10px] bg-popover text-popover-foreground rounded shadow-md border opacity-0 group-hover/tip:opacity-100 transition-opacity duration-100 delay-150 pointer-events-none z-50">
        {title}
      </span>
    </div>
  );
}

function ImageUploadIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function TypeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" x2="15" y1="20" y2="20" />
      <line x1="12" x2="12" y1="4" y2="20" />
    </svg>
  );
}

function SquareIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function ScissorsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" />
      <path d="M20 4 8.12 15.88" /><circle cx="6" cy="18" r="3" />
      <path d="M14.8 14.8 20 20" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="4" y1="21" y2="14" /><line x1="4" x2="4" y1="10" y2="3" />
      <line x1="12" x2="12" y1="21" y2="12" /><line x1="12" x2="12" y1="8" y2="3" />
      <line x1="20" x2="20" y1="21" y2="16" /><line x1="20" x2="20" y1="12" y2="3" />
      <line x1="2" x2="6" y1="14" y2="14" /><line x1="10" x2="14" y1="8" y2="8" />
      <line x1="18" x2="22" y1="16" y2="16" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function WandIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" />
      <path d="M17.8 11.8 19 13" /><path d="M15 9h.01" />
      <path d="M17.8 6.2 19 5" /><path d="m3 21 9-9" />
      <path d="M12.2 6.2 11 5" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function PuzzleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}

function ShapesIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
    </svg>
  );
}

function TextboxIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M7 8h10M7 12h10M7 16h6" />
    </svg>
  );
}
