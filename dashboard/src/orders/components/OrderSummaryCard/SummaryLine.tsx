import Money from "@dashboard/components/Money";
import { cn } from "@dashboard/utils/cn";
import { IMoney } from "@dashboard/utils/intl";
import { Skeleton } from "@saleor/macaw-ui-next";
import * as React from "react";
import { useIntl } from "react-intl";

import { orderSummaryMessages } from "./messages";

interface SummaryLineProps {
  text: React.ReactNode;
  subText?: React.ReactNode;
  negative?: boolean;
  bold?: boolean;
  vertical?: boolean;
  money: IMoney | undefined;
  hideEmpty?: boolean;
  className?: string;
}

const SummaryLine = ({
  text,
  subText,
  negative,
  bold,
  vertical = false,
  money,
  hideEmpty = false,
  className,
}: SummaryLineProps) => {
  const intl = useIntl();

  return (
    <li
      className={cn(
        "flex",
        bold && "font-semibold",
        !vertical && "[&_dl]:flex [&_dl]:w-full [&_dl]:gap-4 [&_dd]:ml-auto [&_dd]:flex [&_dd]:items-baseline",
        className,
      )}
    >
      <dl>
        <dt>
          {text}
          {subText && (
            <span className="text-saleor-main-3 ml-2">
              {/* zero-width space: spacing is provided by <span> styling, we want better text auto-select */}
              &#8203;
              {subText}
            </span>
          )}
        </dt>
        <dd>
          {money === undefined ? (
            <Skeleton className="w-[6ch] self-center" />
          ) : money.amount === 0 && hideEmpty ? (
            <span>&mdash;</span>
          ) : (
            <>
              {negative && (
                <span aria-label={intl.formatMessage(orderSummaryMessages.negative)}>–&nbsp;</span>
              )}
              <Money money={money} />
            </>
          )}
        </dd>
      </dl>
    </li>
  );
};

export default SummaryLine;
