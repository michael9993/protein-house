import { DeliverySection } from "./DeliverySection";
import { PaymentSection } from "./PaymentSection";
import { Address } from "@/checkout/components/Address";
import { useOrder } from "@/checkout/hooks/useOrder";

export const OrderInfo = () => {
	const {
		order: { deliveryMethod, shippingAddress, billingAddress, userEmail },
	} = useOrder();

	return (
		<div className="rounded-xl border bg-white" style={{ borderColor: "var(--store-neutral-200)" }}>
			<div className="border-b px-6 py-4" style={{ borderColor: "var(--store-neutral-100)" }}>
				<h2 className="font-semibold" style={{ color: "var(--store-text)" }}>Order Details</h2>
			</div>

			<div className="divide-y" style={{ "--tw-divide-color": "var(--store-neutral-100)" } as React.CSSProperties}>
				{/* Payment Status */}
				<PaymentSection />

				{/* Delivery Method */}
				<DeliverySection deliveryMethod={deliveryMethod} />

				{/* Contact */}
				<div className="px-6 py-4">
					<div className="flex items-start gap-3">
						<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--store-neutral-100)" }}>
							<svg className="h-5 w-5" style={{ color: "var(--store-neutral-600)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
						</div>
						<div className="flex-1">
							<p className="text-sm font-medium" style={{ color: "var(--store-text-muted)" }}>Contact</p>
							<p className="mt-0.5" style={{ color: "var(--store-text)" }}>{userEmail}</p>
						</div>
					</div>
				</div>

				{/* Addresses */}
				{(shippingAddress || billingAddress) && (
					<div className="px-6 py-4">
						<div className="grid gap-6 sm:grid-cols-2">
							{shippingAddress && (
								<div className="flex items-start gap-3">
									<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--store-neutral-100)" }}>
										<svg className="h-5 w-5" style={{ color: "var(--store-neutral-600)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
									</div>
									<div className="flex-1">
										<p className="text-sm font-medium" style={{ color: "var(--store-text-muted)" }}>Shipping Address</p>
										<div className="mt-1 text-sm" style={{ color: "var(--store-text)" }}>
											<Address address={shippingAddress} />
										</div>
									</div>
								</div>
							)}
							{billingAddress && (
								<div className="flex items-start gap-3">
									<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--store-neutral-100)" }}>
										<svg className="h-5 w-5" style={{ color: "var(--store-neutral-600)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
									</div>
									<div className="flex-1">
										<p className="text-sm font-medium" style={{ color: "var(--store-text-muted)" }}>Billing Address</p>
										<div className="mt-1 text-sm" style={{ color: "var(--store-text)" }}>
											<Address address={billingAddress} />
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
