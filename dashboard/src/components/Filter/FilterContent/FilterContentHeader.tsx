import { Button } from "@dashboard/components/Button";
import { buttonMessages } from "@dashboard/intl";
import { Text } from "@saleor/macaw-ui-next";
import { FormattedMessage } from "react-intl";

interface FilterContentHeaderProps {
  onClear: () => void;
}

export const FilterContentHeader = ({ onClear }: FilterContentHeaderProps) => {
  return (
    <div className="flex items-center justify-between sticky top-0 py-2 px-6 bg-default-1 border-b border-default-1 z-[1]">
      <Text className="font-semibold">
        <FormattedMessage id="zSOvI0" defaultMessage="Filters" />
      </Text>
      <div>
        <Button
          data-test-id="clear"
          variant="secondary"
          className="mr-2"
          onClick={onClear}
        >
          <FormattedMessage {...buttonMessages.clear} />
        </Button>
        <Button data-test-id="submit" variant="primary" type="submit">
          <FormattedMessage {...buttonMessages.done} />
        </Button>
      </div>
    </div>
  );
};
