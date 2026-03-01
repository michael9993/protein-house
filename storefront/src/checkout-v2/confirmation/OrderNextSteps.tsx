"use client";

import { useCheckoutText } from "@/checkout-v2/hooks/useCheckoutText";

interface Props {
	channel: string;
}

export function OrderNextSteps({ channel }: Props) {
	const t = useCheckoutText();

	const steps = [
		{
			num: "1",
			title: t.orderProcessingStep ?? "Order Processing",
			desc: t.orderProcessingMessage ?? "We're preparing your order for shipment.",
			active: true,
		},
		{
			num: "2",
			title: t.shippingNotificationStep ?? "Shipping Notification",
			desc: t.shippingNotificationMessage ?? "You'll receive tracking info when shipped.",
			active: false,
		},
		{
			num: "3",
			title: t.deliveryStep ?? "Delivery",
			desc: t.deliveryMessage ?? "Your order will arrive at your doorstep!",
			active: false,
		},
	];

	return (
		<div className="space-y-4">
			{/* What's next steps */}
			<div className="rounded-xl border border-neutral-200 bg-white p-6 print:hidden">
				<h2 className="mb-4 font-semibold text-neutral-900">
					{t.whatsNextTitle ?? "What's Next?"}
				</h2>
				<div className="space-y-4">
					{steps.map((step) => (
						<div key={step.num} className="flex items-start gap-3">
							<div
								className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
									step.active
										? "bg-blue-50 text-blue-600"
										: "bg-neutral-100 text-neutral-500"
								}`}
							>
								{step.num}
							</div>
							<div>
								<p className="font-medium text-neutral-900">{step.title}</p>
								<p className="text-sm text-neutral-500">{step.desc}</p>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* CTA buttons */}
			<div className="flex flex-wrap gap-3 print:hidden">
				<a
					href={`/${channel}`}
					className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
					style={{ backgroundColor: "var(--store-primary, #6366f1)" }}
				>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
						/>
					</svg>
					{t.continueShoppingButton ?? "Continue Shopping"}
				</a>

				<button
					type="button"
					onClick={() => window.print()}
					className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
				>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
						/>
					</svg>
					{t.printReceiptButton ?? "Print Receipt"}
				</button>
			</div>
		</div>
	);
}
