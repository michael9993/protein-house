import { IMoney } from "@dashboard/utils/intl";
import { FormattedMessage } from "react-intl";

import { dataLineMessages } from "../messages";
import { DataLineMoney } from "./DataLineMoney";

interface DataLineSettledProps {
  unsettledMoney: IMoney;
}

export const DataLineSettled = ({ unsettledMoney }: DataLineSettledProps) => {
  if (!unsettledMoney) {
    return null;
  }

  if (unsettledMoney.amount === 0) {
    return (
      <span className="font-semibold text-saleor-success-dark">
        <FormattedMessage {...dataLineMessages.settled} />
      </span>
    );
  }

  return (
    <span className="font-semibold text-saleor-fail-dark">
      <FormattedMessage {...dataLineMessages.unsettled} />
      &nbsp;
      <DataLineMoney money={unsettledMoney} />
    </span>
  );
};
