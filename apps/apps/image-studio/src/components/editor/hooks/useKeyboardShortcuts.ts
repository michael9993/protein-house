import { useEffect } from "react";

interface ShortcutActions {
  undo: () => void;
  redo: () => void;
  deleteSelected: () => void;
  selectAll?: () => void;
  copy?: () => void;
  paste?: () => void;
  duplicate?: () => void;
  bringForward?: () => void;
  sendBackward?: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  zoomReset?: () => void;
  save?: () => void;
  exportImage?: () => void;
  toggleGrid?: () => void;
  toggleSnap?: () => void;
  escape?: () => void;
  group?: () => void;
  ungroup?: () => void;
  toggleLeftPanel?: () => void;
  toggleRightPanel?: () => void;
  toggleAllPanels?: () => void;
  enterPanMode?: () => void;
  exitPanMode?: () => void;
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      // Delete key (outside text inputs)
      if ((e.key === "Delete" || e.key === "Backspace") && !isInput) {
        e.preventDefault();
        actions.deleteSelected();
        return;
      }

      // Escape — deselect / close panels
      if (e.key === "Escape") {
        actions.escape?.();
        return;
      }

      // Spacebar: enter pan mode (hold)
      if (e.code === "Space" && !isInput && !e.repeat) {
        e.preventDefault();
        actions.enterPanMode?.();
        return;
      }

      // Panel toggle shortcuts (bare keys, no modifiers, outside text inputs)
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !isInput) {
        if (e.key === "[") {
          e.preventDefault();
          actions.toggleLeftPanel?.();
          return;
        }
        if (e.key === "]") {
          e.preventDefault();
          actions.toggleRightPanel?.();
          return;
        }
        if (e.key === "\\") {
          e.preventDefault();
          actions.toggleAllPanels?.();
          return;
        }
      }

      // Alt shortcuts (snap & grid)
      if (e.altKey && !e.ctrlKey && !e.metaKey && !isInput) {
        if (e.key.toLowerCase() === "g") {
          e.preventDefault();
          actions.toggleGrid?.();
          return;
        }
        if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          actions.toggleSnap?.();
          return;
        }
      }

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              actions.redo();
            } else {
              actions.undo();
            }
            break;
          case "y":
            e.preventDefault();
            actions.redo();
            break;
          case "a":
            if (!isInput) {
              e.preventDefault();
              actions.selectAll?.();
            }
            break;
          case "c":
            if (!isInput) {
              e.preventDefault();
              actions.copy?.();
            }
            break;
          case "v":
            if (!isInput) {
              e.preventDefault();
              actions.paste?.();
            }
            break;
          case "d":
            if (!isInput) {
              e.preventDefault();
              actions.duplicate?.();
            }
            break;
          case "s":
            e.preventDefault();
            actions.save?.();
            break;
          case "e":
            if (!isInput) {
              e.preventDefault();
              actions.exportImage?.();
            }
            break;
          case "g":
            if (!isInput) {
              e.preventDefault();
              if (e.shiftKey) {
                actions.ungroup?.();
              } else {
                actions.group?.();
              }
            }
            break;
          case "]":
            e.preventDefault();
            actions.bringForward?.();
            break;
          case "[":
            e.preventDefault();
            actions.sendBackward?.();
            break;
          case "=":
          case "+":
            e.preventDefault();
            actions.zoomIn?.();
            break;
          case "-":
            e.preventDefault();
            actions.zoomOut?.();
            break;
          case "0":
            e.preventDefault();
            actions.zoomReset?.();
            break;
        }
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") {
        actions.exitPanMode?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [actions]);
}
