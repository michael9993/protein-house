import clsx from "clsx";
import * as React from "react";

interface DashboardTabsProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

export const DashboardTabs = ({ value, onChange, children }: DashboardTabsProps) => (
  <div
    className="flex gap-1 border-b border-[var(--mu-colors-border-default1)]"
    role="tablist"
  >
    {React.Children.map(children, child => {
      if (!React.isValidElement<DashboardTabProps>(child)) return child;

      return React.cloneElement(child, {
        selected: child.props.value === value,
        onClick: () => onChange(child.props.value),
      });
    })}
  </div>
);

export interface DashboardTabProps {
  label: string;
  value: string;
  selected?: boolean;
  onClick?: () => void;
  "data-test-id"?: string;
}

export const DashboardTab = ({
  label,
  selected,
  onClick,
  ...rest
}: DashboardTabProps) => (
  <button
    role="tab"
    aria-selected={selected}
    className={clsx(
      "px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px cursor-pointer rounded-t-lg",
      selected
        ? "border-[var(--mu-colors-text-default1)] text-[var(--mu-colors-text-default1)] bg-[var(--mu-colors-background-default2)]"
        : "border-transparent text-[var(--mu-colors-text-default2)] hover:text-[var(--mu-colors-text-default1)] hover:bg-[var(--mu-colors-background-default2)]",
    )}
    onClick={onClick}
    {...rest}
  >
    {label}
  </button>
);

DashboardTabs.displayName = "DashboardTabs";
DashboardTab.displayName = "DashboardTab";
