import HorizontalSpacer from "@dashboard/components/HorizontalSpacer";
import { sectionNames } from "@dashboard/intl";
import { FormattedMessage } from "react-intl";

const TaxPageTitle = () => {
  return (
    <div className="flex">
      <FormattedMessage {...sectionNames.taxes} />
      <HorizontalSpacer />
    </div>
  );
};

export default TaxPageTitle;
