import { useEffect, useMemo, useRef } from "react";
import { useCheckoutCustomerAttachMutation } from "@/checkout/graphql";
import { useSubmit } from "@/checkout/hooks/useSubmit/useSubmit";
import { useUser } from "@/checkout/hooks/useUser";
import { useCheckout } from "@/checkout/hooks/useCheckout";

export const useCustomerAttach = () => {
	const { checkout, fetching: fetchingCheckout, refetch } = useCheckout();
	const { authenticated } = useUser();

	const [{ fetching: fetchingCustomerAttach }, customerAttach] = useCheckoutCustomerAttachMutation();
	const hasAttachedRef = useRef(false);

	const onSubmit = useSubmit<{}, typeof customerAttach>(
		useMemo(
			() => ({
				hideAlerts: true,
				scope: "checkoutCustomerAttach",
				shouldAbort: () =>
					!!checkout?.user?.id || !authenticated || fetchingCustomerAttach || fetchingCheckout || hasAttachedRef.current,
				onSubmit: customerAttach,
				parse: ({ languageCode, checkoutId }) => ({ languageCode, checkoutId }),
				onError: ({ errors }) => {
					if (
						errors.some(
							(error) =>
								error?.message?.includes(
									"[GraphQL] You cannot reassign a checkout that is already attached to a user.",
								),
						)
					) {
						refetch();
					}
				},
			}),
			[authenticated, checkout?.user?.id, customerAttach, fetchingCheckout, fetchingCustomerAttach, refetch],
		),
	);

	// Only attach once when conditions are met
	useEffect(() => {
		// Skip if already attached or conditions not met
		if (hasAttachedRef.current || !authenticated || !!checkout?.user?.id || fetchingCustomerAttach || fetchingCheckout) {
			return;
		}

		// Mark as attempting to prevent repeated calls
		hasAttachedRef.current = true;
		
		onSubmit().then(() => {
			// Reset if attachment failed (will be checked by shouldAbort on next render)
			if (!checkout?.user?.id) {
				hasAttachedRef.current = false;
			}
		}).catch(() => {
			hasAttachedRef.current = false;
		});
	}, [authenticated, checkout?.user?.id, fetchingCustomerAttach, fetchingCheckout, onSubmit]);

	// Reset ref when checkout user changes (successful attach)
	useEffect(() => {
		if (checkout?.user?.id) {
			hasAttachedRef.current = true;
		} else if (!authenticated) {
			hasAttachedRef.current = false;
		}
	}, [checkout?.user?.id, authenticated]);
};
