import ErrorExclamationCircleIcon from "@dashboard/icons/ErrorExclamationCircle";
import { TableCell } from "@dashboard/components/Table";
import { Text } from "@saleor/macaw-ui-next";
import { useState } from "react";
import { useIntl } from "react-intl";

import { productErrorCellMessages } from "./messages";

interface ProductErrorCellProps {
  hasVariant: boolean;
}

export const ProductErrorCell = ({ hasVariant }: ProductErrorCellProps) => {
  const intl = useIntl();
  const [showErrorBox, setShowErrorBox] = useState<boolean>(false);

  if (hasVariant) {
    return <TableCell />;
  }

  return (
    <TableCell align="right" className="relative">
      <div
        data-test-id="product-error-message"
        className="flex flex-row items-center justify-end"
        onMouseEnter={() => setShowErrorBox(true)}
        onMouseLeave={() => setShowErrorBox(false)}
      >
        <Text className="text-error text-xs mr-2">
          {intl.formatMessage(productErrorCellMessages.title)}
        </Text>
        <ErrorExclamationCircleIcon />
      </div>
      {showErrorBox && (
        <div data-test-id="product-error-popup" className="absolute right-0 top-full z-[1000]">
          <div className="bg-error rounded-lg mr-6 px-6 py-4 w-[280px]">
            <Text className="text-white text-sm">
              {intl.formatMessage(productErrorCellMessages.description)}
            </Text>
          </div>
        </div>
      )}
    </TableCell>
  );
};
