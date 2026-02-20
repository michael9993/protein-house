import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import clsx from "clsx";
import * as React from "react";

type Severity = "warning" | "error" | "info" | "success";

export interface DashboardAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  severity: Severity;
  children?: React.ReactNode;
}

const iconMap: Record<Severity, React.ElementType> = {
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  success: CheckCircle,
};

const styleMap: Record<Severity, string> = {
  warning: "bg-amber-50 border-amber-200 text-amber-900 [&_svg]:text-amber-500",
  error: "bg-red-50 border-red-200 text-red-900 [&_svg]:text-red-500",
  info: "bg-blue-50 border-blue-200 text-blue-900 [&_svg]:text-blue-500",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900 [&_svg]:text-emerald-500",
};

export const DashboardAlert = ({
  severity,
  children,
  className,
  ...rest
}: DashboardAlertProps) => {
  const Icon = iconMap[severity];

  return (
    <div
      role="alert"
      className={clsx(
        "flex gap-3 rounded-lg border px-4 py-3",
        styleMap[severity],
        className,
      )}
      {...rest}
    >
      <Icon size={20} className="mt-0.5 shrink-0" />
      <div className="flex-1 text-base">{children}</div>
    </div>
  );
};

DashboardAlert.displayName = "DashboardAlert";
