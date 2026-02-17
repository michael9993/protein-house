// @ts-strict-ignore
import { ConfirmButton, ConfirmButtonTransitionState } from "@dashboard/components/ConfirmButton";
import { DashboardModal } from "@dashboard/components/Modal";
import CustomerAddressChoiceCard from "@dashboard/customers/components/CustomerAddressChoiceCard";
import { AddressFragment, AddressTypeEnum } from "@dashboard/graphql";
import { FormChange } from "@dashboard/hooks/useForm";
import { buttonMessages } from "@dashboard/intl";
import { getById } from "@dashboard/misc";
import Checkbox from "@dashboard/components/Checkbox";
import { Button, SearchIcon } from "@saleor/macaw-ui";
import { Input } from "@saleor/macaw-ui-next";
import * as React from "react";
import { FormattedMessage, useIntl } from "react-intl";

import { dialogMessages as messages } from "./messages";
import { parseQuery, stringifyAddress } from "./utils";

interface OrderCustomerAddressesSearchProps {
  type: AddressTypeEnum;
  cloneAddress: boolean;
  formChange: FormChange;
  openFromCustomerChange: boolean;
  transitionState: ConfirmButtonTransitionState;
  selectedCustomerAddressId: string;
  customerAddresses: AddressFragment[];
  onChangeCustomerShippingAddress: (customerAddress: AddressFragment) => void;
  onChangeCustomerBillingAddress: (customerAddress: AddressFragment) => void;
  exitSearch: () => any;
}

const OrderCustomerAddressesSearch = (props: OrderCustomerAddressesSearchProps) => {
  const {
    type,
    cloneAddress,
    formChange,
    transitionState,
    openFromCustomerChange,
    selectedCustomerAddressId,
    customerAddresses,
    onChangeCustomerShippingAddress,
    onChangeCustomerBillingAddress,
    exitSearch,
  } = props;
  const intl = useIntl();
  const initialAddress = customerAddresses.find(getById(selectedCustomerAddressId));
  const [query, setQuery] = React.useState("");
  const [temporarySelectedAddress, setTemporarySelectedAddress] = React.useState(initialAddress);
  const handleSelect = () => {
    if (type === AddressTypeEnum.SHIPPING) {
      onChangeCustomerShippingAddress(temporarySelectedAddress);
    } else {
      onChangeCustomerBillingAddress(temporarySelectedAddress);
    }

    if (openFromCustomerChange) {
      exitSearch();
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  const filteredCustomerAddresses = customerAddresses.filter(address => {
    const parsedAddress = stringifyAddress(address);

    return parsedAddress.search(new RegExp(parseQuery(query), "i")) >= 0;
  });

  return (
    <>
      {intl.formatMessage(messages.searchInfo)}

      <Input
        size="small"
        value={query}
        onChange={handleChange}
        placeholder={"Search addresses"}
        startAdornment={
          <SearchIcon onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
        }
      />

      <div className="max-h-[400px] overflow-y-scroll">
        {filteredCustomerAddresses.length === 0
          ? intl.formatMessage(messages.noResultsFound)
          : filteredCustomerAddresses?.map(address => (
              <React.Fragment key={address.id}>
                <CustomerAddressChoiceCard
                  selected={address.id === temporarySelectedAddress.id}
                  onSelect={() => setTemporarySelectedAddress(address)}
                  address={address}
                />
              </React.Fragment>
            ))}
      </div>

      {!openFromCustomerChange && filteredCustomerAddresses.length !== 0 && (
        <label className="inline-flex items-center gap-0 cursor-pointer">
          <Checkbox
            checked={cloneAddress}
            name="cloneAddress"
            onChange={() =>
              formChange({
                target: {
                  name: "cloneAddress",
                  value: !cloneAddress,
                },
              })
            }
          />
          <span className="text-sm">
            {intl.formatMessage(
              type === AddressTypeEnum.SHIPPING
                ? messages.billingSameAsShipping
                : messages.shippingSameAsBilling,
            )}
          </span>
        </label>
      )}

      <DashboardModal.Actions>
        <Button onClick={exitSearch} variant="secondary">
          <FormattedMessage {...buttonMessages.cancel} />
        </Button>
        <ConfirmButton
          variant="primary"
          transitionState={transitionState}
          type={openFromCustomerChange ? undefined : "submit"}
          onClick={handleSelect}
        >
          <FormattedMessage {...buttonMessages.select} />
        </ConfirmButton>
      </DashboardModal.Actions>
    </>
  );
};

OrderCustomerAddressesSearch.displayName = "OrderCustomerAddressesSearch";
export default OrderCustomerAddressesSearch;
