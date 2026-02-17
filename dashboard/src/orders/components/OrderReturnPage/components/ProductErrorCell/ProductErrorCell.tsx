import ErrorExclamationCircleIcon from "@dashboard/icons/ErrorExclamationCircle";
import { Popper, TableCell } from "@mui/material";
import { Text } from "@saleor/macaw-ui-next";
import { useRef, useState } from "react";
import { useIntl } from "react-intl";

import { productErrorCellMessages } from "./messages";

interface ProductErrorCellProps {
  hasVariant: boolean;
}

export const ProductErrorCell = ({ hasVariant }: ProductErrorCellProps) => {
  const intl = useIntl();
  const popperAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [showErrorBox, setShowErrorBox] = useState<boolean>(false);

  if (hasVariant) {
    return <TableCell />;
  }

  return (
    <TableCell align="right" className="relative" ref={popperAnchorRef}>
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
      <Popper
        placement="bottom-end"
        data-test-id="product-error-popup"
        open={showErrorBox}
        anchorEl={popperAnchorRef.current}
      >
        <div className="bg-error rounded-lg mr-6 px-6 py-4 w-[280px] z-[1000]">
          <Text className="text-white text-sm">
            {intl.formatMessage(productErrorCellMessages.description)}
          </Text>
        </div>
      </Popper>
    </TableCell>
  );
};
