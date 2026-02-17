// @ts-strict-ignore
import { DashboardCard } from "@dashboard/components/Card";
import { AccountErrorFragment, CustomerDetailsQuery } from "@dashboard/graphql";
import { maybe } from "@dashboard/misc";
import { getFormErrors } from "@dashboard/utils/errors";
import getAccountErrorMessage from "@dashboard/utils/errors/account";
import { TextField } from "@mui/material";
import { Checkbox, Skeleton, Text } from "@saleor/macaw-ui-next";
import * as React from "react";
import { FormattedMessage, useIntl } from "react-intl";

interface CustomerDetailsProps {
  customer: CustomerDetailsQuery["user"];
  data: {
    isActive: boolean;
    note: string;
  };
  disabled: boolean;
  errors: AccountErrorFragment[];
  onChange: (event: React.ChangeEvent<any>) => void;
}

const CustomerDetails = (props: CustomerDetailsProps) => {
  const { customer, data, disabled, errors, onChange } = props;

  const intl = useIntl();

  const formErrors = getFormErrors(["note"], errors);

  return (
    <DashboardCard>
      <DashboardCard.Header>
        <DashboardCard.Title
          className="h-[72px]"
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <>
            {maybe<React.ReactNode>(() => customer.email, <Skeleton />)}
            {customer && customer.dateJoined ? (
              <Text className="mt-2" size={2} fontWeight="light">
                <FormattedMessage
                  id="MjUyhA"
                  defaultMessage="Active member since {date}"
                  description="section subheader"
                  values={{
                    date: new Intl.DateTimeFormat(undefined, {
                      month: "short",
                      year: "numeric",
                    }).format(new Date(customer.dateJoined)),
                  }}
                />
              </Text>
            ) : (
              <Skeleton style={{ width: "10rem" }} />
            )}
          </>
        </DashboardCard.Title>
      </DashboardCard.Header>
      <DashboardCard.Content className="pt-2">
        <Checkbox
          data-test-id="customer-active-checkbox"
          checked={data.isActive}
          className="mb-2"
          disabled={disabled}
          name="isActive"
          onCheckedChange={value => {
            onChange({
              target: {
                name: "isActive",
                value,
              },
            } as React.ChangeEvent<any>);
          }}
        >
          <Text fontSize={3}>
            {intl.formatMessage({
              id: "+NUzaQ",
              defaultMessage: "User account active",
              description: "check to mark this account as active",
            })}
          </Text>
        </Checkbox>
        <TextField
          data-test-id="customer-note"
          disabled={disabled}
          error={!!formErrors.note}
          fullWidth
          multiline
          helperText={getAccountErrorMessage(formErrors.note, intl)}
          name="note"
          label={intl.formatMessage({
            id: "uUQ+Al",
            defaultMessage: "Note",
            description: "note about customer",
          })}
          value={data.note}
          onChange={onChange}
        />
      </DashboardCard.Content>
    </DashboardCard>
  );
};

CustomerDetails.displayName = "CustomerDetails";
export default CustomerDetails;
