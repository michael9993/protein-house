import { type ReactNode, useState } from "react";

import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  activePage: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
}

export function AppLayout({
  activePage,
  title,
  description,
  actions,
  children,
  fullWidth,
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className="grid h-screen overflow-hidden fixed inset-0 transition-[grid-template-columns] duration-200"
      style={{ gridTemplateColumns: sidebarCollapsed ? "3.5rem 1fr" : "13rem 1fr" }}
    >
      <Sidebar
        activePage={activePage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex flex-col h-full overflow-hidden">
        <header className="flex items-center justify-between border-b px-6 py-3 shrink-0">
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>

        <main className={fullWidth ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto p-6"}>
          {children}
        </main>
      </div>
    </div>
  );
}
