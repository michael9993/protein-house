// @ts-strict-ignore
import AddressFormatter from "@dashboard/components/AddressFormatter";
import { DashboardCard } from "@dashboard/components/Card";
import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import { AddressFragment } from "@dashboard/graphql";
import { commonMessages } from "@dashboard/intl";
import { cn } from "@dashboard/utils/cn";
import { Text } from "@saleor/macaw-ui-next";
import { Pencil } from "lucide-react";
import { useIntl } from "react-intl";

interface CustomerAddressChoiceCardProps {
  address: AddressFragment;
  selected?: boolean;
  editable?: boolean;
  onSelect?: () => void;
  onEditClick?: () => void;
}

const CustomerAddressChoiceCard = (props: CustomerAddressChoiceCardProps) => {
  const { address, selected, editable, onSelect, onEditClick } = props;
  const intl = useIntl();

  return (
    <DashboardCard
      className={cn(
        "p-px border-2 border-solid border-saleor-main-5",
        selected && "border-primary cursor-pointer",
        !editable && !selected && "hover:cursor-pointer hover:border-saleor-active-3",
      )}
      onClick={onSelect}
    >
      <DashboardCard.Content className="flex flex-row justify-between items-start">
        <AddressFormatter address={address} />
        {editable && (
          <div onClick={onEditClick}>
            <Pencil
              size={iconSize.small}
              strokeWidth={iconStrokeWidthBySize.small}
              className="text-grey-600 hover:text-primary hover:cursor-pointer"
            />
          </div>
        )}
        {selected && (
          <Text color="default1" className="text-sm leading-[1.75] font-semibold uppercase">
            {intl.formatMessage(commonMessages.selected)}
          </Text>
        )}
      </DashboardCard.Content>
    </DashboardCard>
  );
};

CustomerAddressChoiceCard.displayName = "CustomerAddressChoiceCard";
export default CustomerAddressChoiceCard;
