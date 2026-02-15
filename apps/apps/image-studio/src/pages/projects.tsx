import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import { get } from "idb-keyval";

import { AppLayout } from "@/components/layout/AppLayout";
import { useProjects } from "@/modules/projects/useProjects";
import type { Project } from "@/modules/projects/types";
import { getAspectRatioLabel } from "@/components/editor/utils/canvasPresets";

export default function ProjectsPage() {
  const router = useRouter();
  const {
    projects,
    loaded,
    removeProject,
    renameProject,
  } = useProjects();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Check for draft on mount
  useState(() => {
    get<{ canvasJson: object; savedAt: number }>("image-studio-draft").then(
      (draft) => {
        if (draft) setHasDraft(true);
      },
    );
  });

  const handleOpenProject = useCallback(
    (project: Project) => {
      sessionStorage.setItem(
        "image-studio-pending-project",
        JSON.stringify(project),
      );
      router.push("/editor");
    },
    [router],
  );

  const handleRenameSubmit = useCallback(
    async (id: string) => {
      if (renameValue.trim()) {
        await renameProject(id, renameValue.trim());
      }
      setRenamingId(null);
    },
    [renameValue, renameProject],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await removeProject(id);
      setDeletingId(null);
    },
    [removeProject],
  );

  const handleRecoverDraft = useCallback(() => {
    router.push("/editor");
  }, [router]);

  function formatRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  if (!loaded) {
    return (
      <AppLayout
        activePage="projects"
        title="Projects"
        description="Your saved canvas projects"
      >
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      activePage="projects"
      title="Projects"
      description="Your saved canvas projects"
      actions={
        <button
          onClick={() => router.push("/editor")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <PlusIcon />
          New Project
        </button>
      }
    >
      {projects.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">
            No saved projects yet
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Open the Editor, create a design, and save it as a project.
          </p>
          <button
            onClick={() => router.push("/editor")}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Open Editor
          </button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group rounded-lg border hover:border-primary/50 transition-colors overflow-hidden"
            >
              <button
                onClick={() => handleOpenProject(project)}
                className="w-full text-left"
              >
                <div className="aspect-video bg-muted/30 flex items-center justify-center overflow-hidden">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No preview
                    </span>
                  )}
                </div>
              </button>

              <div className="p-3">
                {renamingId === project.id ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameSubmit(project.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit(project.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="w-full px-2 py-1 text-sm rounded border bg-background"
                    autoFocus
                  />
                ) : (
                  <h3 className="text-sm font-medium truncate">
                    {project.name}
                  </h3>
                )}

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {project.canvasWidth}x{project.canvasHeight}
                  </span>
                  <span className="text-[10px] text-muted-foreground opacity-60">
                    ({getAspectRatioLabel(project.canvasWidth, project.canvasHeight)})
                  </span>
                  <span className="text-[10px] text-muted-foreground ms-auto">
                    {formatRelativeTime(project.updatedAt)}
                  </span>
                </div>

                <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenProject(project)}
                    className="flex-1 px-2 py-1 text-[10px] rounded border hover:bg-accent"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => {
                      setRenamingId(project.id);
                      setRenameValue(project.name);
                    }}
                    className="px-2 py-1 text-[10px] rounded border hover:bg-accent"
                  >
                    Rename
                  </button>
                  {deletingId === project.id ? (
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="px-2 py-1 text-[10px] rounded border border-destructive bg-destructive text-destructive-foreground"
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeletingId(project.id)}
                      className="px-2 py-1 text-[10px] rounded border border-destructive text-destructive hover:bg-destructive/10"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Draft recovery */}
      {hasDraft && (
        <div className="mt-8 border-t pt-6">
          <h2 className="text-sm font-semibold mb-2">Recover Draft</h2>
          <p className="text-xs text-muted-foreground mb-3">
            You have an unsaved draft from your last session.
          </p>
          <button
            onClick={handleRecoverDraft}
            className="px-3 py-1.5 text-xs rounded-md border hover:bg-accent"
          >
            Recover Last Draft
          </button>
        </div>
      )}
    </AppLayout>
  );
}

function PlusIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
