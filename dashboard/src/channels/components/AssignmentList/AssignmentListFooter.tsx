import { Combobox } from "@dashboard/components/Combobox";
import { ChangeEvent } from "@dashboard/hooks/useForm";
import { useClickOutside } from "@dashboard/hooks/useClickOutside";
import CardAddItemsFooter from "@dashboard/products/components/ProductStocks/components/CardAddItemsFooter";
import { mapNodeToChoice } from "@dashboard/utils/maps";
import { Box } from "@saleor/macaw-ui-next";
import { useEffect, useRef, useState } from "react";
import { defineMessages, useIntl } from "react-intl";

import { AssignItem, AssignmentListProps } from "./types";

const messages = defineMessages({
  addItemTitle: {
    id: "EuOXmr",
    defaultMessage: "Add {itemsName}",
    description: "add items title",
  },
});

type AssignmentListFooterProps = AssignmentListProps;

const AssignmentListFooter = ({
  items,
  itemsChoices,
  itemsName,
  inputName,
  dataTestId,
  addItem,
  searchItems,
  fetchMoreItems,
}: AssignmentListFooterProps) => {
  const intl = useIntl();
  const [isChoicesSelectShown, setIsChoicesSelectShown] = useState(false);
  const itemsRef = useRef<AssignItem[]>(items);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFooterClickAway = (event: MouseEvent) => {
    // Don't close if clicking inside a Radix portal (combobox dropdown options)
    const target = event.target as HTMLElement;
    if (target.closest("[data-radix-popper-content-wrapper]")) {
      return;
    }

    setIsChoicesSelectShown(false);
    searchItems("");
  };

  useClickOutside([containerRef], handleFooterClickAway);

  // select holds value and displays it so it needs remounting
  // to display empty input after adding new zone
  useEffect(() => {
    if (items.length > itemsRef.current.length) {
      setIsChoicesSelectShown(true);
    }

    itemsRef.current = items;
  }, [items]);

  const handleChoice = ({ target }: ChangeEvent) => {
    if (!target.value) {
      return;
    }

    setIsChoicesSelectShown(false);
    addItem(target.value);
  };

  return isChoicesSelectShown ? (
    <Box ref={containerRef} marginTop={3}>
      <Combobox
        data-test-id={`${dataTestId}-auto-complete-select`}
        name={inputName}
        onChange={handleChoice}
        fetchOptions={searchItems}
        options={mapNodeToChoice(itemsChoices)}
        fetchMore={fetchMoreItems}
        value={{
          value: "",
          label: "",
        }}
      />
    </Box>
  ) : (
    <CardAddItemsFooter
      onAdd={() => setIsChoicesSelectShown(true)}
      title={intl.formatMessage(messages.addItemTitle, {
        itemsName,
      })}
      testIds={{
        link: `${dataTestId}-add-link`,
        button: `${dataTestId}-add-button`,
      }}
    />
  );
};

export default AssignmentListFooter;
