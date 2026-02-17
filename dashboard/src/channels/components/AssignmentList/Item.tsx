import DeletableItem from "@dashboard/components/DeletableItem";
import { Divider, Text } from "@saleor/macaw-ui-next";
import { SortableElement, SortableElementProps } from "react-sortable-hoc";

import SortableHandle from "./SortableHandle";
import { AssignItem } from "./types";

interface ItemProps extends SortableElementProps {
  item: AssignItem;
  sortable?: boolean;
  onDelete: (id: string) => void;
}

/** @deprecated This component should use @dnd-kit instead of react-sortable-hoc */
const Item = SortableElement(({ item, sortable = false, onDelete }: ItemProps) => {
  const { id, name } = item;

  return (
    <>
      <div className="flex flex-row justify-between items-center bg-background-paper">
        <div className="flex overflow-auto">
          {sortable && (
            // @ts-expect-error - legacy types
            (<SortableHandle className="mr-2" data-test-id="button-drag-handle" />)
          )}
          <Text size={3}>{name}</Text>
        </div>
        <DeletableItem id={id} onDelete={onDelete} />
      </div>
      <Divider />
    </>
  );
});

export default Item;
