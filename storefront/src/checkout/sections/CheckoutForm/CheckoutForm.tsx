import { Suspense, useState } from "react";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { Contact } from "@/checkout/sections/Contact";
import { DeliveryMethods } from "@/checkout/sections/DeliveryMethods";
import { ContactSkeleton } from "@/checkout/sections/Contact/ContactSkeleton";
import { DeliveryMethodsSkeleton } from "@/checkout/sections/DeliveryMethods/DeliveryMethodsSkeleton";
import { AddressSectionSkeleton } from "@/checkout/components/AddressSectionSkeleton";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { CollapseSection } from "@/checkout/sections/CheckoutForm/CollapseSection";
import { UserShippingAddressSection } from "@/checkout/sections/UserShippingAddressSection";
import { GuestShippingAddressSection } from "@/checkout/sections/GuestShippingAddressSection";
import { UserBillingAddressSection } from "@/checkout/sections/UserBillingAddressSection";
import { PaymentSection, PaymentSectionSkeleton } from "@/checkout/sections/PaymentSection";
import { GuestBillingAddressSection } from "@/checkout/sections/GuestBillingAddressSection";
import { useUser } from "@/checkout/hooks/useUser";
import { useCheckoutText } from "@/checkout/hooks/useCheckoutText";
import { CheckoutErrorBoundary } from "@/checkout/components/CheckoutErrorBoundary";

interface CheckoutStepProps {
	number: number;
	title: string;
	description?: string;
	children: React.ReactNode;
	isComplete?: boolean;
}

const CheckoutStep = ({ number, title, description, children, isComplete }: CheckoutStepProps) => (
	<div className="rounded-xl border bg-white shadow-sm" style={{ borderColor: "var(--store-neutral-200)" }}>
		<div className="flex items-center gap-4 border-b px-6 py-4" style={{ borderColor: "var(--store-neutral-100)" }}>
			<div 
				className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
				style={isComplete 
					? { backgroundColor: "var(--store-success-bg)", color: "var(--store-success-text)" }
					: { backgroundColor: "var(--store-primary)", color: "white" }
				}
			>
				{isComplete ? (
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
				) : (
					number
				)}
			</div>
			<div>
				<h3 className="font-semibold" style={{ color: "var(--store-text)" }}>{title}</h3>
				{description && <p className="text-sm" style={{ color: "var(--store-text-muted)" }}>{description}</p>}
			</div>
		</div>
		<div className="p-6">
			{children}
		</div>
	</div>
);

export const CheckoutForm = () => {
	const { user } = useUser();
	const { checkout } = useCheckout();
	const { passwordResetToken } = getQueryParams();
	const text = useCheckoutText();

	const [showOnlyContact, setShowOnlyContact] = useState(!!passwordResetToken);

	return (
		<div className="flex flex-col gap-6">
			{/* Contact Section */}
			<CheckoutStep
				number={1}
				isComplete={!!checkout?.email}
				title={text.contactInfoTitle || "Contact Information"}
				description={text.contactInfoSubtitle || "We'll use this to send order updates"}
			>
				<Suspense fallback={<ContactSkeleton />}>
					<Contact setShowOnlyContact={setShowOnlyContact} />
				</Suspense>
			</CheckoutStep>

			{/* Shipping Address + Billing Address + Delivery Methods */}
			{checkout?.isShippingRequired && (
				<CheckoutErrorBoundary>
					<Suspense fallback={<AddressSectionSkeleton />}>
						<CollapseSection collapse={showOnlyContact}>
							<CheckoutStep
								number={2}
								isComplete={!!checkout?.shippingAddress?.streetAddress1}
								title={text.shippingAddressTitle || "Shipping Address"}
								description={text.shippingAddressSubtitle || "Where should we deliver?"}
							>
								<div data-testid="shippingAddressSection">
									{user ? <UserShippingAddressSection /> : <GuestShippingAddressSection />}
								</div>
							</CheckoutStep>

							{/* Billing Address */}
							<div className="mt-6">
								<CheckoutStep
									number={3}
									isComplete={!!checkout?.billingAddress?.streetAddress1}
									title={text.billingAddressTitle || "Billing Address"}
									description={text.billingAddressSubtitle || "For your invoice"}
								>
									{user ? <UserBillingAddressSection /> : <GuestBillingAddressSection />}
								</CheckoutStep>
							</div>

							{/* Delivery Methods */}
							<div className="mt-6">
								<Suspense fallback={<DeliveryMethodsSkeleton />}>
									<CheckoutStep
										number={4}
										isComplete={!!checkout?.deliveryMethod?.id}
										title={text.deliveryMethodsTitle || "Delivery Method"}
										description={text.deliveryMethodsSubtitle || "Choose shipping speed"}
									>
										<DeliveryMethods />
									</CheckoutStep>
								</Suspense>
							</div>
						</CollapseSection>
					</Suspense>
				</CheckoutErrorBoundary>
			)}

			{/* Payment Section */}
			<Suspense fallback={<PaymentSectionSkeleton />}>
				<CollapseSection collapse={showOnlyContact}>
					<CheckoutStep
						number={checkout?.isShippingRequired ? 5 : 2}
						isComplete={checkout?.authorizeStatus === "FULL"}
						title={text.paymentTitle || "Payment"}
						description={text.paymentSubtitle || "Select your payment method"}
					>
						<PaymentSection />
					</CheckoutStep>
				</CollapseSection>
			</Suspense>
		</div>
	);
};
