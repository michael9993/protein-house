// @ts-strict-ignore
import InlineAlert from "@dashboard/components/Alert/InlineAlert";
import { errorTracker } from "@dashboard/services/errorTracking";
import { Text } from "@saleor/macaw-ui-next";
import { useIntl } from "react-intl";

import { validationMessages } from "../messages";
import { FilterElement, FilterErrorMessages, FilterErrors } from "../types";

interface FilterErrorsListProps<T extends string = string> {
  filter: FilterElement<T>;
  errors?: FilterErrors;
  errorMessages?: FilterErrorMessages<T>;
}

export const FilterErrorsList = ({
  filter: { dependencies },
  errors = [],
  errorMessages,
}: FilterErrorsListProps) => {
  const intl = useIntl();
  const getErrorMessage = (code: string) => {
    try {
      return intl.formatMessage(errorMessages?.[code] || validationMessages[code], {
        dependencies: dependencies?.join(),
      });
    } catch (e) {
      errorTracker.captureException(e as Error);
      console.warn("Translation missing for filter error code: ", code);

      return intl.formatMessage(validationMessages.UNKNOWN_ERROR);
    }
  };

  if (!errors.length) {
    return null;
  }

  return (
    <div className="bg-primary/10 pt-6 px-6">
      {!!errors.length && (
        <InlineAlert>
          {errors.map(code => (
            <div className="flex items-center" key={code}>
              <div className="bg-primary-contrastText mr-2 rounded-full size-2 min-h-2 min-w-2" />
              <Text className="text-primary-contrastText">{getErrorMessage(code)}</Text>
            </div>
          ))}
        </InlineAlert>
      )}
    </div>
  );
};
