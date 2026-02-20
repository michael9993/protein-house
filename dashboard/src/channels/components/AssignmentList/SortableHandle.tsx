import { cn } from "@dashboard/utils/cn";
import { GripVertical } from "lucide-react";
import { SortableHandle as SortableHandleHoc } from "react-sortable-hoc";

interface SortableHandleProps {
  className?: string;
}

/** @deprecated This component should use @dnd-kit instead of react-sortable-hoc */
const SortableHandle = SortableHandleHoc((props: SortableHandleProps) => {
  const { className, ...restProps } = props;

  return (
    <GripVertical
      className={cn("cursor-grab", className)}
      tabIndex={0}
      size={24}
      {...restProps}
    />
  );
});

export default SortableHandle;
