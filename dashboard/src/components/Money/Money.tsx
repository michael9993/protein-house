import useLocale from "@dashboard/hooks/useLocale";
import { IMoney } from "@dashboard/utils/intl";

import { formatMoneyAmount } from ".";

interface MoneyProps {
  money: IMoney | null;
}

const Money = (props: MoneyProps) => {
  const { money, ...rest } = props;
  const { locale } = useLocale();

  if (!money) {
    return null;
  }

  return (
    <span data-test-id="money-value" className="font-medium" {...rest}>
      <span className="text-[0.87em] mr-[0.2rem]">{money.currency}</span>
      {formatMoneyAmount(money, locale)}
    </span>
  );
};

Money.displayName = "Money";
export default Money;
