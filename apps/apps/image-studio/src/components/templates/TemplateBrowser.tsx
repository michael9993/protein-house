import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import type { Template, TemplateCategory } from "@/modules/templates/types";
import { TEMPLATE_CATEGORIES } from "@/modules/templates/types";
import { BUILT_IN_TEMPLATES } from "@/modules/templates/built-in";
import { TemplateCard } from "./TemplateCard";

export function TemplateBrowser() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | "all">("all");

  const filtered = activeCategory === "all"
    ? BUILT_IN_TEMPLATES
    : BUILT_IN_TEMPLATES.filter((t) => t.category === activeCategory);

  const handleSelectTemplate = useCallback(
    (template: Template) => {
      // Store in sessionStorage to avoid AppBridge RoutePropagator stripping the path
      sessionStorage.setItem("image-studio-pending-template", template.id);
      router.push("/editor");
    },
    [router]
  );

  return (
    <div className="p-4">
      {/* Category tabs */}
      <div className="flex gap-1 mb-4 border-b">
        <TabButton
          label="All"
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
          count={BUILT_IN_TEMPLATES.length}
        />
        {TEMPLATE_CATEGORIES.map((cat) => {
          const count = BUILT_IN_TEMPLATES.filter((t) => t.category === cat.value).length;
          return (
            <TabButton
              key={cat.value}
              label={cat.label}
              active={activeCategory === cat.value}
              onClick={() => setActiveCategory(cat.value)}
              count={count}
            />
          );
        })}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onClick={handleSelectTemplate}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
          <p className="text-sm text-muted-foreground">No templates in this category</p>
        </div>
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label} ({count})
    </button>
  );
}
