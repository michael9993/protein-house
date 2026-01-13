import { compact } from "lodash-es";
import { useCallback, useEffect, useRef } from "react";
import { type OptionalAddress } from "@/checkout/components/AddressForm/types";
import { getByMatchingAddress, isMatchingAddress } from "@/checkout/components/AddressForm/utils";
import { type AddressFragment } from "@/checkout/graphql";
import { useAddressAvailability } from "@/checkout/hooks/useAddressAvailability";
import { useDebouncedSubmit } from "@/checkout/hooks/useDebouncedSubmit";
import { useForm } from "@/checkout/hooks/useForm";
import { type FormSubmitFn } from "@/checkout/hooks/useFormSubmit";
import { useUser } from "@/checkout/hooks/useUser";
import { getById, getByUnmatchingId } from "@/checkout/lib/utils/common";

export interface AddressListFormData {
	selectedAddressId: string | undefined;
	addressList: AddressFragment[];
}

interface UseAddressListProps {
	onSubmit: FormSubmitFn<AddressListFormData>;
	checkoutAddress: OptionalAddress;
	defaultAddress: OptionalAddress;
	checkAddressAvailability?: boolean;
}

export const useAddressListForm = ({
	onSubmit,
	checkoutAddress,
	defaultAddress,
	checkAddressAvailability = false,
}: UseAddressListProps) => {
	const { user, reload: _reloadUser } = useUser();

	const { isAvailable } = useAddressAvailability(!checkAddressAvailability);

	// sdk has outdated types
	const addresses = (user?.addresses || []) as AddressFragment[];
	
	// Update address list when user data changes (e.g., after address creation)
	// This handles the case when user goes from 0 addresses to 1+ addresses
	useEffect(() => {
		// Update when:
		// 1. User has addresses and the count changed (new address added/removed)
		// 2. User went from 0 addresses to having addresses (first address created)
		if (addresses.length !== addressList.length) {
			// User addresses have changed, update the form
			const matchingAddress = addresses.find(getByMatchingAddress(checkoutAddress));
			const addressToSelect = matchingAddress || addresses[0]; // Prefer matching checkout address, otherwise first address
			
			setValues({
				addressList: addresses,
				selectedAddressId: addressToSelect?.id,
			});
			
			// If we just got our first address and it's not already selected, select it
			if (addressToSelect && addressList.length === 0 && addresses.length > 0) {
				// The address will be selected via the setValues above, but we also need to trigger submit
				// to update the checkout. This is handled by the debouncedSubmit effect below.
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [addresses.length, user?.id]);

	const previousCheckoutAddress = useRef<OptionalAddress>(null);

	const form = useForm<AddressListFormData>({
		initialDirty: true,
		initialValues: {
			addressList: addresses,
			selectedAddressId: addresses.find(getByMatchingAddress(checkoutAddress))?.id,
		},
		onSubmit,
	});

	const { values, setValues, setFieldValue, handleSubmit } = form;

	const debouncedSubmit = useDebouncedSubmit(handleSubmit);

	const { addressList, selectedAddressId } = values;
	const selectedAddress = addressList.find(getById(selectedAddressId));

	useEffect(() => {
		debouncedSubmit();
	}, [debouncedSubmit, selectedAddressId]);

	const addressListUpdate = async (selectedAddress: OptionalAddress, addressList: AddressFragment[]) => {
		if (!selectedAddress) {
			return;
		}

		setValues({
			addressList,
			selectedAddressId: selectedAddress.id,
		});

		handleSubmit();
	};

	const onAddressCreateSuccess = async (address: OptionalAddress) => {
		// When creating the first address (addressList is empty), we need to ensure it's properly added and selected
		const updatedAddressList = compact([...addressList, address]);
		
		// Always update the address list and select the new address
		// This works for both: first address (0 -> 1) and subsequent addresses
		await addressListUpdate(address, updatedAddressList);
		
		// If this was the first address (going from 0 to 1), ensure proper state
		if (addressList.length === 0 && updatedAddressList.length === 1 && address) {
			// The addressListUpdate already handles selection and submission,
			// but we ensure the form state is properly updated
			// This is especially important for the first address scenario
			setValues({
				addressList: updatedAddressList,
				selectedAddressId: address.id,
			});
		}
	};

	const onAddressUpdateSuccess = async (address: OptionalAddress) =>
		addressListUpdate(
			address,
			addressList.map((existingAddress) => (existingAddress.id === address?.id ? address : existingAddress)),
		);

	const onAddressDeleteSuccess = (id: string) =>
		addressListUpdate(addressList[0], addressList.filter(getByUnmatchingId(id)));

	const handleDefaultAddressSet = useCallback(async () => {
		const isSelectedAddressSameAsCheckout =
			!!selectedAddress && isMatchingAddress(checkoutAddress, selectedAddress);

		const hasCheckoutAddressChanged = !isMatchingAddress(checkoutAddress, previousCheckoutAddress.current);

		// currently selected address is the same as checkout or
		// address hasn't changed at all -> do nothing
		if (isSelectedAddressSameAsCheckout || (checkoutAddress && !hasCheckoutAddressChanged)) {
			return;
		}

		const matchingDefaultAddressInAddresses = addressList.find(getByMatchingAddress(defaultAddress));
		// if not, prefer user default address
		if (defaultAddress && matchingDefaultAddressInAddresses) {
			previousCheckoutAddress.current = defaultAddress;
			void setFieldValue("selectedAddressId", matchingDefaultAddressInAddresses.id);
			return;
		}

		const firstAvailableAddress = addressList.find(isAvailable);

		// otherwise just choose any available
		if (firstAvailableAddress) {
			previousCheckoutAddress.current = firstAvailableAddress;
			void setFieldValue("selectedAddressId", firstAvailableAddress.id);
		}

		// otherwise it gets way overcomplicated to get this to run only when needed
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [defaultAddress?.id, checkoutAddress?.id]);

	useEffect(() => {
		void handleDefaultAddressSet();
	}, [handleDefaultAddressSet]);

	return {
		form,
		userAddressActions: {
			onAddressCreateSuccess,
			onAddressUpdateSuccess,
			onAddressDeleteSuccess,
		},
	};
};
