import React, { type PropsWithChildren } from "react";
import { Money, type MoneyProps } from "@/checkout/components/Money";

export interface SummaryMoneyRowProps extends MoneyProps {
	label: string;
}

export const SummaryMoneyRow: React.FC<PropsWithChildren<SummaryMoneyRowProps>> = ({
	label,
	children,
	...moneyProps
}) => {
	return (
		<div className="flex items-center justify-between text-sm">
			<div className="flex items-center gap-1.5 text-neutral-600">
				<span>{label}</span>
				{children}
			</div>
			<Money {...moneyProps} className="font-medium text-neutral-900" />
		</div>
	);
};
