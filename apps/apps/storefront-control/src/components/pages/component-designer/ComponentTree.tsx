import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMPONENT_REGISTRY,
  getAllComponentPages,
  getComponentsByPage,
  getGroupsForPage,
  type ComponentRegistryEntry,
} from "@/lib/component-registry";
import { PAGE_REGISTRY } from "@/lib/page-registry";

interface ComponentTreeProps {
  selectedKey: string | null;
  onSelect: (key: string) => void;
  /** Keys that have overrides (for showing indicator) */
  overriddenKeys: Set<string>;
}

export function ComponentTree({ selectedKey, onSelect, overriddenKeys }: ComponentTreeProps) {
  const pages = getAllComponentPages();
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set(pages));
  const [search, setSearch] = useState("");
  const navRef = useRef<HTMLElement>(null);

  // Auto-scroll to selected component in tree
  useEffect(() => {
    if (!selectedKey || !navRef.current) return;
    const el = navRef.current.querySelector(`[data-tree-key="${selectedKey}"]`);
    if (el) {
      // Expand the page section if collapsed
      const comp = COMPONENT_REGISTRY.find((c) => c.configKey === selectedKey);
      if (comp && !expandedPages.has(comp.page)) {
        setExpandedPages((prev) => new Set([...prev, comp.page]));
        // Scroll after DOM update
        requestAnimationFrame(() => {
          const refreshedEl = navRef.current?.querySelector(`[data-tree-key="${selectedKey}"]`);
          refreshedEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      } else {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter components by search query
  const filteredComponents = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return COMPONENT_REGISTRY.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.configKey.toLowerCase().includes(q) ||
        c.group?.toLowerCase().includes(q)
    );
  }, [search]);

  function togglePage(pageId: string) {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  }

  return (
    <nav ref={navRef} className="flex flex-col gap-0.5">
      {/* Search input */}
      <div className="relative mb-1">
        <SearchIcon className="pointer-events-none absolute start-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search components..."
          className="w-full rounded-md border border-neutral-200 bg-white py-1.5 ps-7 pe-2 text-xs text-neutral-700 placeholder:text-neutral-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
      </div>

      {/* Flat filtered results when searching */}
      {filteredComponents ? (
        filteredComponents.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-neutral-400">No components found</p>
        ) : (
          filteredComponents.map((comp) => (
            <ComponentItem
              key={comp.id}
              component={comp}
              isSelected={selectedKey === comp.configKey}
              hasOverride={overriddenKeys.has(comp.configKey)}
              onSelect={() => onSelect(comp.configKey)}
              showPage
            />
          ))
        )
      ) : (
        /* Normal page-grouped tree */
        pages.map((pageId) => {
          const pageDef = PAGE_REGISTRY.find((p) => p.id === pageId);
          const components = getComponentsByPage(pageId);
          const isExpanded = expandedPages.has(pageId);
          const pageHasOverrides = components.some((c) => overriddenKeys.has(c.configKey));
          const groups = getGroupsForPage(pageId);

          return (
            <div key={pageId}>
              {/* Page header */}
              <button
                type="button"
                onClick={() => togglePage(pageId)}
                className={cn(
                  "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100",
                  pageHasOverrides && "text-blue-700"
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                )}
                {pageDef?.label ?? pageId}
                {pageHasOverrides && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />
                )}
              </button>

              {/* Component list with sub-group headers */}
              {isExpanded && (
                <div className="ml-3 flex flex-col gap-0.5 border-l border-neutral-200 pl-2">
                  {groups.length > 1
                    ? /* Multiple groups — show sub-headers */
                      groups.map((group) => {
                        const groupComps = components.filter((c) => c.group === group);
                        if (groupComps.length === 0) return null;
                        return (
                          <div key={group}>
                            <div className="mt-1 mb-0.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                              {group}
                            </div>
                            {groupComps.map((comp) => (
                              <ComponentItem
                                key={comp.id}
                                component={comp}
                                isSelected={selectedKey === comp.configKey}
                                hasOverride={overriddenKeys.has(comp.configKey)}
                                onSelect={() => onSelect(comp.configKey)}
                              />
                            ))}
                          </div>
                        );
                      })
                    : /* Single or no group — flat list */
                      components.map((comp) => (
                        <ComponentItem
                          key={comp.id}
                          component={comp}
                          isSelected={selectedKey === comp.configKey}
                          hasOverride={overriddenKeys.has(comp.configKey)}
                          onSelect={() => onSelect(comp.configKey)}
                        />
                      ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </nav>
  );
}

function ComponentItem({
  component,
  isSelected,
  hasOverride,
  onSelect,
  showPage,
}: {
  component: ComponentRegistryEntry;
  isSelected: boolean;
  hasOverride: boolean;
  onSelect: () => void;
  showPage?: boolean;
}) {
  const Icon = component.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      data-tree-key={component.configKey}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
        isSelected
          ? "bg-blue-50 text-blue-700 font-medium"
          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">
        {component.label}
        {showPage && (
          <span className="ml-1 text-neutral-400">· {component.page}</span>
        )}
      </span>
      {hasOverride && (
        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
      )}
    </button>
  );
}
