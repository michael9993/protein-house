import { useOrder } from "@/checkout/hooks/useOrder";
import { usePaymentStatus } from "@/checkout/sections/PaymentSection/utils";

export const PaymentSection = () => {
	const { order } = useOrder();
	const paymentStatus = usePaymentStatus(order);

	const getStatusConfig = () => {
		switch (paymentStatus) {
			case "authorized":
				return {
					icon: (
						<svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					),
					label: "Authorized",
					message: "We've received your payment authorization",
					bgColor: "bg-green-100",
					textColor: "text-green-700",
				};
			case "paidInFull":
				return {
					icon: (
						<svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					),
					label: "Paid",
					message: "We've received your payment",
					bgColor: "bg-green-100",
					textColor: "text-green-700",
				};
			case "overpaid":
				return {
					icon: (
						<svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					),
					label: "Overpaid",
					message: "Contact support for refund assistance",
					bgColor: "bg-amber-100",
					textColor: "text-amber-700",
				};
			default:
				return {
					icon: (
						<svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
						</svg>
					),
					label: "Processing",
					message: "Payment is being processed",
					bgColor: "bg-neutral-100",
					textColor: "text-neutral-700",
				};
		}
	};

	const status = getStatusConfig();

	return (
		<div className="px-6 py-4" data-testid="paymentStatus">
			<div className="flex items-start gap-3">
				<div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${status.bgColor}`}>
					{status.icon}
				</div>
				<div className="flex-1">
					<div className="flex items-center gap-2">
						<p className="text-sm font-medium text-neutral-500">Payment</p>
						<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.bgColor} ${status.textColor}`}>
							{status.label}
						</span>
					</div>
					<p className="mt-0.5 text-sm text-neutral-600">{status.message}</p>
				</div>
			</div>
		</div>
	);
};
