import { useRouter } from "next/router";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: HomeIcon, href: "/" },
  { id: "editor", label: "Editor", icon: PencilIcon, href: "/editor" },
  { id: "projects", label: "Projects", icon: FolderIcon, href: "/projects" },
  { id: "products", label: "Products", icon: PackageIcon, href: "/products" },
  { id: "templates", label: "Templates", icon: LayoutTemplateIcon, href: "/templates" },
  { id: "library", label: "Library", icon: LibraryIcon, href: "/library" },
] as const;

interface SidebarProps {
  activePage: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ activePage, collapsed, onToggleCollapse }: SidebarProps) {
  const router = useRouter();

  return (
    <aside className="flex flex-col border-r bg-sidebar h-full overflow-hidden">
      <div className={`flex items-center border-b ${collapsed ? "justify-center px-2 py-4" : "gap-2 px-4 py-4"}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          IS
        </div>
        {!collapsed && (
          <div>
            <h2 className="text-sm font-semibold">Image Studio</h2>
            <p className="text-xs text-muted-foreground">Product image editor</p>
          </div>
        )}
      </div>

      <nav className={`flex-1 py-3 space-y-1 ${collapsed ? "px-1.5" : "px-2"}`}>
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center w-full rounded-md text-sm transition-colors ${
                collapsed
                  ? "justify-center p-2"
                  : "gap-3 px-3 py-2"
              } ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      <div className={`py-3 border-t ${collapsed ? "px-1.5" : "px-3"}`}>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex items-center w-full rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors ${
              collapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
            }`}
          >
            <ChevronIcon className="h-4 w-4 shrink-0" collapsed={collapsed} />
            {!collapsed && "Collapse"}
          </button>
        )}
        <div className={`flex items-center gap-2 py-1 ${collapsed ? "justify-center px-0" : "px-2"}`}>
          <div className="h-2 w-2 rounded-full bg-green-500" />
          {!collapsed && <span className="text-xs text-muted-foreground">Ready</span>}
        </div>
      </div>
    </aside>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function LayoutTemplateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="7" x="3" y="3" rx="1" />
      <rect width="9" height="7" x="3" y="14" rx="1" />
      <rect width="5" height="7" x="16" y="14" rx="1" />
    </svg>
  );
}

function LibraryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 6 4 14" />
      <path d="M12 6v14" />
      <path d="M8 8v12" />
      <path d="M4 4v16" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function ChevronIcon({ className, collapsed }: { className?: string; collapsed?: boolean }) {
  return (
    <svg
      className={`${className} transition-transform ${collapsed ? "rotate-180" : ""}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m11 17-5-5 5-5" />
      <path d="m18 17-5-5 5-5" />
    </svg>
  );
}
