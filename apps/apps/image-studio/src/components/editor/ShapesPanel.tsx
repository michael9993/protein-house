interface ShapesPanelProps {
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddTriangle: () => void;
  onAddStar: (points?: number) => void;
  onAddLine: () => void;
  onAddArrow: () => void;
  onAddPolygon: (sides?: number) => void;
  onClose: () => void;
}

export function ShapesPanel({
  onAddRect,
  onAddCircle,
  onAddTriangle,
  onAddStar,
  onAddLine,
  onAddArrow,
  onAddPolygon,
  onClose,
}: ShapesPanelProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase">Shapes</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          Done
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ShapeButton onClick={onAddRect} label="Rectangle">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </ShapeButton>
        <ShapeButton onClick={onAddCircle} label="Circle">
          <circle cx="12" cy="12" r="9" />
        </ShapeButton>
        <ShapeButton onClick={onAddTriangle} label="Triangle">
          <polygon points="12,3 3,21 21,21" />
        </ShapeButton>
        <ShapeButton onClick={() => onAddStar(5)} label="Star">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </ShapeButton>
        <ShapeButton onClick={onAddLine} label="Line">
          <line x1="4" y1="20" x2="20" y2="4" />
        </ShapeButton>
        <ShapeButton onClick={onAddArrow} label="Arrow">
          <path d="M5 12h14M13 5l6 7-6 7" />
        </ShapeButton>
        <ShapeButton onClick={() => onAddPolygon(5)} label="Pentagon">
          <polygon points="12,2.5 22,9.5 19,20.5 5,20.5 2,9.5" />
        </ShapeButton>
        <ShapeButton onClick={() => onAddPolygon(6)} label="Hexagon">
          <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
        </ShapeButton>
        <ShapeButton onClick={() => onAddPolygon(8)} label="Octagon">
          <polygon points="8,2 16,2 22,8 22,16 16,22 8,22 2,16 2,8" />
        </ShapeButton>
      </div>
    </div>
  );
}

function ShapeButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-2 rounded-md border hover:bg-accent transition-colors"
      title={label}
    >
      <svg
        className="h-6 w-6 text-foreground"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
      <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
    </button>
  );
}
