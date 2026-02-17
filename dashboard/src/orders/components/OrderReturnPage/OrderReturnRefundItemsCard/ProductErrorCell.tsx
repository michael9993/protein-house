import ErrorExclamationCircleIcon from "@dashboard/icons/ErrorExclamationCircle";
import { TableCell } from "@dashboard/components/Table";
import { Text } from "@saleor/macaw-ui-next";
import { useState } from "react";
import { defineMessages, useIntl } from "react-intl";
const messages = defineMessages({
  description: {
    id: "RlbhwF",
    defaultMessage: "This product is no longer in database so it can't be replaced, nor returned",
    description: "product no longer exists error description",
  },
  title: {
    id: "p4zuQp",
    defaultMessage: "Product no longer exists",
    description: "product no longer exists error title",
  },
});

interface ProductErrorCellProps {
  hasVariant: boolean;
}

const ProductErrorCell = ({ hasVariant }: ProductErrorCellProps) => {
  const intl = useIntl();
  const [showErrorBox, setShowErrorBox] = useState<boolean>(false);

  if (hasVariant) {
    return <TableCell />;
  }

  return (
    <TableCell align="right" className="relative">
      <div
        className="flex flex-row items-center justify-end"
        onMouseEnter={() => setShowErrorBox(true)}
        onMouseLeave={() => setShowErrorBox(false)}
      >
        <Text className="text-error text-xs mr-2">{intl.formatMessage(messages.title)}</Text>
        <ErrorExclamationCircleIcon />
      </div>
      {showErrorBox && (
        <div className="absolute right-0 top-full z-[1000]">
          <div className="bg-error rounded-lg mr-6 px-6 py-4 w-[280px]">
            <Text className="text-white text-sm">{intl.formatMessage(messages.description)}</Text>
          </div>
        </div>
      )}
    </TableCell>
  );
};

export default ProductErrorCell;
