/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useState } from "react";
import { toast } from "react-toastify";
import { type AddressFormData } from "@/checkout/components/AddressForm/types";
import { AddressForm, type AddressFormProps } from "@/checkout/components/AddressForm";
import {
	type AddressFragment,
	type CountryCode,
	useUserAddressDeleteMutation,
	useUserAddressUpdateMutation,
} from "@/checkout/graphql";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import { getAddressFormDataFromAddress, getAddressInputData } from "@/checkout/components/AddressForm/utils";
import { type ChangeHandler, useForm } from "@/checkout/hooks/useForm";
import { useFormSubmit } from "@/checkout/hooks/useFormSubmit";
import { AddressFormActions } from "@/checkout/components/ManualSaveAddressForm";
import { useAddressFormSchema } from "@/checkout/components/AddressForm/useAddressFormSchema";
import { useSubmit } from "@/checkout/hooks/useSubmit/useSubmit";
import { useUser } from "@/checkout/hooks/useUser";

export interface AddressEditFormProps extends Pick<AddressFormProps, "title" | "availableCountries"> {
	address: AddressFragment;
	onUpdate: (address: AddressFragment) => void;
	onDelete: (id: string) => void;
	onClose: () => void;
}

export const AddressEditForm: React.FC<AddressEditFormProps> = ({
	onUpdate,
	onClose,
	onDelete,
	address,
	availableCountries,
}) => {
	const [{ fetching: updating }, userAddressUpdate] = useUserAddressUpdateMutation();
	const [{ fetching: deleting }, userAddressDelete] = useUserAddressDeleteMutation();
	const { setCountryCode, validationSchema } = useAddressFormSchema();
	const { reload: reloadUser } = useUser();
	const [isSuccess, setIsSuccess] = useState(false);

	const onSubmit = useFormSubmit<AddressFormData, typeof userAddressUpdate>({
		scope: "userAddressUpdate",
		onSubmit: userAddressUpdate,
		parse: (formData) => ({ id: address.id, address: { ...getAddressInputData(formData) } }),
		onSuccess: async ({ data: { address: updatedAddress } }) => {
			if (updatedAddress) {
				// Show success state
				setIsSuccess(true);
				
				// Show success toast notification
				toast.success("Address updated successfully!", {
					position: "top-right",
					autoClose: 2000,
					hideProgressBar: true,
				});
				
				// Reload user data to get updated addresses list
				await reloadUser();
				
				onUpdate(updatedAddress);
				
				// Close after showing success
				setTimeout(() => {
					setIsSuccess(false);
					onClose();
				}, 500);
			} else {
				onClose();
			}
		},
	});

	const onAddressDelete = useSubmit<{ id: string }, typeof userAddressDelete>({
		scope: "userAddressDelete",
		onSubmit: userAddressDelete,
		parse: ({ id }) => ({ id }),
		onSuccess: ({ formData: { id } }) => {
			onDelete(id);
			onClose();
		},
	});

	const form = useForm<AddressFormData>({
		validationSchema,
		initialValues: getAddressFormDataFromAddress(address),
		onSubmit,
	});

	const { handleSubmit, handleChange } = form;

	const onChange: ChangeHandler = (event) => {
		const { name, value } = event.target;

		if (name === "countryCode") {
			setCountryCode(value as CountryCode);
		}

		handleChange(event);
	};

	return (
		<FormProvider form={{ ...form, handleChange: onChange }}>
			<AddressForm title="Edit address" availableCountries={availableCountries}>
				{isSuccess && (
					<div className="mb-4 flex items-center gap-2 rounded-md border px-4 py-3 text-sm" style={{ backgroundColor: "var(--store-success-bg)", borderColor: "var(--store-success-border)", color: "var(--store-success-text)" }}>
						<svg
							className="h-5 w-5 flex-shrink-0"
							style={{ color: "var(--store-success)" }}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<span>Address updated successfully!</span>
					</div>
				)}
				<AddressFormActions
					onSubmit={handleSubmit}
					loading={updating || deleting}
					onCancel={onClose}
					onDelete={() => onAddressDelete({ id: address.id })}
					success={isSuccess}
				/>
			</AddressForm>
		</FormProvider>
	);
};
