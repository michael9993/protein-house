import { AlertCircleIcon, CheckCircleIcon, ClockIcon, XCircle } from "lucide-react";
import { PaymentChargeStatusEnum } from "@/gql/graphql";

type Props = {
	status: PaymentChargeStatusEnum;
	labels?: {
		unpaid?: string;
		cancelled?: string;
		refused?: string;
		paid?: string;
		refunded?: string;
		partiallyPaid?: string;
		partiallyRefunded?: string;
		pending?: string;
	};
};

export const PaymentStatus = async ({ status, labels }: Props) => {
	switch (status) {
		case PaymentChargeStatusEnum.NotCharged:
			return (
				<p className="flex items-center gap-1 text-error-400">
					<XCircle className="h-4 w-4" aria-hidden />
					{labels?.unpaid ?? "unpaid"}
				</p>
			);
		case PaymentChargeStatusEnum.Cancelled:
			return (
				<p className="flex items-center gap-1 text-error-400">
					<XCircle className="h-4 w-4" aria-hidden />
					{labels?.cancelled ?? "cancelled"}
				</p>
			);
		case PaymentChargeStatusEnum.Refused:
			return (
				<p className="flex items-center gap-1 text-error-400">
					<XCircle className="h-4 w-4" aria-hidden />
					{labels?.refused ?? "refused"}
				</p>
			);
		case PaymentChargeStatusEnum.FullyCharged:
			return (
				<p className="flex items-center gap-1 text-success-600">
					<CheckCircleIcon className="h-4 w-4" aria-hidden />
					{labels?.paid ?? "paid"}
				</p>
			);
		case PaymentChargeStatusEnum.FullyRefunded:
			return (
				<p className="flex items-center gap-1 text-success-600">
					<CheckCircleIcon className="h-4 w-4" aria-hidden />
					{labels?.refunded ?? "refunded"}
				</p>
			);
		case PaymentChargeStatusEnum.PartiallyCharged:
			return (
				<p className="flex items-center gap-1 text-warning-500">
					<AlertCircleIcon className="h-4 w-4" aria-hidden />
					{labels?.partiallyPaid ?? "partially paid"}
				</p>
			);
		case PaymentChargeStatusEnum.PartiallyRefunded:
			return (
				<p className="flex items-center gap-1 text-warning-500">
					<AlertCircleIcon className="h-4 w-4" aria-hidden />
					{labels?.partiallyRefunded ?? "partially refunded"}
				</p>
			);
		case PaymentChargeStatusEnum.Pending:
			return (
				<p className="flex items-center gap-1 text-warning-500">
					<ClockIcon className="h-4 w-4" aria-hidden />
					{labels?.pending ?? "pending"}
				</p>
			);
	}
};
