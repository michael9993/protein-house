import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
  Type,
  ToggleLeft,
  Palette,
  Hash,
  List,
  Zap,
  ChevronRight,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { getSearchIndex, type SearchEntry } from "@/lib/search";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelSlug: string;
}

/** Icon component based on field type */
function FieldTypeIcon({ type }: { type: SearchEntry["fieldType"] }) {
  const iconClass = "h-4 w-4 shrink-0 text-muted-foreground";

  switch (type) {
    case "boolean":
      return <ToggleLeft className={iconClass} />;
    case "color":
      return <Palette className={iconClass} />;
    case "number":
      return <Hash className={iconClass} />;
    case "enum":
      return <List className={iconClass} />;
    case "action":
      return <Zap className={iconClass} />;
    case "array":
      return <List className={iconClass} />;
    default:
      return <Type className={iconClass} />;
  }
}

/** Builds a navigation URL for a search entry */
function buildEntryUrl(
  channelSlug: string,
  entry: SearchEntry,
): string {
  // Actions navigate to dashboard
  if (entry.page === "index") {
    return `/${channelSlug}`;
  }

  let url = `/${channelSlug}/${entry.page}`;

  const params = new URLSearchParams();
  if (entry.tab) params.set("tab", entry.tab);
  if (entry.formFieldName) params.set("highlight", entry.formFieldName);

  const qs = params.toString();
  if (qs) url += `?${qs}`;
  if (entry.sectionId) url += `#${entry.sectionId}`;

  return url;
}

/** Groups entries by category, preserving insertion order */
function groupByCategory(
  entries: SearchEntry[],
): Record<string, SearchEntry[]> {
  const groups: Record<string, SearchEntry[]> = {};
  for (const entry of entries) {
    if (!groups[entry.category]) {
      groups[entry.category] = [];
    }
    groups[entry.category].push(entry);
  }
  return groups;
}

/** Category display order */
const CATEGORY_ORDER = [
  "Global",
  "Homepage",
  "Layout",
  "Catalog",
  "Cart & Checkout",
  "Account",
  "Other Pages",
  "Actions",
];

export function CommandPalette({
  open,
  onOpenChange,
  channelSlug,
}: CommandPaletteProps) {
  const router = useRouter();

  // Lazy-compute search index on first open
  const searchIndex = useMemo(() => (open ? getSearchIndex() : []), [open]);

  const grouped = useMemo(() => {
    const groups = groupByCategory(searchIndex);
    // Sort groups by category order
    const sorted: Record<string, SearchEntry[]> = {};
    for (const cat of CATEGORY_ORDER) {
      if (groups[cat]) sorted[cat] = groups[cat];
    }
    // Append any remaining categories
    for (const [cat, entries] of Object.entries(groups)) {
      if (!sorted[cat]) sorted[cat] = entries;
    }
    return sorted;
  }, [searchIndex]);

  const handleSelect = useCallback(
    (entry: SearchEntry) => {
      onOpenChange(false);
      router.push(buildEntryUrl(channelSlug, entry));
    },
    [channelSlug, onOpenChange, router],
  );

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search all settings, content, and fields..." />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">No results found.</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Try searching for field names, labels, or values
            </p>
          </div>
        </CommandEmpty>

        {Object.entries(grouped).map(([category, entries], groupIdx) => (
          <div key={category}>
            {groupIdx > 0 && <CommandSeparator />}
            <CommandGroup heading={`${category} (${entries.length})`}>
              {entries.map((entry) => (
                <CommandItem
                  key={entry.fieldPath}
                  value={buildSearchValue(entry)}
                  onSelect={() => handleSelect(entry)}
                  className="flex items-start gap-3 py-2.5"
                >
                  <FieldTypeIcon type={entry.fieldType} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">
                        {entry.label}
                      </span>
                      {entry.fieldType === "boolean" && (
                        <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                          Toggle
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <span className="truncate">{entry.description}</span>
                      {entry.defaultValue && (
                        <>
                          <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
                          <span className="truncate italic opacity-70">
                            &ldquo;{entry.defaultValue}&rdquo;
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>

      {searchIndex.length > 0 && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>{searchIndex.length} searchable fields</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">
              &uarr;&darr;
            </kbd>
            <span>navigate</span>
            <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] ms-1">
              &crarr;
            </kbd>
            <span>open</span>
            <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] ms-1">
              esc
            </kbd>
            <span>close</span>
          </span>
        </div>
      )}
    </CommandDialog>
  );
}

/**
 * Builds the cmdk search value string.
 * cmdk uses this for its built-in fuzzy matching.
 */
function buildSearchValue(entry: SearchEntry): string {
  const parts = [
    entry.label,
    entry.description,
    entry.defaultValue ?? "",
    ...entry.keywords,
  ];
  return parts.join(" ");
}
