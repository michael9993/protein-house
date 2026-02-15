interface AlignmentToolbarProps {
  hasMultipleSelected: boolean;
  onAlign: (alignment: "left" | "centerH" | "right" | "top" | "centerV" | "bottom") => void;
  onDistribute: (direction: "horizontal" | "vertical") => void;
}

export function AlignmentToolbar({
  hasMultipleSelected,
  onAlign,
  onDistribute,
}: AlignmentToolbarProps) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground uppercase block mb-1">Align</label>
      <div className="grid grid-cols-3 gap-1 mb-1.5">
        <AlignButton title="Align Left" onClick={() => onAlign("left")}>
          <AlignLeftIcon />
        </AlignButton>
        <AlignButton title="Align Center" onClick={() => onAlign("centerH")}>
          <AlignCenterHIcon />
        </AlignButton>
        <AlignButton title="Align Right" onClick={() => onAlign("right")}>
          <AlignRightIcon />
        </AlignButton>
        <AlignButton title="Align Top" onClick={() => onAlign("top")}>
          <AlignTopIcon />
        </AlignButton>
        <AlignButton title="Align Middle" onClick={() => onAlign("centerV")}>
          <AlignCenterVIcon />
        </AlignButton>
        <AlignButton title="Align Bottom" onClick={() => onAlign("bottom")}>
          <AlignBottomIcon />
        </AlignButton>
      </div>

      {hasMultipleSelected && (
        <>
          <label className="text-[10px] text-muted-foreground uppercase block mb-1 mt-2">Distribute</label>
          <div className="flex gap-1">
            <AlignButton title="Distribute Horizontally" onClick={() => onDistribute("horizontal")} wide>
              <DistributeHIcon />
              <span className="text-[9px] ml-0.5">H</span>
            </AlignButton>
            <AlignButton title="Distribute Vertically" onClick={() => onDistribute("vertical")} wide>
              <DistributeVIcon />
              <span className="text-[9px] ml-0.5">V</span>
            </AlignButton>
          </div>
        </>
      )}
    </div>
  );
}

function AlignButton({
  title,
  onClick,
  children,
  wide,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex items-center justify-center gap-0.5 py-1.5 text-[10px] rounded border hover:bg-accent transition-colors ${wide ? "flex-1" : ""}`}
    >
      {children}
    </button>
  );
}

function AlignLeftIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="3" x2="3" y2="21" />
      <rect x="7" y="6" width="14" height="4" rx="1" />
      <rect x="7" y="14" width="10" height="4" rx="1" />
    </svg>
  );
}

function AlignCenterHIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="3" x2="12" y2="21" />
      <rect x="5" y="6" width="14" height="4" rx="1" />
      <rect x="7" y="14" width="10" height="4" rx="1" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="21" y1="3" x2="21" y2="21" />
      <rect x="3" y="6" width="14" height="4" rx="1" />
      <rect x="7" y="14" width="10" height="4" rx="1" />
    </svg>
  );
}

function AlignTopIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="3" x2="21" y2="3" />
      <rect x="6" y="7" width="4" height="14" rx="1" />
      <rect x="14" y="7" width="4" height="10" rx="1" />
    </svg>
  );
}

function AlignCenterVIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="7" width="4" height="10" rx="1" />
    </svg>
  );
}

function AlignBottomIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <rect x="6" y="3" width="4" height="14" rx="1" />
      <rect x="14" y="7" width="4" height="10" rx="1" />
    </svg>
  );
}

function DistributeHIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="3" x2="3" y2="21" />
      <line x1="21" y1="3" x2="21" y2="21" />
      <rect x="9" y="6" width="6" height="12" rx="1" />
    </svg>
  );
}

function DistributeVIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="3" x2="21" y2="3" />
      <line x1="3" y1="21" x2="21" y2="21" />
      <rect x="6" y="9" width="12" height="6" rx="1" />
    </svg>
  );
}
