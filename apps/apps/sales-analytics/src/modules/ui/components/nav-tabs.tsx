import { useRouter } from "next/router";
import { BarChart3, Package, Filter } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", href: "/", icon: BarChart3 },
  { id: "products", label: "Products", href: "/products", icon: Package },
  { id: "funnel", label: "Funnel", href: "/funnel", icon: Filter },
] as const;

export type TabId = (typeof TABS)[number]["id"];

interface NavTabsProps {
  activeTab: TabId;
}

export function NavTabs({ activeTab }: NavTabsProps) {
  const router = useRouter();

  return (
    <nav className="flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => router.push(tab.href)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-medium
              border-b-2 transition-colors duration-150
              ${
                isActive
                  ? "border-brand text-brand"
                  : "border-transparent text-text-muted hover:text-text-primary hover:border-gray-300"
              }
            `}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
