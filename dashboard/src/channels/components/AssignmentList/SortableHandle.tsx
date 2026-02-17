import { cn } from "@dashboard/utils/cn";
import { DragIcon } from "@saleor/macaw-ui";
import { SortableHandle as SortableHandleHoc } from "react-sortable-hoc";

interface SortableHandleProps {
  className?: string;
}

/** @deprecated This component should use @dnd-kit instead of react-sortable-hoc */
const SortableHandle = SortableHandleHoc((props: SortableHandleProps) => {
  const { className, ...restProps } = props;

  return (
    <DragIcon
      className={cn("cursor-grab", className)}
      tabIndex={0}
      onPointerEnterCapture={undefined}
      onPointerLeaveCapture={undefined}
      {...restProps}
    />
  );
});

export default SortableHandle;
