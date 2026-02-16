import { useEffect, useRef, useCallback, useState } from "react";
import { get, set, del } from "idb-keyval";
import type * as fabric from "fabric";
import { saveProject } from "@/modules/projects/storage";
import { getProject } from "@/modules/projects/storage";

const AUTOSAVE_KEY = "image-studio-draft";
const AUTOSAVE_INTERVAL = 10_000; // 10 seconds

export interface DraftData {
  canvasJson: object;
  savedAt: number;
}

export function useAutoSave(
  canvas: fabric.Canvas | null,
  activeProjectId?: string | null,
  docWidth?: number,
  docHeight?: number,
) {
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check for existing draft on mount
  useEffect(() => {
    get<DraftData>(AUTOSAVE_KEY).then((draft) => {
      if (draft) {
        setHasDraft(true);
      }
    });
  }, []);

  // Save current state to IndexedDB (draft or project)
  const saveDraft = useCallback(() => {
    if (!canvas) return;

    const objects = canvas.getObjects().filter((o) => !(o as any).__pageBg);
    if (objects.length === 0) return;

    const json = canvas.toJSON();

    // If a project is active, save to project storage
    if (activeProjectId) {
      getProject(activeProjectId).then((existing) => {
        if (existing) {
          const thumbnail = canvas.toDataURL({
            format: "png",
            multiplier: 0.2,
          });
          saveProject({
            ...existing,
            canvasJson: json,
            canvasWidth: docWidth ?? existing.canvasWidth,
            canvasHeight: docHeight ?? existing.canvasHeight,
            thumbnail,
            updatedAt: Date.now(),
          }).then(() => {
            setLastSaved(new Date());
          });
        }
      });
      return;
    }

    // No active project — save as anonymous draft
    const draft: DraftData = {
      canvasJson: json,
      savedAt: Date.now(),
    };

    set(AUTOSAVE_KEY, draft).then(() => {
      setLastSaved(new Date());
      setHasDraft(true);
    });
  }, [canvas, activeProjectId, docWidth, docHeight]);

  // Restore draft from IndexedDB
  const restoreDraft = useCallback(async (): Promise<boolean> => {
    if (!canvas) return false;

    const draft = await get<DraftData>(AUTOSAVE_KEY);
    if (!draft?.canvasJson) return false;

    await canvas.loadFromJSON(draft.canvasJson);
    canvas.renderAll();
    return true;
  }, [canvas]);

  // Clear saved draft
  const clearDraft = useCallback(async () => {
    await del(AUTOSAVE_KEY);
    setHasDraft(false);
    setLastSaved(null);
  }, []);

  // Auto-save on interval
  useEffect(() => {
    if (!canvas) return;

    intervalRef.current = setInterval(() => {
      saveDraft();
    }, AUTOSAVE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [canvas, saveDraft]);

  return {
    hasDraft,
    lastSaved,
    saveDraft,
    restoreDraft,
    clearDraft,
  };
}
