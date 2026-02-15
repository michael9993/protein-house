import { get, set } from "idb-keyval";
import type { SavedComponent, BrandKit } from "./types";

const COMPONENTS_KEY = "image-studio-components";
const BRAND_KITS_KEY = "image-studio-brand-kits";

// ─── Components ─────────────────────────────────────────────

export async function getComponents(): Promise<SavedComponent[]> {
  return (await get<SavedComponent[]>(COMPONENTS_KEY)) ?? [];
}

export async function saveComponent(component: SavedComponent): Promise<void> {
  const existing = await getComponents();
  existing.push(component);
  await set(COMPONENTS_KEY, existing);
}

export async function deleteComponent(id: string): Promise<void> {
  const existing = await getComponents();
  await set(
    COMPONENTS_KEY,
    existing.filter((c) => c.id !== id),
  );
}

export async function renameComponent(id: string, name: string): Promise<void> {
  const existing = await getComponents();
  const idx = existing.findIndex((c) => c.id === id);
  if (idx !== -1) {
    existing[idx] = { ...existing[idx], name };
    await set(COMPONENTS_KEY, existing);
  }
}

// ─── Brand Kits ─────────────────────────────────────────────

export async function getBrandKits(): Promise<BrandKit[]> {
  return (await get<BrandKit[]>(BRAND_KITS_KEY)) ?? [];
}

export async function saveBrandKit(kit: BrandKit): Promise<void> {
  const existing = await getBrandKits();
  const idx = existing.findIndex((k) => k.id === kit.id);
  if (idx !== -1) {
    existing[idx] = kit;
  } else {
    existing.push(kit);
  }
  await set(BRAND_KITS_KEY, existing);
}

export async function deleteBrandKit(id: string): Promise<void> {
  const existing = await getBrandKits();
  await set(
    BRAND_KITS_KEY,
    existing.filter((k) => k.id !== id),
  );
}
