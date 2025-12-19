import { type OrderFragment, type ShippingFragment } from "@/checkout/graphql";

const isShipping = (deliveryMethod: OrderFragment["deliveryMethod"]): deliveryMethod is ShippingFragment =>
	deliveryMethod?.__typename === "ShippingMethod";

export const DeliverySection = ({ deliveryMethod }: { deliveryMethod: OrderFragment["deliveryMethod"] }) => {
	const getDeliveryEstimateText = () => {
		const { minimumDeliveryDays: min, maximumDeliveryDays: max } = deliveryMethod as ShippingFragment;

		if (!min || !max) {
			return undefined;
		}

		return `${min}-${max} business days`;
	};

	const estimateText = isShipping(deliveryMethod) ? getDeliveryEstimateText() : null;

	return (
		<div className="px-6 py-4">
			<div className="flex items-start gap-3">
				<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
					<svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
					</svg>
				</div>
				<div className="flex-1">
					<p className="text-sm font-medium text-neutral-500">Delivery Method</p>
					{!isShipping(deliveryMethod) ? (
						<p className="mt-0.5 text-neutral-600">Not applicable</p>
					) : (
						<div className="mt-0.5">
							<p className="font-medium text-neutral-900">{deliveryMethod.name}</p>
							{estimateText && (
								<p className="text-sm text-neutral-600">
									<span className="inline-flex items-center gap-1">
										<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										Est. {estimateText}
									</span>
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
