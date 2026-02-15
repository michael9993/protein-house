import { useState, useEffect, useCallback } from "react";
import type { Project } from "./types";
import {
  getProjects as getProjectsStorage,
  saveProject as saveProjectStorage,
  deleteProject as deleteProjectStorage,
  renameProject as renameProjectStorage,
} from "./storage";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    getProjectsStorage().then((p) => {
      setProjects(p);
      setLoaded(true);
    });
  }, []);

  const createProject = useCallback(
    async (
      name: string,
      canvasJson: object,
      width: number,
      height: number,
      thumbnail: string,
    ) => {
      const project: Project = {
        id: crypto.randomUUID(),
        name,
        canvasJson,
        canvasWidth: width,
        canvasHeight: height,
        thumbnail,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveProjectStorage(project);
      setProjects((prev) => [project, ...prev]);
      setActiveProjectId(project.id);
      return project;
    },
    [],
  );

  const updateProject = useCallback(
    async (
      id: string,
      canvasJson: object,
      width: number,
      height: number,
      thumbnail: string,
    ) => {
      setProjects((prev) => {
        const updated = prev.map((p) =>
          p.id === id
            ? {
                ...p,
                canvasJson,
                canvasWidth: width,
                canvasHeight: height,
                thumbnail,
                updatedAt: Date.now(),
              }
            : p,
        );
        const found = updated.find((p) => p.id === id);
        if (found) saveProjectStorage(found);
        return updated;
      });
    },
    [],
  );

  const removeProject = useCallback(
    async (id: string) => {
      await deleteProjectStorage(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProjectId === id) setActiveProjectId(null);
    },
    [activeProjectId],
  );

  const rename = useCallback(async (id: string, name: string) => {
    await renameProjectStorage(id, name);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p)),
    );
  }, []);

  return {
    projects,
    loaded,
    activeProjectId,
    setActiveProjectId,
    createProject,
    updateProject,
    removeProject,
    renameProject: rename,
  };
}
