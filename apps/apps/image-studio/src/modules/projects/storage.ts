import { get, set } from "idb-keyval";
import type { Project } from "./types";

const PROJECTS_KEY = "image-studio-projects";

export async function getProjects(): Promise<Project[]> {
  return (await get<Project[]>(PROJECTS_KEY)) ?? [];
}

export async function getProject(id: string): Promise<Project | undefined> {
  const projects = await getProjects();
  return projects.find((p) => p.id === id);
}

export async function saveProject(project: Project): Promise<void> {
  const existing = await getProjects();
  const idx = existing.findIndex((p) => p.id === project.id);
  if (idx !== -1) {
    existing[idx] = project;
  } else {
    existing.unshift(project);
  }
  await set(PROJECTS_KEY, existing);
}

export async function deleteProject(id: string): Promise<void> {
  const existing = await getProjects();
  await set(
    PROJECTS_KEY,
    existing.filter((p) => p.id !== id),
  );
}

export async function renameProject(id: string, name: string): Promise<void> {
  const existing = await getProjects();
  const idx = existing.findIndex((p) => p.id === id);
  if (idx !== -1) {
    existing[idx] = { ...existing[idx], name };
    await set(PROJECTS_KEY, existing);
  }
}
