import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import { cn } from "@dashboard/utils/cn";
import { Text } from "@saleor/macaw-ui-next";
import { X } from "lucide-react";
import * as React from "react";

interface ChipProps {
  className?: string;
  label: React.ReactNode;
  onClose?: () => void;
}

const Chip = (props: ChipProps) => {
  const { className, label, onClose } = props;

  return (
    <div className={cn("bg-primary/80 rounded-[18px] inline-block mr-4 py-[6px] px-[12px]", className)}>
      <Text className="text-white" size={2} fontWeight="medium">
        {label}
        {onClose && (
          <X
            size={iconSize.small}
            strokeWidth={iconStrokeWidth}
            className="cursor-pointer text-base ml-2 align-middle"
            onClick={onClose}
          />
        )}
      </Text>
    </div>
  );
};

Chip.displayName = "Chip";
export default Chip;
