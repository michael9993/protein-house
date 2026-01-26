import React, { Suspense } from "react";
import { useCheckoutFormValidationTrigger } from "@/checkout/hooks/useCheckoutFormValidationTrigger";
import { getById } from "@/checkout/lib/utils/common";
import { AddressSectionSkeleton } from "@/checkout/components/AddressSectionSkeleton";
import { UserAddressSectionContainer } from "@/checkout/sections/UserAddressSectionContainer";
import { useUserBillingAddressForm } from "@/checkout/sections/UserBillingAddressSection/useUserBillingAddressForm";
import { AddressCreateForm } from "@/checkout/sections/AddressCreateForm/AddressCreateForm";
import { AddressEditForm } from "@/checkout/sections/AddressEditForm/AddressEditForm";
import { AddressList } from "@/checkout/sections/AddressList/AddressList";
import { Checkbox } from "@/checkout/components";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import { useBillingSameAsShippingForm } from "@/checkout/sections/GuestBillingAddressSection/useBillingSameAsShippingForm";
import { type OptionalAddress } from "@/checkout/components/AddressForm/types";
import { getByMatchingAddress } from "@/checkout/components/AddressForm/utils";
import { type AddressFragment } from "@/checkout/graphql";
import { useCheckoutText } from "@/checkout/hooks/useCheckoutText";

interface UserBillingAddressSectionProps {}

export const UserBillingAddressSection: React.FC<UserBillingAddressSectionProps> = ({}) => {
	const { checkout } = useCheckout();
	const isShippingRequired = checkout?.isShippingRequired;
	const text = useCheckoutText();

	const {
		form,
		userAddressActions: { onAddressCreateSuccess, onAddressDeleteSuccess, onAddressUpdateSuccess },
	} = useUserBillingAddressForm();

	const {
		resetForm,
		values: { addressList },
	} = form;

	const handleSetBillingSameAsShipping = (address: OptionalAddress) => {
		const matchingAddress = addressList.find(getByMatchingAddress(address));

		if (!address || !matchingAddress) {
			return;
		}

		resetForm({ values: { selectedAddressId: matchingAddress.id, addressList } });
	};

	const billingSameAsShippingForm = useBillingSameAsShippingForm({
		autoSave: false,
		onSetBillingSameAsShipping: handleSetBillingSameAsShipping,
	});

	useCheckoutFormValidationTrigger({
		scope: "billingAddress",
		form: billingSameAsShippingForm,
	});

	const {
		values: { billingSameAsShipping },
	} = billingSameAsShippingForm;

	const billingAddressTitle = text.billingAddressTitle || "Billing address";

	return (
		<Suspense fallback={<AddressSectionSkeleton />}>
			{isShippingRequired && (
				<div className="mb-4">
					<FormProvider form={billingSameAsShippingForm}>
						<Checkbox
							name="billingSameAsShipping"
							label={text.useSameAsShipping || "Use shipping address as billing address"}
							data-testid={"useShippingAsBillingCheckbox"}
						/>
					</FormProvider>
				</div>
			)}
			{!billingSameAsShipping && (
				<div className="pb-2">
					<UserAddressSectionContainer>
						{({
							displayAddressCreate,
							displayAddressEdit,
							displayAddressList,
							setDisplayAddressCreate,
							setDisplayAddressEdit,
							editedAddressId,
						}) => (
							<>
								{displayAddressCreate && (
									<AddressCreateForm
										onClose={() => setDisplayAddressCreate(false)}
										onSuccess={onAddressCreateSuccess}
									/>
								)}

								{displayAddressEdit && (
									<AddressEditForm
										title={billingAddressTitle}
										onClose={() => setDisplayAddressEdit()}
										address={form.values.addressList.find(getById(editedAddressId)) as AddressFragment}
										onUpdate={onAddressUpdateSuccess}
										onDelete={onAddressDeleteSuccess}
									/>
								)}

								{displayAddressList && (
									<AddressList
										onEditChange={setDisplayAddressEdit}
										onAddAddressClick={() => setDisplayAddressCreate(true)}
										title={billingAddressTitle}
										form={form}
									/>
								)}
							</>
						)}
					</UserAddressSectionContainer>
				</div>
			)}
		</Suspense>
	);
};
