import { type ReactNode } from "react";

import { NavTabs, type TabId } from "../components/nav-tabs";

interface DashboardShellProps {
  children: ReactNode;
  activeTab?: TabId;
}

/**
 * Dashboard shell with constrained width for iframe display
 */
export function DashboardShell({ children, activeTab = "overview" }: DashboardShellProps) {
  return (
    <div className="p-2 max-w-7xl mx-auto">
      <NavTabs activeTab={activeTab} />
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  );
}

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function DashboardHeader({ title, subtitle, actions }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

interface DashboardSectionProps {
  children: ReactNode;
  className?: string;
}

export function DashboardSection({ children, className = "" }: DashboardSectionProps) {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
}

interface TwoColumnGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Two column grid that stacks on mobile
 */
export function TwoColumnGrid({ children, className = "" }: TwoColumnGridProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${className}`}>{children}</div>
  );
}

interface FullWidthColumnProps {
  children: ReactNode;
}

/**
 * Full width column spanning both columns on large screens
 */
export function FullWidthColumn({ children }: FullWidthColumnProps) {
  return <div className="lg:col-span-2">{children}</div>;
}
