// @ts-strict-ignore
import { capitalize } from "@dashboard/misc";
import { transactionEventTypeMap } from "@dashboard/orders/messages";
import { TransactionEventType } from "@dashboard/orders/types";
import { Box, Tooltip } from "@saleor/macaw-ui-next";
import { Info } from "lucide-react";
import { useIntl } from "react-intl";

interface EventTypeProps {
  type: TransactionEventType;
  message: string | undefined;
}

export const EventType = ({ type, message }: EventTypeProps) => {
  const intl = useIntl();
  const mapEventToMessage = transactionEventTypeMap[type];
  const displayType = capitalize(
    mapEventToMessage ? intl.formatMessage(mapEventToMessage) : message || type,
  );

  return (
    <Box display="flex" alignItems="center">
      {displayType}
      {displayType !== message && message && (
        <Tooltip>
          <Tooltip.Trigger>
            <div className="p-2 flex cursor-pointer">
              <Info />
            </div>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow />
            {/* Set to explicit value in order to avoid long message from overflowing */}
            <Box __maxWidth="500px">{message}</Box>
          </Tooltip.Content>
        </Tooltip>
      )}
    </Box>
  );
};
