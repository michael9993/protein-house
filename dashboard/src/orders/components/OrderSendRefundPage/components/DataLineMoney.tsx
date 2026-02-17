import { formatMoneyAmount } from "@dashboard/components/Money";
import useLocale from "@dashboard/hooks/useLocale";
import { IMoney } from "@dashboard/utils/intl";

interface DataLineMoneyProps {
  money: IMoney;
}

export const DataLineMoney = ({ money }: DataLineMoneyProps) => {
  const { locale } = useLocale();

  if (!money) {
    return null;
  }

  const amount = formatMoneyAmount(money, locale);

  return (
    <span>
      <span>{money.currency}</span>
      &nbsp;
      <span className="font-semibold">{amount}</span>
    </span>
  );
};
