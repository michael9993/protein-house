import type { Template } from "@/modules/templates/types";

interface TemplateCardProps {
  template: Template;
  onClick: (template: Template) => void;
}

export function TemplateCard({ template, onClick }: TemplateCardProps) {
  const aspectRatio = template.width / template.height;

  return (
    <button
      onClick={() => onClick(template)}
      className="group text-left rounded-lg border bg-background p-2 hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div
        className="rounded-md overflow-hidden mb-2 bg-muted flex items-center justify-center"
        style={{ aspectRatio: Math.min(Math.max(aspectRatio, 0.5), 2) }}
      >
        <TemplateMiniPreview template={template} />
      </div>
      <p className="text-sm font-medium truncate">{template.name}</p>
      <p className="text-[10px] text-muted-foreground">
        {template.width} x {template.height}
      </p>
    </button>
  );
}

function TemplateMiniPreview({ template }: { template: Template }) {
  const scale = 120 / Math.max(template.width, template.height);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: template.width * scale,
        height: template.height * scale,
        backgroundColor: template.backgroundColor,
      }}
    >
      {template.layers.map((layer, i) => {
        const style: React.CSSProperties = {
          position: "absolute",
          left: layer.left * scale,
          top: layer.top * scale,
          width: layer.width * scale,
          height: layer.height * scale,
          opacity: layer.opacity,
        };

        if (layer.type === "rect") {
          return (
            <div
              key={i}
              style={{
                ...style,
                backgroundColor: layer.fill,
                borderRadius: 1,
              }}
            />
          );
        }

        if (layer.type === "text") {
          return (
            <div
              key={i}
              style={{
                ...style,
                fontSize: Math.max((layer.fontSize ?? 12) * scale, 3),
                fontWeight: layer.fontWeight,
                color: layer.fill,
                textAlign: layer.textAlign as any,
                overflow: "hidden",
                lineHeight: 1.2,
              }}
            >
              {layer.text}
            </div>
          );
        }

        if (layer.type === "image") {
          return (
            <div
              key={i}
              style={{
                ...style,
                backgroundColor: "#e5e5e5",
                border: "1px dashed #ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                style={{ width: "30%", height: "30%", opacity: 0.3 }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
