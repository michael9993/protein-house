import { useState, useCallback, useEffect } from "react";
import * as fabric from "fabric";

interface FiltersPanelProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.FabricObject | null;
}

interface FilterState {
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotation: number;
  noise: number;
  pixelate: number;
  grayscale: boolean;
  sepia: boolean;
  invert: boolean;
}

const DEFAULT_FILTERS: FilterState = {
  blur: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hueRotation: 0,
  noise: 0,
  pixelate: 1,
  grayscale: false,
  sepia: false,
  invert: false,
};

export function FiltersPanel({ canvas, selectedObject }: FiltersPanelProps) {
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });
  const isImage = selectedObject?.type === "image";

  // Read current filters when selection changes
  useEffect(() => {
    if (!isImage) {
      setFilters({ ...DEFAULT_FILTERS });
      return;
    }
    // Reset to defaults when selecting a new image
    setFilters({ ...DEFAULT_FILTERS });
  }, [selectedObject, isImage]);

  const applyFilters = useCallback(
    (state: FilterState) => {
      if (!canvas || !selectedObject || !isImage) return;
      const img = selectedObject as fabric.FabricImage;

      const newFilters: fabric.BaseFilter[] = [];

      if (state.blur > 0) {
        newFilters.push(new fabric.filters.Blur({ blur: state.blur }));
      }
      if (state.brightness !== 0) {
        newFilters.push(new fabric.filters.Brightness({ brightness: state.brightness }));
      }
      if (state.contrast !== 0) {
        newFilters.push(new fabric.filters.Contrast({ contrast: state.contrast }));
      }
      if (state.saturation !== 0) {
        newFilters.push(new fabric.filters.Saturation({ saturation: state.saturation }));
      }
      if (state.hueRotation !== 0) {
        newFilters.push(new fabric.filters.HueRotation({ rotation: state.hueRotation }));
      }
      if (state.noise > 0) {
        newFilters.push(new fabric.filters.Noise({ noise: state.noise }));
      }
      if (state.pixelate > 1) {
        newFilters.push(new fabric.filters.Pixelate({ blocksize: state.pixelate }));
      }
      if (state.grayscale) {
        newFilters.push(new fabric.filters.Grayscale());
      }
      if (state.sepia) {
        // Sepia via ColorMatrix
        newFilters.push(new fabric.filters.Grayscale({ mode: "luminosity" }));
        newFilters.push(new fabric.filters.ColorMatrix({
          matrix: [
            1.2, 0.1, 0, 0, 0,
            0.1, 0.9, 0, 0, 0,
            0, 0.1, 0.7, 0, 0,
            0, 0, 0, 1, 0,
          ],
        }));
      }
      if (state.invert) {
        newFilters.push(new fabric.filters.Invert());
      }

      img.filters = newFilters;
      img.applyFilters();
      canvas.renderAll();
    },
    [canvas, selectedObject, isImage]
  );

  const updateFilter = useCallback(
    (key: keyof FilterState, value: number | boolean) => {
      const newState = { ...filters, [key]: value };
      setFilters(newState);
      applyFilters(newState);
    },
    [filters, applyFilters]
  );

  const handleReset = useCallback(() => {
    const defaultState = { ...DEFAULT_FILTERS };
    setFilters(defaultState);
    applyFilters(defaultState);
  }, [applyFilters]);

  if (!isImage) {
    return (
      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Filters</h4>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Select an image to apply filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Filters</h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Real-time image filters (client-side)
        </p>
      </div>

      {/* Slider Filters */}
      <SliderFilter label="Blur" value={filters.blur} min={0} max={1} step={0.01}
        format={(v) => v > 0 ? `${Math.round(v * 100)}%` : "Off"}
        onChange={(v) => updateFilter("blur", v)} />

      <SliderFilter label="Brightness" value={filters.brightness} min={-1} max={1} step={0.05}
        format={(v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`}
        onChange={(v) => updateFilter("brightness", v)} />

      <SliderFilter label="Contrast" value={filters.contrast} min={-1} max={1} step={0.05}
        format={(v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`}
        onChange={(v) => updateFilter("contrast", v)} />

      <SliderFilter label="Saturation" value={filters.saturation} min={-1} max={1} step={0.05}
        format={(v) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`}
        onChange={(v) => updateFilter("saturation", v)} />

      <SliderFilter label="Hue" value={filters.hueRotation} min={0} max={2} step={0.05}
        format={(v) => v > 0 ? `${Math.round(v * 180)}°` : "0°"}
        onChange={(v) => updateFilter("hueRotation", v)} />

      <SliderFilter label="Noise" value={filters.noise} min={0} max={500} step={10}
        format={(v) => v > 0 ? `${v}` : "Off"}
        onChange={(v) => updateFilter("noise", v)} />

      <SliderFilter label="Pixelate" value={filters.pixelate} min={1} max={20} step={1}
        format={(v) => v > 1 ? `${v}px` : "Off"}
        onChange={(v) => updateFilter("pixelate", v)} />

      <div className="w-full h-px bg-border my-1" />

      {/* Toggle Filters */}
      <ToggleFilter label="Grayscale" checked={filters.grayscale}
        onChange={(v) => updateFilter("grayscale", v)} />

      <ToggleFilter label="Sepia" checked={filters.sepia}
        onChange={(v) => updateFilter("sepia", v)} />

      <ToggleFilter label="Invert" checked={filters.invert}
        onChange={(v) => updateFilter("invert", v)} />

      <button
        onClick={handleReset}
        className="w-full mt-2 px-3 py-1.5 text-xs rounded-md border hover:bg-accent"
      >
        Reset All
      </button>
    </div>
  );
}

function SliderFilter({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground flex justify-between">
        <span>{label}</span>
        <span>{format(value)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 mt-0.5"
      />
    </div>
  );
}

function ToggleFilter({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-0.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded"
      />
    </label>
  );
}
