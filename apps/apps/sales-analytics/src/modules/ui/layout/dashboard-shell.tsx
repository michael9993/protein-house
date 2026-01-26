import { Grid, Col, Flex, Title, Subtitle } from "@tremor/react";
import { ReactNode } from "react";

interface DashboardShellProps {
  children: ReactNode;
}

/**
 * Dashboard shell with constrained width for iframe display
 * Max width of ~1400px works well in Saleor Dashboard's APP_PAGE frame
 */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="p-2 max-w-7xl mx-auto">
      <div className="space-y-6">{children}</div>
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
    <Flex
      justifyContent="between"
      alignItems="start"
      className="flex-col sm:flex-row gap-4"
    >
      <div>
        <Title>{title}</Title>
        {subtitle && <Subtitle className="mt-1">{subtitle}</Subtitle>}
      </div>
      {actions && (
        <Flex justifyContent="end" className="flex-wrap gap-2">
          {actions}
        </Flex>
      )}
    </Flex>
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
    <Grid numItemsLg={2} className={`gap-4 ${className}`}>
      {children}
    </Grid>
  );
}

interface FullWidthColumnProps {
  children: ReactNode;
}

/**
 * Full width column spanning both columns on large screens
 */
export function FullWidthColumn({ children }: FullWidthColumnProps) {
  return <Col numColSpanLg={2}>{children}</Col>;
}
