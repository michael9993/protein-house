// @ts-strict-ignore
import { TransactionEventFragment } from "@dashboard/graphql";
import { renderCollection } from "@dashboard/misc";
import { TransactionFakeEvent } from "@dashboard/orders/types";
import { TableCell, TableRow } from "@mui/material";
import { ResponsiveTable } from "@saleor/macaw-ui";
import { useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";

import { EventItem } from "./components";
import { messages } from "./messages";

interface OrderTransactionEventsProps {
  events: TransactionEventFragment[] | TransactionFakeEvent[];
}
const isFakeEventsList = (
  events: TransactionEventFragment[] | TransactionFakeEvent[],
): events is TransactionFakeEvent[] => events[0]?.__typename === "TransactionFakeEvent";

export const TransactionEvents = ({ events }: OrderTransactionEventsProps) => {
  const [hoveredPspReference, setHoveredPspReference] = useState(null);
  const hasCreatedBy = useMemo(() => {
    if (isFakeEventsList(events)) {
      return false;
    }

    return !!events.find(event => !!event.createdBy);
  }, [events]);

  return (
    <ResponsiveTable
      className="[&_td]:px-4 [&_td:first-child]:pl-9"
      onMouseLeave={() => setHoveredPspReference(null)}
      flexBreakpoint="lg"
    >
      {renderCollection<TransactionFakeEvent | TransactionEventFragment>(
        events,
        transactionEvent => (
          <EventItem
            key={transactionEvent.id}
            event={transactionEvent}
            onHover={setHoveredPspReference}
            hoveredPspReference={hoveredPspReference}
            hasCreatedBy={hasCreatedBy}
          />
        ),
        () => (
          <TableRow>
            <TableCell className="text-saleor-main-2">
              <FormattedMessage {...messages.noEvents} />
            </TableCell>
          </TableRow>
        ),
      )}
    </ResponsiveTable>
  );
};
