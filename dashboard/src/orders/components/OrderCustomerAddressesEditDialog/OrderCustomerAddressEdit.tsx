// @ts-strict-ignore
import { AddressEdit } from "@dashboard/components/AddressEdit/AddressEdit";
import CardSpacer from "@dashboard/components/CardSpacer";
import FormSpacer from "@dashboard/components/FormSpacer";
import CustomerAddressChoiceCard from "@dashboard/customers/components/CustomerAddressChoiceCard";
import { AddressTypeInput } from "@dashboard/customers/types";
import { AccountErrorFragment, AddressFragment, OrderErrorFragment } from "@dashboard/graphql";
import { FormChange } from "@dashboard/hooks/useForm";
import { getById } from "@dashboard/misc";
import { Box, Option, RadioGroup, Skeleton, Text } from "@saleor/macaw-ui-next";
import * as React from "react";
import { useIntl } from "react-intl";

import { AddressInputOptionEnum } from "./form";
import { addressEditMessages } from "./messages";

export interface OrderCustomerAddressEditProps {
  loading: boolean;
  customerAddresses: AddressFragment[];
  countryChoices: Option[];
  addressInputOption: AddressInputOptionEnum;
  addressInputName: string;
  onChangeAddressInputOption: FormChange;
  selectedCustomerAddressId: string;
  formAddress: AddressTypeInput;
  formAddressCountryDisplayName: string;
  formErrors: Array<AccountErrorFragment | OrderErrorFragment>;
  onChangeFormAddress: (event: React.ChangeEvent<any>) => void;
  onChangeFormAddressCountry: (event: React.ChangeEvent<any>) => void;
  onEdit?: () => void;
  showCard?: boolean;
}

const OrderCustomerAddressEdit = (props: OrderCustomerAddressEditProps) => {
  const {
    loading,
    customerAddresses,
    countryChoices,
    addressInputOption,
    addressInputName,
    onChangeAddressInputOption,
    selectedCustomerAddressId,
    formAddress,
    formAddressCountryDisplayName,
    formErrors,
    onChangeFormAddress,
    onChangeFormAddressCountry,
    onEdit,
    showCard = true,
  } = props;
  const intl = useIntl();

  if (loading) {
    return <Skeleton />;
  }

  if (!customerAddresses.length) {
    return (
      <AddressEdit
        countries={countryChoices}
        countryDisplayValue={formAddressCountryDisplayName}
        data={formAddress}
        errors={formErrors}
        onChange={onChangeFormAddress}
        onCountryChange={onChangeFormAddressCountry}
      />
    );
  }

  return (
    <RadioGroup
      className="block"
      value={addressInputOption}
      name={addressInputName}
      onValueChange={value =>
        onChangeAddressInputOption({ target: { name: addressInputName, value } } as any)
      }
    >
      <RadioGroup.Item
        value={AddressInputOptionEnum.CUSTOMER_ADDRESS}
        id={`${addressInputName}-customer-address`}
        data-test-id={AddressInputOptionEnum.CUSTOMER_ADDRESS}
        className="block"
      >
        <Text>{intl.formatMessage(addressEditMessages.customerAddress)}</Text>
      </RadioGroup.Item>
      {addressInputOption === AddressInputOptionEnum.CUSTOMER_ADDRESS && showCard && (
        <>
          <CardSpacer />
          <CustomerAddressChoiceCard
            address={customerAddresses.find(getById(selectedCustomerAddressId))}
            editable
            onEditClick={onEdit}
          />
          <FormSpacer />
        </>
      )}
      <RadioGroup.Item
        value={AddressInputOptionEnum.NEW_ADDRESS}
        id={`${addressInputName}-new-address`}
        data-test-id={AddressInputOptionEnum.NEW_ADDRESS}
        className="block"
      >
        <Text>{intl.formatMessage(addressEditMessages.newAddress)}</Text>
      </RadioGroup.Item>
      {addressInputOption === AddressInputOptionEnum.NEW_ADDRESS && (
        <Box display="grid" gap={5}>
          <AddressEdit
            countries={countryChoices}
            countryDisplayValue={formAddressCountryDisplayName}
            data={formAddress}
            errors={formErrors}
            onChange={onChangeFormAddress}
            onCountryChange={onChangeFormAddressCountry}
          />
        </Box>
      )}
    </RadioGroup>
  );
};

OrderCustomerAddressEdit.displayName = "OrderCustomerAddressEdit";
export default OrderCustomerAddressEdit;
