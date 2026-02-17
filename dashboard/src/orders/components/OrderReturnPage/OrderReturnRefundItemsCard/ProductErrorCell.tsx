import ErrorExclamationCircleIcon from "@dashboard/icons/ErrorExclamationCircle";
import { Popper, TableCell } from "@mui/material";
import { Text } from "@saleor/macaw-ui-next";
import { useRef, useState } from "react";
import { defineMessages, useIntl } from "react-intl";
const messages = defineMessages({
  description: {
    id: "RlbhwF",
    defaultMessage: "This product is no longer in database so it can’t be replaced, nor returned",
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
  const popperAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [showErrorBox, setShowErrorBox] = useState<boolean>(false);

  if (hasVariant) {
    return <TableCell />;
  }

  return (
    <TableCell align="right" className="relative" ref={popperAnchorRef}>
      <div
        className="flex flex-row items-center justify-end"
        onMouseEnter={() => setShowErrorBox(true)}
        onMouseLeave={() => setShowErrorBox(false)}
      >
        <Text className="text-error text-xs mr-2">{intl.formatMessage(messages.title)}</Text>
        <ErrorExclamationCircleIcon />
      </div>
      <Popper placement="bottom-end" open={showErrorBox} anchorEl={popperAnchorRef.current}>
        <div className="bg-error rounded-lg mr-6 px-6 py-4 w-[280px] z-[1000]">
          <Text className="text-white text-sm">{intl.formatMessage(messages.description)}</Text>
        </div>
      </Popper>
    </TableCell>
  );
};

export default ProductErrorCell;
