import { useState, useRef, useEffect } from "react";
import {
  type Control,
  type FieldValues,
  type UseFormSetValue,
  type UseFormGetValues,
  useWatch,
} from "react-hook-form";
import { RotateCcw, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getComponentByKey, COMPONENT_REGISTRY } from "@/lib/component-registry";
import { getNestedOverride } from "@/lib/override-helpers";
import {
  PropertyFieldRenderer,
  PROPERTY_META,
  GROUP_LABELS,
  GROUP_ORDER,
} from "./PropertyFieldRenderer";
import type { ComponentStyleOverride } from "@saleor/apps-storefront-config";

interface StylePropertiesPanelProps<T extends FieldValues> {
  selectedKey: string | null;
  control: Control<T>;
  register: any;
  errors: any;
  onResetComponent: (key: string) => void;
  /** Form setValue for programmatic updates (copy style) */
  setValue?: UseFormSetValue<T>;
  /** Form getValues for reading current overrides */
  getValues?: UseFormGetValues<T>;
  /** Brand color presets from store config */
  brandPresets?: string[];
}

export function StylePropertiesPanel<T extends FieldValues>({
  selectedKey,
  control,
  register,
  errors,
  onResetComponent,
  setValue,
  getValues,
  brandPresets,
}: StylePropertiesPanelProps<T>) {
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const copyMenuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!copyMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (copyMenuRef.current && !copyMenuRef.current.contains(e.target as Node)) {
        setCopyMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [copyMenuOpen]);

  if (!selectedKey) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="text-neutral-400">
          <p className="text-sm font-medium">No component selected</p>
          <p className="mt-1 text-xs">Select a component from the tree to edit its style overrides</p>
        </div>
      </div>
    );
  }

  const component = getComponentByKey(selectedKey);
  if (!component) {
    return (
      <div className="p-4 text-sm text-neutral-500">
        Component &quot;{selectedKey}&quot; not found in registry.
      </div>
    );
  }

  const Icon = component.icon;
  const basePath = `componentOverrides.${selectedKey}`;

  // Group supported properties by their group
  const grouped = new Map<string, (keyof ComponentStyleOverride)[]>();
  for (const prop of component.supportedProperties) {
    const meta = PROPERTY_META[prop];
    if (!meta) continue;
    const group = meta.group;
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(prop);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-neutral-500" />
          <h3 className="text-sm font-semibold text-neutral-900">{component.label}</h3>
        </div>
        <div className="flex items-center gap-1">
          {/* Copy style from another component */}
          {setValue && getValues && (
            <div className="relative" ref={copyMenuRef}>
              <button
                type="button"
                onClick={() => setCopyMenuOpen(!copyMenuOpen)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                title="Copy style from another component"
              >
                <Copy className="h-3 w-3" />
                Copy from
              </button>
              {copyMenuOpen && (
                <CopyStyleMenu
                  targetKey={selectedKey}
                  getValues={getValues}
                  setValue={setValue}
                  onClose={() => setCopyMenuOpen(false)}
                />
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => onResetComponent(selectedKey)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
            title="Reset to global defaults"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Property groups — collapsible */}
      {GROUP_ORDER.map((groupKey) => {
        const props = grouped.get(groupKey);
        if (!props || props.length === 0) return null;

        return (
          <CollapsibleGroup
            key={groupKey}
            groupKey={groupKey}
            label={GROUP_LABELS[groupKey] ?? groupKey}
            properties={props}
            basePath={basePath}
            control={control}
            register={register}
            errors={errors}
            setValue={setValue}
            brandPresets={brandPresets}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible Property Group
// ---------------------------------------------------------------------------

function CollapsibleGroup<T extends FieldValues>({
  groupKey,
  label,
  properties,
  basePath,
  control,
  register,
  errors,
  setValue,
  brandPresets,
}: {
  groupKey: string;
  label: string;
  properties: (keyof ComponentStyleOverride)[];
  basePath: string;
  control: Control<T>;
  register: any;
  errors: any;
  setValue?: UseFormSetValue<T>;
  brandPresets?: string[];
}) {
  const [expanded, setExpanded] = useState(true);

  // Count how many properties have values
  const overrideData = useWatch({ control, name: basePath as any });
  const activeCount = properties.filter((prop) => {
    const val = overrideData?.[prop];
    return val != null && val !== "";
  }).length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 mb-2"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-neutral-400" />
        ) : (
          <ChevronRight className="h-3 w-3 text-neutral-400" />
        )}
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {label}
        </h4>
        <span
          className={cn(
            "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            activeCount > 0
              ? "bg-blue-50 text-blue-600"
              : "bg-neutral-100 text-neutral-400"
          )}
        >
          {activeCount}/{properties.length}
        </span>
      </button>
      {expanded && (
        <div className="flex flex-col gap-3">
          {properties.map((prop) => (
            <PropertyFieldRenderer
              key={String(prop)}
              property={prop}
              basePath={basePath}
              control={control}
              register={register}
              errors={errors}
              setValue={setValue}
              brandPresets={brandPresets}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copy Style Dropdown Menu
// ---------------------------------------------------------------------------

function CopyStyleMenu<T extends FieldValues>({
  targetKey,
  getValues,
  setValue,
  onClose,
}: {
  targetKey: string;
  getValues: UseFormGetValues<T>;
  setValue: UseFormSetValue<T>;
  onClose: () => void;
}) {
  // Find components that have existing overrides (excluding the target)
  // Form data is nested: { homepage: { hero: {...} } } — resolve dot keys
  const allOverrides = (getValues as () => Record<string, unknown>)();
  const overridesRecord =
    (allOverrides as Record<string, Record<string, unknown>>).componentOverrides ?? {};

  const sourceCandidates = COMPONENT_REGISTRY.filter((c) => {
    if (c.configKey === targetKey) return false;
    const style = getNestedOverride(overridesRecord, c.configKey);
    return style && Object.keys(style).length > 0;
  });

  if (sourceCandidates.length === 0) {
    return (
      <div className="absolute end-0 top-full z-10 mt-1 w-56 rounded-md border border-neutral-200 bg-white p-3 shadow-lg">
        <p className="text-xs text-neutral-400">No other components have overrides yet.</p>
      </div>
    );
  }

  const handleCopy = (sourceKey: string) => {
    const sourceOverride = getNestedOverride(overridesRecord, sourceKey);
    if (!sourceOverride) return;
    // Copy each property from source to target
    for (const [prop, value] of Object.entries(sourceOverride)) {
      (setValue as (path: string, value: unknown) => void)(
        `componentOverrides.${targetKey}.${prop}`,
        value
      );
    }
    onClose();
  };

  return (
    <div className="absolute end-0 top-full z-10 mt-1 w-56 max-h-64 overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-lg">
      <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        Copy overrides from
      </p>
      {sourceCandidates.map((c) => {
        const CIcon = c.icon;
        return (
          <button
            key={c.configKey}
            type="button"
            onClick={() => handleCopy(c.configKey)}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50"
          >
            <CIcon className="h-3.5 w-3.5 text-neutral-400" />
            <span>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
