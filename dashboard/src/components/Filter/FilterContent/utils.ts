// @ts-strict-ignore
import { joinDateTime, splitDateTime } from "@dashboard/misc";
import { Option } from "@saleor/macaw-ui-next";
import { IntlShape } from "react-intl";

import { FilterType } from "../types";

export const filterTestingContext = "filter-field-";

export const commonFilterStyles = {
  andLabel: "my-2 mr-4",
  arrow: "mr-4",
  input: "!py-[9px] !pb-[9px] !ps-3 !pe-0",
  inputRange: "flex items-center",
  inputTime: "ml-2 w-[150px]",
  spacer: "pr-8",
} as const;

export function getIsFilterMultipleChoices(intl: IntlShape): Option[] {
  return [
    {
      label: intl.formatMessage({
        id: "I+UwqI",
        defaultMessage: "equal to",
        description: "is filter range or value",
      }),
      value: FilterType.SINGULAR,
    },
    {
      label: intl.formatMessage({
        id: "QBxN6z",
        defaultMessage: "between",
        description: "is filter range or value",
      }),
      value: FilterType.MULTIPLE,
    },
  ];
}

export const getDateFilterValue = (
  dateTime: string,
  dateTimeString: string | null,
  dateTimeFormat: boolean,
) => {
  const { date } = splitDateTime(dateTime);

  if (!dateTimeFormat) {
    return date;
  }

  const { time } = splitDateTime(dateTimeString);

  return joinDateTime(date, time);
};

export const getDateTimeFilterValue = (dateTimeString: string | null, timeString: string) => {
  const { date } = splitDateTime(dateTimeString || new Date().toISOString());

  return joinDateTime(date, timeString);
};
