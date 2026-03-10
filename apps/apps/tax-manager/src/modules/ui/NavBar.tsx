import { useRouter } from "next/router";
import {
  LayoutDashboard,
  List,
  Package,
  Settings,
  FileText,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard },
  { id: "rules", label: "Tax Rules", href: "/rules", icon: List },
  { id: "presets", label: "Presets", href: "/presets", icon: Package },
  { id: "channels", label: "Channels", href: "/channels", icon: Settings },
  { id: "reports", label: "Reports", href: "/reports", icon: FileText },
];

export function NavBar() {
  const router = useRouter();

  return (
    <nav className="flex gap-1 border-b mb-6 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/"
            ? router.pathname === "/"
            : router.pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-150 ${
              isActive
                ? "border-brand text-brand"
                : "border-transparent text-text-muted hover:text-text-primary hover:border-gray-300"
            }`}
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
