// @ts-strict-ignore
import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { ListPageLayout } from "@dashboard/components/Layouts";
import { customerUrl } from "@dashboard/customers/urls";
import { AddressTypeEnum, CustomerAddressesFragment } from "@dashboard/graphql";
import { getStringOrPlaceholder, renderCollection } from "@dashboard/misc";
import { Box, Button, Text } from "@saleor/macaw-ui-next";
import { defineMessages, useIntl } from "react-intl";

import CustomerAddress from "../CustomerAddress/CustomerAddress";

interface CustomerAddressListPageProps {
  customer: CustomerAddressesFragment;
  disabled: boolean;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onSetAsDefault: (id: string, type: AddressTypeEnum) => void;
}

const messages = defineMessages({
  addAddress: {
    id: "rjy9/k",
    defaultMessage: "Add address",
    description: "button",
  },
  doesntHaveAddresses: {
    id: "kErneR",
    defaultMessage:
      "This customer doesn’t have any adresses added to his address book. You can add address using the button below.",
  },
  fullNameAddress: {
    id: "n5vskv",
    defaultMessage: "{fullName}'s Address Book",
    description: "customer's address book, header",
  },
  noNameToShow: {
    id: "CWqmRU",
    defaultMessage: "Address Book",
    description: "customer's address book when no customer name is available, header",
  },
  fullNameDetail: {
    id: "MpR4zK",
    defaultMessage: "{fullName} Details",
    description: "customer details, header",
  },
  noAddressToShow: {
    id: "y/UWBR",
    defaultMessage: "There is no address to show for this customer",
  },
});

const CustomerAddressListPage = (props: CustomerAddressListPageProps) => {
  const { customer, disabled, onAdd, onEdit, onRemove, onSetAsDefault } = props;

  const intl = useIntl();

  const isEmpty = customer?.addresses?.length === 0;
  const fullName = getStringOrPlaceholder(
    customer && [customer.firstName, customer.lastName].join(" "),
  );

  return (
    <ListPageLayout>
      <TopNav
        href={customerUrl(customer?.id)}
        title={
          fullName.trim().length > 0
            ? intl.formatMessage(messages.fullNameAddress, { fullName })
            : intl.formatMessage(messages.noNameToShow)
        }
      >
        {!isEmpty && (
          <Button variant="primary" onClick={onAdd} data-test-id="add-address">
            {intl.formatMessage(messages.addAddress)}
          </Button>
        )}
      </TopNav>
      {isEmpty ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          padding={6}
          flexDirection="column"
        >
          <Text size={3} fontWeight="bold" lineHeight={2}>
            {intl.formatMessage(messages.noAddressToShow)}
          </Text>
          <Text className="mt-2">
            {intl.formatMessage(messages.doesntHaveAddresses)}
          </Text>
          <Button className="mt-4" variant="primary" onClick={onAdd}>
            {intl.formatMessage(messages.addAddress)}
          </Button>
        </Box>
      ) : (
        <div className="grid gap-6 grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1">
          {renderCollection(customer?.addresses, (address, addressNumber) => (
            <CustomerAddress
              address={address}
              addressNumber={addressNumber + 1}
              disabled={disabled}
              isDefaultBillingAddress={customer?.defaultBillingAddress?.id === address?.id}
              isDefaultShippingAddress={customer?.defaultShippingAddress?.id === address?.id}
              onEdit={() => onEdit(address.id)}
              onRemove={() => onRemove(address.id)}
              onSetAsDefault={type => onSetAsDefault(address.id, type)}
              key={address?.id || "skeleton"}
            />
          ))}
        </div>
      )}
    </ListPageLayout>
  );
};

CustomerAddressListPage.displayName = "CustomerAddressListPage";
export default CustomerAddressListPage;
