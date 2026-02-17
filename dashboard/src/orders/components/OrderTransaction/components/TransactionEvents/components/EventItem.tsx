import Money from "@dashboard/components/Money";
import { TransactionEventFragment, TransactionEventTypeEnum } from "@dashboard/graphql";
import { TransactionFakeEvent } from "@dashboard/orders/types";
import { cn } from "@dashboard/utils/cn";
import { TableCell, TableRow } from "@dashboard/components/Table";

import { mapTransactionEvent } from "../../../utils";
import { EventCreatedBy } from "./EventCreatedBy";
import { EventStatus } from "./EventStatus";
import { EventTime } from "./EventTime";
import { EventType } from "./EventType";
import { PspReference } from "./PspReference";

interface EventItemProps {
  event: TransactionEventFragment | TransactionFakeEvent;
  onHover: (pspReference: string) => void;
  hoveredPspReference: string;
  hasCreatedBy: boolean;
}
const eventsWithoutAmount = new Set([
  TransactionEventTypeEnum.CANCEL_SUCCESS,
  TransactionEventTypeEnum.CANCEL_REQUEST,
  TransactionEventTypeEnum.CANCEL_FAILURE,
]);
const shouldShowAmount = (event: TransactionEventFragment | TransactionFakeEvent) => {
  if (!event || !event.amount?.currency) {
    return false;
  }

  if (
    event.__typename === "TransactionEvent" &&
    event.type &&
    eventsWithoutAmount.has(event.type)
  ) {
    return false;
  }

  return true;
};

export const EventItem = ({
  event,
  onHover,
  hoveredPspReference,
  hasCreatedBy,
}: EventItemProps) => {
  const { type, status } = mapTransactionEvent(event);
  const isHovered = event.pspReference && event.pspReference === hoveredPspReference;

  return (
    <TableRow
      onMouseOver={() => onHover(event.pspReference)}
      className={cn("hover:bg-saleor-active-5", isHovered && "bg-saleor-active-5")}
      data-ishovered={isHovered}
    >
      <TableCell className="max-lg:w-[1%] max-lg:whitespace-nowrap md:w-[126px]">
        <EventStatus status={status} />
      </TableCell>
      <TableCell>{shouldShowAmount(event) && <Money money={event.amount} />}</TableCell>
      <TableCell className="max-lg:w-[1%] max-lg:whitespace-nowrap min-w-[200px] max-w-[250px] break-words whitespace-normal">
        <EventType type={type} message={event.message} />
      </TableCell>
      <TableCell className="max-lg:w-[1%] max-lg:whitespace-nowrap min-w-[10px] max-w-[150px]">
        {event.pspReference ? (
          <PspReference reference={event.pspReference} url={event.externalUrl} />
        ) : (
          <div className="min-w-[150px] max-w-[150px]" />
        )}
      </TableCell>
      <TableCell
        className={cn(
          "w-1/4 whitespace-nowrap",
          !hasCreatedBy && "md:pr-8 md:text-right max-lg:whitespace-nowrap w-[35%]",
        )}
      >
        <EventTime date={event.createdAt} />
      </TableCell>
      {hasCreatedBy && (
        <TableCell className="w-1/5 md:pr-8 md:text-right max-lg:whitespace-nowrap">
          <EventCreatedBy createdBy={event.createdBy} />
        </TableCell>
      )}
    </TableRow>
  );
};
