import { cn } from "@dashboard/utils/cn";
import { Skeleton, Text } from "@saleor/macaw-ui-next";
import { type LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  loading?: boolean;
  testId?: string;
}

export const KpiCard = ({
  title,
  value,
  icon: Icon,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
  loading = false,
  testId,
}: KpiCardProps) => (
  <div
    data-test-id={testId}
    className={cn(
      "relative flex flex-col gap-[12px]",
      "rounded-lg border border-[var(--mu-colors-border-default1)]",
      "bg-[var(--mu-colors-background-default1)] p-[20px]",
      "transition-shadow duration-200 hover:shadow-md",
    )}
  >
    <div className="flex items-start justify-between">
      <Text size={3} color="default2" className="leading-none">
        {title}
      </Text>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg",
          "w-[36px] h-[36px] min-w-[36px]",
          iconBg,
          iconColor,
        )}
      >
        <Icon size={18} strokeWidth={1.75} />
      </div>
    </div>
    <div className="mt-auto">
      {loading ? (
        <Skeleton __width="50%" height={5} />
      ) : (
        <Text size={9} fontWeight="bold" className="leading-none tracking-tight">
          {value}
        </Text>
      )}
    </div>
  </div>
);
