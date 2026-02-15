import { useState, useCallback } from "react";
import { useRouter } from "next/router";

import { AppLayout } from "@/components/layout/AppLayout";
import { useComponentStorage } from "@/modules/components/useComponentStorage";
import type { SavedComponent } from "@/modules/components/types";
import { COMPONENT_CATEGORIES } from "@/modules/components/types";

type Tab = "components" | "brand-kits";

export default function LibraryPage() {
  const router = useRouter();
  const {
    components,
    brandKits,
    loaded,
    removeComponent,
    updateComponentName,
    removeBrandKit,
  } = useComponentStorage();

  const [activeTab, setActiveTab] = useState<Tab>("components");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filteredComponents =
    categoryFilter === "all"
      ? components
      : components.filter((c) => c.category === categoryFilter);

  const handleInsertComponent = useCallback(
    (comp: SavedComponent) => {
      sessionStorage.setItem(
        "image-studio-pending-component",
        JSON.stringify(comp),
      );
      router.push("/editor");
    },
    [router],
  );

  const handleRenameSubmit = useCallback(
    async (id: string) => {
      if (renameValue.trim()) {
        await updateComponentName(id, renameValue.trim());
      }
      setRenamingId(null);
    },
    [renameValue, updateComponentName],
  );

  if (!loaded) {
    return (
      <AppLayout activePage="library" title="Library" description="Your saved design components and brand kits">
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">Loading library...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activePage="library" title="Library" description="Your saved design components and brand kits">
      {/* Tab bar */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab("components")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "components"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Components ({components.length})
        </button>
        <button
          onClick={() => setActiveTab("brand-kits")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "brand-kits"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Brand Kits ({brandKits.length})
        </button>
      </div>

      {activeTab === "components" && (
        <>
          {/* Category filter */}
          <div className="flex gap-1.5 mb-4 flex-wrap">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                categoryFilter === "all"
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent"
              }`}
            >
              All
            </button>
            {COMPONENT_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  categoryFilter === cat.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-accent"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Components grid */}
          {filteredComponents.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                No saved components yet
              </p>
              <p className="text-xs text-muted-foreground">
                Open the Editor, select objects, and save them as reusable components.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredComponents.map((comp) => (
                <div
                  key={comp.id}
                  className="group rounded-lg border p-3 hover:border-primary/50 transition-colors"
                >
                  <button
                    onClick={() => handleInsertComponent(comp)}
                    className="w-full text-left"
                  >
                    <div className="aspect-square bg-muted/30 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                      {comp.thumbnail ? (
                        <img
                          src={comp.thumbnail}
                          alt={comp.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No preview
                        </span>
                      )}
                    </div>
                  </button>

                  {renamingId === comp.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRenameSubmit(comp.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameSubmit(comp.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="w-full px-2 py-1 text-xs rounded border bg-background"
                      autoFocus
                    />
                  ) : (
                    <p className="text-xs font-medium truncate">{comp.name}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {comp.category}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleInsertComponent(comp)}
                      className="flex-1 px-2 py-1 text-[10px] rounded border hover:bg-accent"
                    >
                      Use in Editor
                    </button>
                    <button
                      onClick={() => {
                        setRenamingId(comp.id);
                        setRenameValue(comp.name);
                      }}
                      className="px-2 py-1 text-[10px] rounded border hover:bg-accent"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => removeComponent(comp.id)}
                      className="px-2 py-1 text-[10px] rounded border border-destructive text-destructive hover:bg-destructive/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "brand-kits" && (
        <>
          {brandKits.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                No brand kits yet
              </p>
              <p className="text-xs text-muted-foreground">
                Open the Editor, click the Social tool, and create a brand kit with your colors and fonts.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {brandKits.map((kit) => (
                <div
                  key={kit.id}
                  className="rounded-lg border p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {kit.logoBase64 && (
                      <img
                        src={kit.logoBase64}
                        alt={kit.name}
                        className="h-8 w-8 object-contain rounded"
                      />
                    )}
                    <h3 className="text-sm font-medium">{kit.name}</h3>
                  </div>

                  {/* Color swatches */}
                  <div className="flex gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ background: kit.primaryColor }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Primary
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ background: kit.secondaryColor }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Secondary
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ background: kit.accentColor }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Accent
                      </span>
                    </div>
                  </div>

                  {/* Fonts */}
                  <div className="text-[10px] text-muted-foreground mb-3">
                    <span style={{ fontFamily: kit.primaryFont }}>
                      {kit.primaryFont}
                    </span>
                    {" / "}
                    <span style={{ fontFamily: kit.secondaryFont }}>
                      {kit.secondaryFont}
                    </span>
                  </div>

                  <button
                    onClick={() => removeBrandKit(kit.id)}
                    className="px-3 py-1 text-[10px] rounded border border-destructive text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
