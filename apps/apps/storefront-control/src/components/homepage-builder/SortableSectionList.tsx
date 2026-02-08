import { useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Image,
  ShieldCheck,
  Type,
  Grid3X3,
  Layers,
  Star,
  Megaphone,
  Zap,
  BarChart3,
  MessageSquare,
  Mail,
  Layout,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Controller } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { HomepageSectionId } from "@/modules/config/schema";

// ---------------------------------------------------------------------------
// Section metadata
// ---------------------------------------------------------------------------

interface SectionMeta {
  label: string;
  icon: LucideIcon;
  description: string;
}

const SECTION_META: Record<string, SectionMeta> = {
  hero: { label: "Hero Banner", icon: Image, description: "Main banner at the top" },
  trustStrip: { label: "Trust Strip", icon: ShieldCheck, description: "Trust indicators" },
  marquee: { label: "Marquee", icon: Type, description: "Scrolling announcement" },
  brandGrid: { label: "Brand Partners", icon: Grid3X3, description: "Brand logo grid" },
  categories: { label: "Categories", icon: Layout, description: "Shop by category" },
  trending: { label: "Trending", icon: Star, description: "New arrivals & trending" },
  promotionBanner: { label: "Promotion Banner", icon: Megaphone, description: "Mid-page promo" },
  flashDeals: { label: "Flash Deals", icon: Zap, description: "Time-limited deals" },
  collectionMosaic: { label: "Collection Mosaic", icon: Layers, description: "Featured collections" },
  bestSellers: { label: "Best Sellers", icon: BarChart3, description: "Top-selling products" },
  customerFeedback: { label: "Customer Feedback", icon: MessageSquare, description: "Reviews & ratings" },
  newsletter: { label: "Newsletter", icon: Mail, description: "Email subscription" },
};

// ---------------------------------------------------------------------------
// Sortable item
// ---------------------------------------------------------------------------

interface SortableItemProps {
  id: string;
  index: number;
  isEnabled: boolean;
  onToggle: (checked: boolean) => void;
}

function SortableItem({ id, index, isEnabled, onToggle }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const meta = SECTION_META[id];
  const Icon = meta?.icon ?? Layers;
  const label = meta?.label ?? id;
  const description = meta?.description ?? "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-shadow",
        isDragging && "z-50 shadow-lg ring-2 ring-primary/20",
        !isEnabled && "opacity-60",
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="touch-none cursor-grab rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Position number */}
      <span className="w-5 text-center text-xs font-semibold text-muted-foreground">
        {index + 1}
      </span>

      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Label & description */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Status badge */}
      <Badge variant={isEnabled ? "default" : "secondary"} className="shrink-0 text-[10px]">
        {isEnabled ? "ON" : "OFF"}
      </Badge>

      {/* Toggle */}
      <Switch
        checked={isEnabled}
        onCheckedChange={onToggle}
        className="shrink-0"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main sortable list
// ---------------------------------------------------------------------------

interface SortableSectionListProps {
  sectionOrder: HomepageSectionId[];
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
}

export function SortableSectionList({
  sectionOrder,
  control,
  setValue,
  watch,
}: SortableSectionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sectionOrder.indexOf(active.id as HomepageSectionId);
      const newIndex = sectionOrder.indexOf(over.id as HomepageSectionId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sectionOrder, oldIndex, newIndex);
      setValue("homepage.sectionOrder", reordered, { shouldDirty: true });
    },
    [sectionOrder, setValue],
  );

  // Items must be strings for dnd-kit
  const items = useMemo(() => sectionOrder.map(String), [sectionOrder]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {sectionOrder.map((sectionId, index) => (
            <Controller
              key={sectionId}
              name={`homepage.sections.${sectionId}.enabled`}
              control={control}
              render={({ field }) => (
                <SortableItem
                  id={sectionId}
                  index={index}
                  isEnabled={field.value ?? false}
                  onToggle={field.onChange}
                />
              )}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
