// @ts-strict-ignore
import { TableBody, type TableBodyProps } from "@dashboard/components/Table";
import { ReorderAction } from "@dashboard/types";
import { SortableContainer } from "react-sortable-hoc";

const InnerSortableTableBody = SortableContainer<TableBodyProps>(({ children, ...props }) => (
  <TableBody {...props}>{children}</TableBody>
));

interface SortableTableBodyProps {
  onSortEnd: ReorderAction;
}

/** @deprecated This component should use @dnd-kit instead of react-sortable-hoc */
export const SortableTableBody = (props: Omit<TableBodyProps & SortableTableBodyProps, "ref">) => {
  return (
    <InnerSortableTableBody
      helperClass="bg-background-paper font-sans opacity-50 [&_td]:border-b-0"
      axis="y"
      lockAxis="y"
      useDragHandle
      {...props}
    />
  );
};
