/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useState } from "react";
import { toast } from "react-toastify";
import { type AddressFormData } from "@/checkout/components/AddressForm/types";
import { getEmptyAddressFormData, getAddressInputData } from "@/checkout/components/AddressForm/utils";
import { type ChangeHandler, useForm } from "@/checkout/hooks/useForm";
import { useFormSubmit } from "@/checkout/hooks/useFormSubmit";
import { AddressFormActions } from "@/checkout/components/ManualSaveAddressForm";
import { useAddressFormSchema } from "@/checkout/components/AddressForm/useAddressFormSchema";
import { AddressForm, type AddressFormProps } from "@/checkout/components/AddressForm";
import { type AddressFragment, type CountryCode, useUserAddressCreateMutation } from "@/checkout/graphql";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import { useUser } from "@/checkout/hooks/useUser";

export interface AddressCreateFormProps extends Pick<AddressFormProps, "availableCountries"> {
	onSuccess: (address: AddressFragment) => void | Promise<void>;
	onClose: () => void;
}

export const AddressCreateForm: React.FC<AddressCreateFormProps> = ({
	onSuccess,
	onClose,
	availableCountries,
}) => {
	const [, userAddressCreate] = useUserAddressCreateMutation();
	const { setCountryCode, validationSchema } = useAddressFormSchema();
	const { reload: reloadUser } = useUser();
	const [isSuccess, setIsSuccess] = useState(false);

	const onSubmit = useFormSubmit<AddressFormData, typeof userAddressCreate>({
		scope: "userAddressCreate",
		onSubmit: async (vars) => {
			console.log("[AddressCreateForm] 🔍 ===== Starting address creation =====");
			console.log("[AddressCreateForm] 🔍 Mutation variables:", vars);
			console.log("[AddressCreateForm] 🔍 Current cookies:", typeof document !== "undefined" ? document.cookie : "N/A (server)");
			
			// Log the mutation function details
			console.log("[AddressCreateForm] 🔍 Mutation function:", userAddressCreate);
			
			const result = await userAddressCreate(vars);
			
			console.log("[AddressCreateForm] 🔍 ===== Mutation completed =====");
			console.log("[AddressCreateForm] 🔍 Mutation result:", {
				data: result.data,
				error: result.error,
				hasData: !!result.data,
				hasError: !!result.error,
				errorMessage: result.error?.message,
				graphQLErrors: result.error?.graphQLErrors,
			});
			
			// Log GraphQL field errors if present (only if there are actual errors, not empty array)
			const accountAddressCreate = result.data?.accountAddressCreate;
			if (accountAddressCreate?.errors && accountAddressCreate.errors.length > 0) {
				console.error("[AddressCreateForm] ❌ GraphQL field errors in response:", accountAddressCreate.errors);
				accountAddressCreate.errors.forEach((err: any, idx: number) => {
					console.error(`[AddressCreateForm] ❌ Field Error ${idx + 1}:`, {
						field: err.field,
						message: err.message,
						code: err.code,
					});
				});
			}
			
			if (result.error) {
				console.error("[AddressCreateForm] ❌ Full error details:", {
					message: result.error.message,
					graphQLErrors: result.error.graphQLErrors,
					networkError: result.error.networkError,
					response: result.error.response,
				});
			}
			
			return result;
		},
		parse: (addressFormData) => {
			const parsed = { address: getAddressInputData(addressFormData) };
			console.log("[AddressCreateForm] 🔍 Parsed address data:", parsed);
			return parsed;
		},
		onSuccess: async ({ data }) => {
			console.log("[AddressCreateForm] ✅ Success callback - data:", data);
			// The mutation returns accountAddressCreate with:
			// - address: the created address
			// - user: updated user with addresses array
			// - errors: array of errors (empty if successful)
			// The data passed to onSuccess is the accountAddressCreate object itself
			// (it has __typename: 'AccountAddressCreate')
			// So we access data.address directly, not data.accountAddressCreate.address
			const address = data?.address;
			const errors = data?.errors;
			
			// Only log errors if there are actual errors (not empty array)
			if (errors && Array.isArray(errors) && errors.length > 0) {
				console.error("[AddressCreateForm] ❌ GraphQL field errors:", errors);
				errors.forEach((error: any, index: number) => {
					console.error(`[AddressCreateForm] ❌ Error ${index + 1}:`, {
						field: error.field,
						message: error.message,
						code: error.code,
						fullError: error,
					});
				});
				return; // Don't proceed if there are errors
			}
			
			if (address) {
				console.log("[AddressCreateForm] ✅ Address created successfully:", address.id);
				
				// Show success state FIRST so user can see the feedback
				setIsSuccess(true);
				
				// Show success toast notification
				toast.success("Address saved successfully!", {
					position: "top-right",
					autoClose: 2000,
					hideProgressBar: true,
					className: "bg-green-50 border border-green-200 text-green-800",
				});
				
				// Wait for React to render the success state before proceeding
				// This ensures the success UI is visible before any state changes
				await new Promise((resolve) => setTimeout(resolve, 100));
				
				// Reload user data to get updated addresses list
				// This ensures the address list is fresh and includes the new address
				// The mutation returns updated user, but we need to refresh the context
				await reloadUser();
				
				// Call onSuccess which will:
				// 1. Add the address to the address list (via useAddressListForm)
				// 2. Automatically select it (sets selectedAddressId)
				// 3. Update the checkout shipping address (via handleSubmit in useAddressListForm)
				// IMPORTANT: Await onSuccess to ensure address list is updated before closing
				// This matches the Edit form behavior where onUpdate completes before closing
				await onSuccess(address as AddressFragment);
				
				// Wait a moment for React to re-render with the updated address list
				// This ensures the address list is visible before the form closes
				await new Promise((resolve) => setTimeout(resolve, 200));
				
				// Close after showing success (same timing as Edit form)
				// This ensures the success UI is visible and address list is updated before the form closes
				setTimeout(() => {
					setIsSuccess(false);
					onClose();
				}, 500);
			} else {
				// Only log as error if there are actual errors, otherwise it might be a different response structure
				const hasErrors = errors && Array.isArray(errors) && errors.length > 0;
				if (hasErrors) {
					console.error("[AddressCreateForm] ❌ Address creation failed - no address in response:", {
						errors,
						fullResponse: data,
					});
				} else {
					console.warn("[AddressCreateForm] ⚠️ No address in response, but no errors either. Response:", data);
				}
			}
		},
		onError: (errorProps) => {
			console.error("[AddressCreateForm] ❌ Error creating address:", {
				errors: errorProps.errors,
				graphqlErrors: errorProps.graphqlErrors,
				customErrors: errorProps.customErrors,
				formData: errorProps.formData,
				allProps: errorProps,
			});
		},
	});

	const form = useForm<AddressFormData>({
		validationSchema,
		initialValues: getEmptyAddressFormData(),
		onSubmit,
	});

	const { handleSubmit, isSubmitting, handleChange } = form;

	const onChange: ChangeHandler = (event) => {
		const { name, value } = event.target;

		if (name === "countryCode") {
			setCountryCode(value as CountryCode);
		}

		handleChange(event);
	};

	return (
		<FormProvider form={{ ...form, handleChange: onChange }}>
			<AddressForm title="Create address" availableCountries={availableCountries}>
				{isSuccess && (
					<div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
						<svg
							className="h-5 w-5 flex-shrink-0 text-green-600"
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
						<span>Address saved successfully!</span>
					</div>
				)}
				<AddressFormActions 
					onSubmit={handleSubmit} 
					loading={isSubmitting} 
					onCancel={onClose}
					success={isSuccess}
				/>
			</AddressForm>
		</FormProvider>
	);
};
