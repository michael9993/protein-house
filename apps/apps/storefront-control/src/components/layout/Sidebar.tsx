import { useCallback } from "react";
import {
  CreditCard,
  FileText,
  Globe,
  Home,
  LayoutDashboard,
  Package,
  PanelTop,
  ShoppingCart,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/router";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  page: string;
}

interface SidebarProps {
  channelSlug: string;
  channelName?: string;
  activePage: string;
}

function getNavItems(channelSlug: string): NavItem[] {
  const base = `/${channelSlug}`;

  return [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: base,
      page: "dashboard",
    },
    { label: "Global", icon: Globe, href: `${base}/global`, page: "global" },
    { label: "Homepage", icon: Home, href: `${base}/homepage`, page: "homepage" },
    {
      label: "Layout",
      icon: PanelTop,
      href: `${base}/layout-config`,
      page: "layout-config",
    },
    { label: "Catalog", icon: Package, href: `${base}/catalog`, page: "catalog" },
    {
      label: "Product Cards",
      icon: CreditCard,
      href: `${base}/product-cards`,
      page: "product-cards",
    },
    {
      label: "Cart & Checkout",
      icon: ShoppingCart,
      href: `${base}/cart-checkout`,
      page: "cart-checkout",
    },
    {
      label: "Account",
      icon: User,
      href: `${base}/account-config`,
      page: "account-config",
    },
    {
      label: "Other Pages",
      icon: FileText,
      href: `${base}/other-pages`,
      page: "other-pages",
    },
  ];
}

export function Sidebar({ channelSlug, channelName, activePage }: SidebarProps) {
  const router = useRouter();
  const navItems = getNavItems(channelSlug);
  const dashboardItem = navItems[0];
  const sectionItems = navItems.slice(1);

  const navigate = useCallback(
    (href: string) => {
      router.push(href).then((ok) => {
        if (!ok) {
          toast.error(`Navigation to ${href} was aborted`);
        }
      }).catch((err) => {
        toast.error(`Navigation error: ${String(err)}`);
      });
    },
    [router],
  );

  return (
    <aside className="relative z-10 w-56 border-r border-border bg-sidebar h-screen sticky top-0 overflow-y-auto flex flex-col">
      {/* Channel Name */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <p className="text-sm font-semibold text-sidebar-foreground truncate">
          {channelName ?? channelSlug}
        </p>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1">
        {/* Dashboard Link */}
        {dashboardItem && (
          <NavLink
            item={dashboardItem}
            isActive={activePage === dashboardItem.page}
            onNavigate={navigate}
          />
        )}

        {/* Divider */}
        <div className="my-2 border-t border-sidebar-border" />

        {/* Section Links */}
        {sectionItems.map((item) => (
          <NavLink
            key={item.page}
            item={item}
            isActive={activePage === item.page}
            onNavigate={navigate}
          />
        ))}
      </nav>
    </aside>
  );
}

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  onNavigate: (href: string) => void;
}

function NavLink({ item, isActive, onNavigate }: NavLinkProps) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onNavigate(item.href)}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-left",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </button>
  );
}
