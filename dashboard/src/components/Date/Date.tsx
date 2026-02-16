import useDateLocalize, { formatRelativeTime } from "@dashboard/hooks/useDateLocalize";
import { Tooltip } from "@saleor/macaw-ui-next";

import { LocaleConsumer } from "../Locale";
import { Consumer } from "./DateContext";

interface DateProps {
  date: string;
  plain?: boolean;
  format?: string;
}

const Date = ({ date, plain, format }: DateProps) => {
  const localizeDate = useDateLocalize();

  return (
    <LocaleConsumer>
      {({ locale }) => (
        <Consumer>
          {currentDate =>
            plain ? (
              localizeDate(date, format)
            ) : (
              <Tooltip>
                <Tooltip.Trigger>
                  <time dateTime={date} data-test-id="dateTime">
                    {formatRelativeTime(date, currentDate, locale)}
                  </time>
                </Tooltip.Trigger>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow />
                  {localizeDate(date, format)}
                </Tooltip.Content>
              </Tooltip>
            )
          }
        </Consumer>
      )}
    </LocaleConsumer>
  );
};

Date.displayName = "Date";
export default Date;
