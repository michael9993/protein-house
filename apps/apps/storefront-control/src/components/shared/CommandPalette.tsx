import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/router";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  settingsSearchIndex,
  type SettingsSearchEntry,
} from "@/lib/settings-index";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelSlug: string;
}

function matchesQuery(entry: SettingsSearchEntry, query: string): boolean {
  const lower = query.toLowerCase();

  if (entry.title.toLowerCase().includes(lower)) {
    return true;
  }

  if (entry.description?.toLowerCase().includes(lower)) {
    return true;
  }

  return entry.keywords.some((keyword) => keyword.toLowerCase().includes(lower));
}

function buildEntryUrl(channelSlug: string, entry: SettingsSearchEntry): string {
  let url = `/${channelSlug}/${entry.page}`;

  if (entry.tab) {
    url += `?tab=${entry.tab}`;
  }

  if (entry.sectionId) {
    url += `#${entry.sectionId}`;
  }

  return url;
}

function groupByCategory(
  entries: SettingsSearchEntry[]
): Record<string, SettingsSearchEntry[]> {
  const groups: Record<string, SettingsSearchEntry[]> = {};

  for (const entry of entries) {
    if (!groups[entry.category]) {
      groups[entry.category] = [];
    }
    groups[entry.category].push(entry);
  }

  return groups;
}

export function CommandPalette({ open, onOpenChange, channelSlug }: CommandPaletteProps) {
  const router = useRouter();

  const grouped = useMemo(
    () => groupByCategory(settingsSearchIndex),
    []
  );

  const handleSelect = useCallback(
    (entry: SettingsSearchEntry) => {
      onOpenChange(false);
      router.push(buildEntryUrl(channelSlug, entry));
    },
    [channelSlug, onOpenChange, router]
  );

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
      <CommandInput placeholder="Search settings..." />
      <CommandList>
        <CommandEmpty>No settings found.</CommandEmpty>
        {Object.entries(grouped).map(([category, entries]) => (
          <CommandGroup key={category} heading={category}>
            {entries.map((entry) => (
              <CommandItem
                key={`${entry.page}-${entry.sectionId ?? entry.title}`}
                value={`${entry.title} ${entry.description ?? ""} ${entry.keywords.join(" ")}`}
                onSelect={() => handleSelect(entry)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{entry.title}</span>
                  {entry.description && (
                    <span className="text-xs text-muted-foreground">
                      {entry.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
