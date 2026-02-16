import { formatRelativeTime } from "@dashboard/hooks/useDateLocalize";
import { Tooltip } from "@saleor/macaw-ui-next";

import { LocaleConsumer } from "../Locale";
import { TimezoneConsumer } from "../Timezone";
import { Consumer } from "./DateContext";

interface DateTimeProps {
  date: string;
  plain?: boolean;
}

export const DateTime = ({ date, plain }: DateTimeProps) => {
  const getTitle = (value: string, locale?: string, tz?: string) => {
    const d = new globalThis.Date(value);

    if (isNaN(d.getTime())) {
      return value;
    }

    const options: Intl.DateTimeFormatOptions = {
      dateStyle: "medium",
      timeStyle: "short",
      ...(tz ? { timeZone: tz } : {}),
    };

    return new Intl.DateTimeFormat(locale, options).format(d);
  };

  return (
    <TimezoneConsumer>
      {tz => (
        <LocaleConsumer>
          {({ locale }) => (
            <Consumer>
              {currentDate =>
                plain ? (
                  getTitle(date, locale, tz)
                ) : (
                  <Tooltip>
                    <Tooltip.Trigger>
                      <div>{formatRelativeTime(date, currentDate, locale)}</div>
                    </Tooltip.Trigger>
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow />
                      {getTitle(date, locale, tz)}
                    </Tooltip.Content>
                  </Tooltip>
                )
              }
            </Consumer>
          )}
        </LocaleConsumer>
      )}
    </TimezoneConsumer>
  );
};
DateTime.displayName = "DateTime";
export default DateTime;
