import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import { TableCell } from "@mui/material";
import { GripVertical } from "lucide-react";
import { SortableHandle as SortableHandleHoc } from "react-sortable-hoc";

/** @deprecated This component should use @dnd-kit instead of react-sortable-hoc */
const SortableHandle = SortableHandleHoc(() => {
  return (
    <TableCell className="cursor-grab w-[calc(48px+12px)] [&&&]:pl-6 [&&&]:pr-4">
      <GripVertical size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />
    </TableCell>
  );
});

export default SortableHandle;
