import { useState, useEffect, useCallback } from "react";
import type { SavedComponent, BrandKit } from "./types";
import {
  getComponents,
  saveComponent as dbSaveComponent,
  deleteComponent as dbDeleteComponent,
  renameComponent as dbRenameComponent,
  getBrandKits,
  saveBrandKit as dbSaveBrandKit,
  deleteBrandKit as dbDeleteBrandKit,
} from "./storage";

export function useComponentStorage() {
  const [components, setComponents] = useState<SavedComponent[]>([]);
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    Promise.all([getComponents(), getBrandKits()]).then(([c, b]) => {
      setComponents(c);
      setBrandKits(b);
      setLoaded(true);
    });
  }, []);

  // ─── Component CRUD ───────────────────────────────────────

  const addComponent = useCallback(async (comp: SavedComponent) => {
    await dbSaveComponent(comp);
    setComponents((prev) => [...prev, comp]);
  }, []);

  const removeComponent = useCallback(async (id: string) => {
    await dbDeleteComponent(id);
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateComponentName = useCallback(async (id: string, name: string) => {
    await dbRenameComponent(id, name);
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c)),
    );
  }, []);

  // ─── Brand Kit CRUD ───────────────────────────────────────

  const addBrandKit = useCallback(async (kit: BrandKit) => {
    await dbSaveBrandKit(kit);
    setBrandKits((prev) => {
      const idx = prev.findIndex((k) => k.id === kit.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = kit;
        return updated;
      }
      return [...prev, kit];
    });
  }, []);

  const removeBrandKit = useCallback(async (id: string) => {
    await dbDeleteBrandKit(id);
    setBrandKits((prev) => prev.filter((k) => k.id !== id));
  }, []);

  return {
    components,
    brandKits,
    loaded,
    addComponent,
    removeComponent,
    updateComponentName,
    addBrandKit,
    removeBrandKit,
  };
}
