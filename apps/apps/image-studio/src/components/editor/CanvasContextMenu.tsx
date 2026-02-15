import { useEffect, useState, useCallback, useRef } from "react";
import type * as fabric from "fabric";

interface ContextMenuAction {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
}

interface CanvasContextMenuProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.FabricObject | null;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onSelectAll: () => void;
  onFlipHorizontal?: () => void;
  onFlipVertical?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onSaveAsComponent?: () => void;
}

interface MenuState {
  visible: boolean;
  x: number;
  y: number;
}

export function CanvasContextMenu({
  canvas,
  selectedObject,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onSelectAll,
  onFlipHorizontal,
  onFlipVertical,
  onGroup,
  onUngroup,
  onSaveAsComponent,
}: CanvasContextMenuProps) {
  const [menu, setMenu] = useState<MenuState>({ visible: false, x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const hideMenu = useCallback(() => {
    setMenu((m) => ({ ...m, visible: false }));
  }, []);

  // Listen for right-click on the canvas container
  useEffect(() => {
    if (!canvas) return;

    const canvasEl = canvas.getElement();
    const container = canvasEl.parentElement;
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
      });
    };

    container.addEventListener("contextmenu", handleContextMenu);
    return () => {
      container.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [canvas]);

  // Close on click outside or Escape
  useEffect(() => {
    if (!menu.visible) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideMenu();
      }
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hideMenu();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [menu.visible, hideMenu]);

  if (!menu.visible) return null;

  const hasSelection = !!selectedObject;
  const isMultiSelect = selectedObject?.type === "activeselection";
  const isGroup = selectedObject?.type === "group";

  const actions: ContextMenuAction[] = [
    {
      label: "Copy",
      shortcut: "Ctrl+C",
      onClick: onCopy,
      disabled: !hasSelection,
    },
    {
      label: "Paste",
      shortcut: "Ctrl+V",
      onClick: onPaste,
    },
    {
      label: "Duplicate",
      shortcut: "Ctrl+D",
      onClick: onDuplicate,
      disabled: !hasSelection,
    },
    {
      label: "Select All",
      shortcut: "Ctrl+A",
      onClick: onSelectAll,
      separator: true,
    },
    {
      label: "Bring Forward",
      shortcut: "Ctrl+]",
      onClick: onBringForward,
      disabled: !hasSelection,
    },
    {
      label: "Send Backward",
      shortcut: "Ctrl+[",
      onClick: onSendBackward,
      disabled: !hasSelection,
    },
    {
      label: "Bring to Front",
      onClick: onBringToFront,
      disabled: !hasSelection,
    },
    {
      label: "Send to Back",
      onClick: onSendToBack,
      disabled: !hasSelection,
      separator: true,
    },
    ...(onFlipHorizontal ? [{
      label: "Flip Horizontal",
      onClick: onFlipHorizontal,
      disabled: !hasSelection,
    }] : []),
    ...(onFlipVertical ? [{
      label: "Flip Vertical",
      onClick: onFlipVertical,
      disabled: !hasSelection,
      separator: true,
    }] : []),
    ...(onGroup && isMultiSelect ? [{
      label: "Group",
      shortcut: "Ctrl+G",
      onClick: onGroup,
    }] : []),
    ...(onUngroup && isGroup ? [{
      label: "Ungroup",
      shortcut: "Ctrl+Shift+G",
      onClick: onUngroup,
      separator: true,
    }] : []),
    ...(onSaveAsComponent && hasSelection ? [{
      label: "Save as Component",
      onClick: onSaveAsComponent,
      separator: true,
    }] : []),
    {
      label: "Delete",
      shortcut: "Del",
      onClick: onDelete,
      disabled: !hasSelection,
      destructive: true,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[180px] rounded-md border bg-popover shadow-md py-1"
      style={{
        left: menu.x,
        top: menu.y,
      }}
    >
      {actions.map((action, i) => (
        <div key={action.label}>
          {action.separator && i > 0 && (
            <div className="h-px bg-border my-1" />
          )}
          <button
            onClick={() => {
              if (!action.disabled) {
                action.onClick();
                hideMenu();
              }
            }}
            disabled={action.disabled}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors ${
              action.disabled
                ? "text-muted-foreground/40 cursor-default"
                : action.destructive
                ? "text-destructive hover:bg-destructive/10"
                : "hover:bg-accent"
            }`}
          >
            <span>{action.label}</span>
            {action.shortcut && (
              <span className="text-[10px] text-muted-foreground ml-6">{action.shortcut}</span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
