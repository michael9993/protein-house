import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import { z } from "zod";
import { Paintbrush, RotateCcw, Eye, EyeOff, MousePointer2 } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { LoadingState } from "@/components/shared/LoadingState";
import { useConfigPage } from "@/hooks/useConfigPage";
import { usePreview } from "@/hooks/usePreview";
import { PreviewPane } from "@/components/preview/PreviewPane";
import { PreviewToolbar } from "@/components/preview/PreviewToolbar";
import { ComponentStyleOverrideSchema } from "@saleor/apps-storefront-config";
import { ComponentTree } from "@/components/pages/component-designer/ComponentTree";
import { StylePropertiesPanel } from "@/components/pages/component-designer/StylePropertiesPanel";
import { getComponentByKey, PAGE_PREVIEW_ROUTES } from "@/lib/component-registry";
import { PAGE_REGISTRY } from "@/lib/page-registry";

import { nestOverrides, flattenOverrides } from "@/lib/override-helpers";

// Flatten nested form data back to dot keys + strip empty strings before Zod validation
function cleanOverrides(data: unknown): unknown {
  if (data == null || typeof data !== "object") return data;
  // Form data is nested; flatten back to dot-key format for the backend schema
  const flat = flattenOverrides(data as Record<string, unknown>);
  const cleaned: Record<string, Record<string, unknown>> = {};
  for (const [key, style] of Object.entries(flat)) {
    const cleanedStyle: Record<string, unknown> = {};
    for (const [prop, val] of Object.entries(style)) {
      if (val !== "" && val != null) {
        cleanedStyle[prop] = val;
      }
    }
    if (Object.keys(cleanedStyle).length > 0) {
      cleaned[key] = cleanedStyle;
    }
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

// Form schema: just the componentOverrides section
const DesignerFormSchema = z.object({
  componentOverrides: z.preprocess(cleanOverrides, z.record(z.string(), ComponentStyleOverrideSchema).optional()),
});

type DesignerFormData = z.infer<typeof DesignerFormSchema>;

const STOREFRONT_URL = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000")
  : "http://localhost:3000";

function ComponentDesignerPage() {
  const router = useRouter();
  const channelSlug = router.query.channelSlug as string;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [deviceSize, setDeviceSize] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [formError, setFormError] = useState<string | null>(null);

  const { config, isNotReady, form, onSubmit, saveStatus } = useConfigPage({
    schema: DesignerFormSchema,
    sections: ["componentOverrides"],
    extractFormData: (c) => ({
      componentOverrides: nestOverrides(c.componentOverrides ?? {}) as any,
    }),
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isDirty },
  } = form;

  // Preview hook — onComponentSelected fires on every click (even re-clicks on same component)
  const handlePreviewSelect = useCallback((key: string) => {
    setSelectedKey(key);
  }, []);

  const {
    iframeRef, isReady, sendConfig, navigate, refresh,
    selectedFromPreview, highlightComponent, initOverlay,
    overlayEnabled, setOverlayEnabled, sendOverrideKeys, onSectionsReordered,
  } = usePreview({
    storefrontUrl: STOREFRONT_URL,
    channelSlug: channelSlug || "default-channel",
    onComponentSelected: handlePreviewSelect,
  });

  // Track which components have overrides for tree indicators
  // Form data is nested: { homepage: { hero: { bg: "#f" } } }
  // We reconstruct dot-keys: "homepage.hero"
  const overrides = watch("componentOverrides") ?? {};
  const overriddenKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const [prefix, group] of Object.entries(overrides)) {
      if (!group || typeof group !== "object") continue;
      for (const [suffix, style] of Object.entries(group as Record<string, unknown>)) {
        if (style && typeof style === "object" &&
          Object.values(style as Record<string, unknown>).some((v) => v != null && v !== "")) {
          keys.add(`${prefix}.${suffix}`);
        }
      }
    }
    return keys;
  }, [overrides]);

  // Current page label for breadcrumb
  const viewingPage = useMemo(() => {
    if (!selectedKey) return null;
    const comp = getComponentByKey(selectedKey);
    if (!comp) return null;
    const page = PAGE_REGISTRY.find((p) => p.id === comp.page);
    return page?.label ?? comp.page;
  }, [selectedKey]);

  // Brand color presets from config
  const brandPresets = useMemo(() => {
    if (!config?.branding?.colors) return undefined;
    const c = config.branding.colors;
    const colors = [
      c.primary, c.secondary, c.accent, c.background, c.surface, c.text,
    ].filter((v): v is string => Boolean(v));
    return colors.length > 0 ? colors : undefined;
  }, [config]);

  // Real-time preview: send config updates as form changes
  // Flatten nested form data back to dot-keys before sending to storefront
  useEffect(() => {
    if (!previewOpen) return;
    const sub = watch((data) => {
      const nested = (data.componentOverrides ?? {}) as Record<string, unknown>;
      sendConfig({ componentOverrides: flattenOverrides(nested) } as any);
    });
    return () => sub.unsubscribe();
  }, [watch, sendConfig, previewOpen]);

  // Auto-navigate iframe when selected component changes
  useEffect(() => {
    if (!selectedKey || !isReady || !previewOpen) return;
    const comp = getComponentByKey(selectedKey);
    if (!comp) return;
    const route = PAGE_PREVIEW_ROUTES[comp.page]?.replace("{channel}", channelSlug || "default-channel");
    if (route) navigate(route);
  }, [selectedKey, isReady, channelSlug, navigate, previewOpen]);

  // Component selection from preview is handled by onComponentSelected callback above
  // (callback fires on every click, unlike state-based effects which skip duplicate values)

  // Highlight component in preview when tree selection changes
  // Skip if the selection just came from a preview click (avoid roundtrip)
  useEffect(() => {
    if (selectedKey && isReady && previewOpen && selectedKey !== selectedFromPreview) {
      highlightComponent(selectedKey);
    }
  }, [selectedKey, isReady, highlightComponent, previewOpen, selectedFromPreview]);

  // Initialize overlay when iframe becomes ready
  useEffect(() => {
    if (isReady) {
      initOverlay();
    }
  }, [isReady, initOverlay]);

  // Send override indicator keys to preview overlay
  useEffect(() => {
    if (isReady) {
      sendOverrideKeys(Array.from(overriddenKeys));
    }
  }, [isReady, overriddenKeys, sendOverrideKeys]);

  // Handle section reorder from preview drag-and-drop
  useEffect(() => {
    if (onSectionsReordered) {
      sendConfig({ homepage: { sectionOrder: onSectionsReordered } } as any);
    }
  }, [onSectionsReordered, sendConfig]);

  // Reset a single component's overrides
  const handleResetComponent = useCallback(
    (key: string) => {
      setValue(`componentOverrides.${key}` as any, undefined as any, { shouldDirty: true });
    },
    [setValue]
  );

  // Reset all overrides
  const handleResetAll = useCallback(() => {
    setValue("componentOverrides", undefined as any, { shouldDirty: true });
  }, [setValue]);

  if (isNotReady) {
    return (
      <AppShell channelSlug="" activePage="component-designer" title="Component Designer">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={channelSlug}
      channelName={config?.store.name}
      activePage="component-designer"
      title="Component Designer"
    >
      <form onSubmit={handleSubmit(
        (data) => { setFormError(null); return onSubmit(data); },
        (errs) => {
          console.error("[ComponentDesigner] Form validation errors:", errs);
          setFormError(`Validation failed: ${Object.keys(errs).join(", ")}`);
        }
      )} className="flex h-full flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
          <div className="flex items-center gap-2">
            <Paintbrush className="h-4 w-4 text-neutral-500" />
            <h2 className="text-sm font-semibold text-neutral-900">Component Designer</h2>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {overriddenKeys.size} override{overriddenKeys.size !== 1 ? "s" : ""}
            </span>
            {viewingPage && (
              <span className="text-xs text-neutral-400">
                · Viewing: {viewingPage}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setOverlayEnabled(!overlayEnabled)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
                overlayEnabled
                  ? "bg-blue-50 text-blue-700"
                  : "text-neutral-500 hover:bg-neutral-100"
              }`}
              title={overlayEnabled ? "Disable visual selection" : "Enable visual selection"}
            >
              <MousePointer2 className="h-3.5 w-3.5" />
              Visual Select
            </button>
            <button
              type="button"
              onClick={() => setPreviewOpen(!previewOpen)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
              title={previewOpen ? "Hide preview" : "Show preview"}
            >
              {previewOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              Preview
            </button>
            {overriddenKeys.size > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
              >
                <RotateCcw className="h-3 w-3" />
                Reset All
              </button>
            )}
          </div>
        </div>

        {/* Instruction banner for visual selection */}
        {overlayEnabled && !selectedKey && previewOpen && (
          <div className="border-b border-blue-100 bg-blue-50 px-4 py-1.5 text-xs text-blue-700">
            Click any component in the preview to select and edit it
          </div>
        )}

        {/* 3-panel layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Component Tree */}
          <div className="w-56 shrink-0 overflow-y-auto border-r border-neutral-200 bg-neutral-50 p-2">
            <ComponentTree
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              overriddenKeys={overriddenKeys}
            />
          </div>

          {/* Center: Properties Panel */}
          <div className={previewOpen ? "w-80 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white" : "flex-1 overflow-y-auto bg-white"}>
            <StylePropertiesPanel
              key={selectedKey ?? "__none"}
              selectedKey={selectedKey}
              control={control}
              register={register}
              errors={errors}
              onResetComponent={handleResetComponent}
              setValue={setValue}
              getValues={getValues}
              brandPresets={brandPresets}
            />
          </div>

          {/* Right: Live Preview */}
          {previewOpen && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <PreviewToolbar
                deviceSize={deviceSize}
                onDeviceSizeChange={setDeviceSize}
                onRefresh={refresh}
                isReady={isReady}
                storefrontUrl={STOREFRONT_URL}
              />
              <PreviewPane
                iframeRef={iframeRef as React.RefObject<HTMLIFrameElement>}
                isReady={isReady}
                storefrontUrl={STOREFRONT_URL}
                channelSlug={channelSlug || "default-channel"}
                deviceSize={deviceSize}
              />
            </div>
          )}
        </div>

        {/* Form error display */}
        {formError && (
          <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
            {formError}
            <button type="button" onClick={() => setFormError(null)} className="ms-2 underline">dismiss</button>
          </div>
        )}

        {/* Save bar */}
        <SaveBar
          isDirty={isDirty}
          saveStatus={saveStatus}
          onReset={() => {
            setFormError(null);
            if (config) {
              form.reset({ componentOverrides: nestOverrides(config.componentOverrides ?? {}) } as any);
            }
          }}
          onSubmit={handleSubmit(
            (data) => { setFormError(null); return onSubmit(data); },
            (errs) => {
              console.error("[ComponentDesigner] Form validation errors:", errs);
              setFormError(`Validation failed: ${Object.keys(errs).join(", ")}`);
            }
          )}
        />
      </form>
    </AppShell>
  );
}

export default ComponentDesignerPage;
