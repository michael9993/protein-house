import { useCallback, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/router";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { getNavItems, type NavItem } from "@/lib/page-registry";
import { trpcClient } from "@/modules/trpc/trpc-client";

interface SidebarProps {
  channelSlug: string;
  channelName?: string;
  activePage: string;
}

export function Sidebar({ channelSlug, channelName, activePage }: SidebarProps) {
  const router = useRouter();
  const { dashboard, pages, global } = getNavItems(channelSlug);

  // Lightweight override count — piggybacks on cached config query
  const { data: config } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { staleTime: 5 * 60_000, retry: 1, enabled: !!channelSlug }
  );
  const overrideCount = useMemo(() => {
    const overrides = config?.componentOverrides;
    if (!overrides || typeof overrides !== "object") return 0;
    // Only count components that have at least one non-empty property
    return Object.values(overrides).filter(
      (v) => v && typeof v === "object" &&
        Object.values(v as Record<string, unknown>).some((sv) => sv != null && sv !== "")
    ).length;
  }, [config?.componentOverrides]);

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
        <NavLink
          item={dashboard}
          isActive={activePage === dashboard.page}
          onNavigate={navigate}
        />

        {/* Divider */}
        <div className="my-2 border-t border-sidebar-border" />

        {/* Pages Section */}
        <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Pages
        </p>
        {pages.map((item) => (
          <NavLink
            key={item.page}
            item={item}
            isActive={activePage === item.page}
            onNavigate={navigate}
          />
        ))}

        {/* Divider */}
        <div className="my-2 border-t border-sidebar-border" />

        {/* Global Section */}
        <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Global
        </p>
        {global.map((item) => (
          <NavLink
            key={item.page}
            item={item}
            isActive={activePage === item.page}
            onNavigate={navigate}
            badge={item.page === "component-designer" ? overrideCount : undefined}
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
  badge?: number;
}

function NavLink({ item, isActive, onNavigate, badge }: NavLinkProps) {
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
      <span className="flex-1">{item.label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
            isActive
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-primary/10 text-primary"
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
