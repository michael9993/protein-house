import { useCallback, useRef, useState } from "react";
import type * as fabric from "fabric";

const MAX_HISTORY = 50;

export interface HistoryEntry {
  json: string;
  label: string;
  timestamp: number;
}

function inferLabel(canvas: fabric.Canvas, prevJson: string | null): string {
  if (!prevJson) return "Initial State";

  try {
    const prev = JSON.parse(prevJson);
    const curr = JSON.parse(JSON.stringify(canvas.toJSON()));

    const prevCount = prev.objects?.length ?? 0;
    const currCount = curr.objects?.length ?? 0;

    if (currCount > prevCount) {
      // Find the newest object type
      const lastObj = curr.objects?.[currCount - 1];
      const typeName = getObjectTypeName(lastObj?.type);
      return `Added ${typeName}`;
    }

    if (currCount < prevCount) {
      return `Deleted Object`;
    }

    // Same count — modification
    return "Modified Object";
  } catch {
    return "Canvas Changed";
  }
}

function getObjectTypeName(type: string | undefined): string {
  switch (type) {
    case "rect": return "Rectangle";
    case "circle": return "Circle";
    case "triangle": return "Triangle";
    case "polygon": return "Polygon";
    case "line": return "Line";
    case "i-text": return "Text";
    case "textbox": return "Text Box";
    case "image": return "Image";
    case "group": return "Group";
    case "path": return "Path";
    default: return type ?? "Object";
  }
}

export function useHistory(canvas: fabric.Canvas | null) {
  const undoStack = useRef<HistoryEntry[]>([]);
  const redoStack = useRef<HistoryEntry[]>([]);
  const isRestoring = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const updateEntries = useCallback(() => {
    setEntries([...undoStack.current]);
    setCurrentIndex(undoStack.current.length - 1);
  }, []);

  const saveState = useCallback((label?: string) => {
    if (!canvas || isRestoring.current) return;

    const json = JSON.stringify(canvas.toJSON());
    const prevJson = undoStack.current.length > 0 ? undoStack.current[undoStack.current.length - 1].json : null;
    const entryLabel = label ?? inferLabel(canvas, prevJson);

    undoStack.current.push({ json, label: entryLabel, timestamp: Date.now() });

    if (undoStack.current.length > MAX_HISTORY) {
      undoStack.current.shift();
    }

    redoStack.current = [];
    setCanUndo(undoStack.current.length > 1);
    setCanRedo(false);
    updateEntries();
  }, [canvas, updateEntries]);

  const undo = useCallback(async () => {
    if (!canvas || undoStack.current.length <= 1) return;

    isRestoring.current = true;

    const current = undoStack.current.pop()!;
    redoStack.current.push(current);

    const previous = undoStack.current[undoStack.current.length - 1];
    if (previous) {
      await canvas.loadFromJSON(JSON.parse(previous.json));
      canvas.renderAll();
    }

    setCanUndo(undoStack.current.length > 1);
    setCanRedo(redoStack.current.length > 0);
    isRestoring.current = false;
    updateEntries();
  }, [canvas, updateEntries]);

  const redo = useCallback(async () => {
    if (!canvas || redoStack.current.length === 0) return;

    isRestoring.current = true;

    const next = redoStack.current.pop()!;
    undoStack.current.push(next);

    await canvas.loadFromJSON(JSON.parse(next.json));
    canvas.renderAll();

    setCanUndo(undoStack.current.length > 1);
    setCanRedo(redoStack.current.length > 0);
    isRestoring.current = false;
    updateEntries();
  }, [canvas, updateEntries]);

  const jumpTo = useCallback(async (index: number) => {
    if (!canvas || index < 0 || index >= undoStack.current.length) return;

    isRestoring.current = true;

    // Move entries after index to redo stack
    const removed = undoStack.current.splice(index + 1);
    redoStack.current.push(...removed.reverse());

    const target = undoStack.current[undoStack.current.length - 1];
    if (target) {
      await canvas.loadFromJSON(JSON.parse(target.json));
      canvas.renderAll();
    }

    setCanUndo(undoStack.current.length > 1);
    setCanRedo(redoStack.current.length > 0);
    isRestoring.current = false;
    updateEntries();
  }, [canvas, updateEntries]);

  const initHistory = useCallback(() => {
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    undoStack.current = [{ json, label: "Initial State", timestamp: Date.now() }];
    redoStack.current = [];
    setCanUndo(false);
    setCanRedo(false);
    updateEntries();
  }, [canvas, updateEntries]);

  return { saveState, undo, redo, canUndo, canRedo, initHistory, entries, currentIndex, jumpTo };
}
