import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Search,
  ShoppingCart,
  Truck,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  Settings,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const NAV_ITEMS: { id: string; label: string; href: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard },
  { id: "source", label: "Source", href: "/source", icon: Search },
  { id: "orders", label: "Orders", href: "/orders", icon: ShoppingCart },
  { id: "suppliers", label: "Suppliers", href: "/suppliers", icon: Truck },
  { id: "pricing", label: "Pricing", href: "/pricing", icon: DollarSign },
  { id: "exceptions", label: "Exceptions", href: "/exceptions", icon: AlertTriangle },
  { id: "returns", label: "Returns", href: "/returns", icon: RotateCcw },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings },
  { id: "audit", label: "Audit", href: "/audit", icon: FileText },
];

export function NavBar() {
  const router = useRouter();
  const currentPath = router.pathname;

  function isActive(href: string): boolean {
    if (href === "/") return currentPath === "/";
    return currentPath.startsWith(href);
  }

  return (
    <nav className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className={`
              flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap
              border-b-2 transition-colors duration-150
              ${
                active
                  ? "border-brand text-brand"
                  : "border-transparent text-text-muted hover:text-text-primary hover:border-gray-300"
              }
            `}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
