// @ts-strict-ignore
import { DashboardCard } from "@dashboard/components/Card";
import { AccountErrorFragment } from "@dashboard/graphql";
import { commonMessages } from "@dashboard/intl";
import { getFormErrors } from "@dashboard/utils/errors";
import getAccountErrorMessage from "@dashboard/utils/errors/account";
import { TextField } from "@mui/material";
import * as React from "react";
import { useIntl } from "react-intl";

import { CustomerCreatePageFormData } from "../CustomerCreatePage";

interface CustomerCreateDetailsProps {
  data: CustomerCreatePageFormData;
  disabled: boolean;
  errors: AccountErrorFragment[];
  onChange: (event: React.ChangeEvent<any>) => void;
}

const CustomerCreateDetails = (props: CustomerCreateDetailsProps) => {
  const { data, disabled, errors, onChange } = props;

  const intl = useIntl();

  const formErrors = getFormErrors(["customerFirstName", "customerLastName", "email"], errors);

  return (
    <DashboardCard>
      <DashboardCard.Header>
        <DashboardCard.Title>
          {intl.formatMessage({
            id: "fjPWOA",
            defaultMessage: "Customer Overview",
            description: "header",
          })}
        </DashboardCard.Title>
      </DashboardCard.Header>
      <DashboardCard.Content>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          <TextField
            data-test-id="customer-first-name"
            disabled={disabled}
            error={!!formErrors.customerFirstName}
            fullWidth
            name="customerFirstName"
            label={intl.formatMessage(commonMessages.firstName)}
            helperText={getAccountErrorMessage(formErrors.customerFirstName, intl)}
            type="text"
            value={data.customerFirstName}
            onChange={onChange}
            inputProps={{
              spellCheck: false,
            }}
          />
          <TextField
            data-test-id="customer-last-name"
            disabled={disabled}
            error={!!formErrors.customerLastName}
            fullWidth
            name="customerLastName"
            label={intl.formatMessage(commonMessages.lastName)}
            helperText={getAccountErrorMessage(formErrors.customerLastName, intl)}
            type="text"
            value={data.customerLastName}
            onChange={onChange}
            inputProps={{
              spellCheck: false,
            }}
          />
          <TextField
            data-test-id="customer-email"
            disabled={disabled}
            error={!!formErrors.email}
            fullWidth
            name="email"
            label={intl.formatMessage(commonMessages.email)}
            helperText={getAccountErrorMessage(formErrors.email, intl)}
            type="email"
            value={data.email}
            onChange={onChange}
            inputProps={{
              spellCheck: false,
            }}
          />
        </div>
      </DashboardCard.Content>
    </DashboardCard>
  );
};

CustomerCreateDetails.displayName = "CustomerCreateDetails";
export default CustomerCreateDetails;
