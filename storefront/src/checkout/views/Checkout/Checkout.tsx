import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { EmptyCartPage } from "../EmptyCartPage";
import { PageNotFound } from "../PageNotFound";
import { useUser } from "../../hooks/useUser";
import { Summary, SummarySkeleton } from "@/checkout/sections/Summary";
import { CheckoutForm, CheckoutFormSkeleton } from "@/checkout/sections/CheckoutForm";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useRemoveGiftLinesForPartialCheckout } from "@/checkout/hooks/useRemoveGiftLinesForPartialCheckout";
import { CheckoutSkeleton } from "@/checkout/views/Checkout/CheckoutSkeleton";

export const Checkout = () => {
	const { checkout, fetching: fetchingCheckout, hasValidCheckoutId } = useCheckout();
	const { loading: isAuthenticating } = useUser();

	// When user came from cart with partial selection (gift deselected), remove any gift lines Saleor re-adds
	useRemoveGiftLinesForPartialCheckout();

	// If no valid checkout ID in URL, show not found
	if (!hasValidCheckoutId) {
		return <PageNotFound reason="missing" />;
	}

	const isCheckoutInvalid = !fetchingCheckout && !checkout && !isAuthenticating;

	// Show skeleton while loading initial data (suspense disabled for smooth mutation updates)
	const isInitialLoading = (isAuthenticating || fetchingCheckout) && !checkout;

	const isEmptyCart = checkout && !checkout.lines.length;

	return isCheckoutInvalid ? (
		<PageNotFound reason="invalid" />
	) : isInitialLoading ? (
		<CheckoutSkeleton />
	) : (
		<ErrorBoundary FallbackComponent={PageNotFound}>
			<div>
				{isEmptyCart ? (
					<EmptyCartPage />
				) : (
					<div className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-2">
						<Suspense fallback={<CheckoutFormSkeleton />}>
							<CheckoutForm />
						</Suspense>
						<Suspense fallback={<SummarySkeleton />}>
							{checkout && (
								<Summary
									{...checkout}
									shippingPrice={checkout.shippingPrice}
									lines={checkout.lines || []}
								/>
							)}
						</Suspense>
					</div>
				)}
			</div>
		</ErrorBoundary>
	);
};
