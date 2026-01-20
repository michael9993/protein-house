import React, { createContext, ReactNode, useContext, useMemo, useState } from "react";

interface SectionCardProps {
  id?: string;
  title: string;
  description?: string;
  keywords?: string[];
  children: ReactNode;
  searchQuery?: string;
  icon?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  badge?: string | number;
}

interface SettingsSearchContextValue {
  query: string;
}

const SettingsSearchContext = createContext<SettingsSearchContextValue | null>(null);

interface SettingsSearchProviderProps {
  query: string;
  children: ReactNode;
}

export function SettingsSearchProvider({ query, children }: SettingsSearchProviderProps) {
  const value = useMemo(() => ({ query }), [query]);
  return <SettingsSearchContext.Provider value={value}>{children}</SettingsSearchContext.Provider>;
}

function useSettingsSearch(): SettingsSearchContextValue {
  return useContext(SettingsSearchContext) ?? { query: "" };
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function matchesSearch(query: string, values: string[]): boolean {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;
  return values.some((value) => normalizeSearchValue(value).includes(normalizedQuery));
}

export function SectionCard({ 
  id, 
  title, 
  description, 
  keywords = [], 
  children, 
  searchQuery,
  icon,
  collapsible = false,
  defaultExpanded = true,
  badge,
}: SectionCardProps) {
  const context = useSettingsSearch();
  const query = searchQuery ?? context.query;
  const matches = matchesSearch(query, [title, description ?? "", ...keywords]);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!matches) {
    return null;
  }

  return (
    <div
      id={id}
      style={{
        marginBottom: "24px",
        border: "1px solid #ddd",
        backgroundColor: "#fff",
      }}
    >
      <div
        style={{
          padding: "16px",
          borderBottom: collapsible && !isExpanded ? "none" : "1px solid #ddd",
          cursor: collapsible ? "pointer" : "default",
        }}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: 0, marginBottom: description ? "4px" : 0 }}>
          {title}
        </h3>
        {description && (
          <p style={{ fontSize: "12px", color: "#666", margin: "4px 0 0 0" }}>
            {description}
          </p>
        )}
      </div>

      {(!collapsible || isExpanded) && (
        <div style={{ padding: "16px" }}>
          {children}
        </div>
      )}
    </div>
  );
}
