import { useCallback, useRef, useState } from "react";
import type * as fabric from "fabric";

const MAX_HISTORY = 50;

export function useHistory(canvas: fabric.Canvas | null) {
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const isRestoring = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const saveState = useCallback(() => {
    if (!canvas || isRestoring.current) return;

    const json = JSON.stringify(canvas.toJSON());
    undoStack.current.push(json);

    if (undoStack.current.length > MAX_HISTORY) {
      undoStack.current.shift();
    }

    redoStack.current = [];
    setCanUndo(undoStack.current.length > 1);
    setCanRedo(false);
  }, [canvas]);

  const undo = useCallback(async () => {
    if (!canvas || undoStack.current.length <= 1) return;

    isRestoring.current = true;

    const current = undoStack.current.pop()!;
    redoStack.current.push(current);

    const previous = undoStack.current[undoStack.current.length - 1];
    if (previous) {
      await canvas.loadFromJSON(JSON.parse(previous));
      canvas.renderAll();
    }

    setCanUndo(undoStack.current.length > 1);
    setCanRedo(redoStack.current.length > 0);
    isRestoring.current = false;
  }, [canvas]);

  const redo = useCallback(async () => {
    if (!canvas || redoStack.current.length === 0) return;

    isRestoring.current = true;

    const next = redoStack.current.pop()!;
    undoStack.current.push(next);

    await canvas.loadFromJSON(JSON.parse(next));
    canvas.renderAll();

    setCanUndo(undoStack.current.length > 1);
    setCanRedo(redoStack.current.length > 0);
    isRestoring.current = false;
  }, [canvas]);

  const initHistory = useCallback(() => {
    if (!canvas) return;
    undoStack.current = [JSON.stringify(canvas.toJSON())];
    redoStack.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, [canvas]);

  return { saveState, undo, redo, canUndo, canRedo, initHistory };
}
